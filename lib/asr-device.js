'use strict';
// Browser side of on-device speech input: mic capture to 16 kHz mono and the Whisper worker client.
// Nothing here uploads or stores audio; clips live in memory until transcription ends.
const ASR_MODEL_MB = 41, ASR_TOTAL_MB = 65; // q8 weights from the Hub / plus the 21.6 MB WebAssembly runtime
const ASR_RATE = 16000;
const asrFail = reason => Object.assign(new Error(reason), { reason });

function asrSupported() {
  return typeof Worker === 'function' && typeof WebAssembly === 'object' && typeof MediaRecorder === 'function'
    && !!navigator.mediaDevices?.getUserMedia && !!(window.AudioContext || window.webkitAudioContext);
}
const asrCached = async () => { try { return !!(await caches.has('transformers-cache')); } catch { return false; } };

async function asrDecode(blob) {
  const Ctx = window.AudioContext || window.webkitAudioContext, ctx = new Ctx({ sampleRate: ASR_RATE });
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const n = Math.min(Math.ceil(buf.duration * ASR_RATE), (ASR_MAX_MS / 1000 + 1) * ASR_RATE);
    const out = new Float32Array(n);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < n; i++) out[i] += (ch[Math.floor(i * buf.sampleRate / ASR_RATE)] ?? 0) / buf.numberOfChannels; // nearest-sample resample if the browser ignored 16 kHz
    }
    return out;
  } finally { ctx.close?.(); }
}

async function asrCapture() {
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 }, video: false }); }
  catch (e) { throw asrFail(['NotAllowedError', 'SecurityError'].includes(e?.name) ? 'denied' : 'mic'); }
  const release = () => stream.getTracks().forEach(t => t.stop());
  const chunks = [];
  let rec, failure, cancelled = false;
  const discard = () => { rec.ondataavailable = null; chunks.length = 0; release(); };
  try {
    rec = new MediaRecorder(stream);
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.onerror = () => { failure = asrFail('mic'); discard(); };
    rec.start();
  } catch { release(); throw asrFail('mic'); }
  return {
    abort() { cancelled = true; discard(); try { if (rec.state !== 'inactive') rec.stop(); } catch {} },
    stop: () => new Promise((resolve, reject) => {
      if (failure) return reject(failure);
      rec.onerror = () => { failure = asrFail('mic'); discard(); reject(failure); };
      rec.onstop = async () => {
        if (cancelled || failure) return resolve(new Float32Array(0));
        const blob = new Blob(chunks, { type: rec.mimeType });
        discard();
        try { resolve(await asrDecode(blob)); } catch { reject(asrFail('asr')); }
      };
      try { rec.stop(); } catch { discard(); reject(asrFail('mic')); }
    }),
  };
}

// One worker for the page; created on the first mic tap, never at page load.
let asrWorker, asrPending = new Map(), asrNext = 0, asrOnProgress, asrReady;
function asrWorkerStart() {
  if (asrWorker) return asrWorker;
  asrWorker = new Worker('lib/asr-worker.js');
  asrWorker.onmessage = ({ data }) => {
    if (data.type === 'progress') return asrOnProgress?.(data.loaded);
    const p = asrPending.get(data.id ?? 'load');
    if (!p) return;
    asrPending.delete(data.id ?? 'load');
    data.type === 'error' ? p.reject(asrFail('load')) : p.resolve(data.text);
  };
  asrWorker.onerror = () => { for (const p of asrPending.values()) p.reject(asrFail('load')); asrPending.clear(); asrWorker = asrReady = undefined; };
  return asrWorker;
}
function asrLoad(onProgress) {
  asrOnProgress = onProgress;
  asrReady ||= new Promise((resolve, reject) => {
    asrPending.set('load', { resolve, reject });
    try { asrWorkerStart().postMessage({ type: 'load' }); } catch { reject(asrFail('unsupported')); }
  }).catch(err => { asrReady = undefined; throw err; });
  return asrReady;
}
function asrTranscribe(samples) {
  return new Promise((resolve, reject) => {
    const id = ++asrNext;
    asrPending.set(id, { resolve, reject });
    try { asrWorkerStart().postMessage({ type: 'run', id, audio: samples.buffer }, [samples.buffer]); } catch { asrPending.delete(id); reject(asrFail('asr')); }
  });
}
