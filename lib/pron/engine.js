'use strict';
// Client for the local pronunciation worker. Only model files are fetched over the network.
const pronSupported = () => asrSupported() && !(navigator.deviceMemory && navigator.deviceMemory < 4);
async function pronCached() {
  try { return !!(await caches.match(PRON_MODEL_BASE + PRON_WEIGHT_FILE, { cacheName: 'transformers-cache' })); }
  catch { return false; }
}

let pronWorker, pronReady, pronProgress, pronNext = 0;
const pronPending = new Map();
function pronReset(reason) {
  pronWorker?.terminate();
  pronWorker = pronReady = pronProgress = undefined;
  for (const p of pronPending.values()) {
    clearTimeout(p.timer);
    p.reject(asrFail(reason));
  }
  pronPending.clear();
}

function pronWorkerStart() {
  if (pronWorker) return pronWorker;
  const worker = new Worker('lib/pron-worker.js');
  pronWorker = worker;
  worker.onmessage = ({ data }) => {
    if (worker !== pronWorker) return;
    if (data.type === 'progress') return pronProgress?.(data.loaded, data.total);
    const key = data.id ?? 'load', p = pronPending.get(key);
    if (!p) return;
    if (data.type === 'error') return pronReset(data.id == null ? 'load' : 'asr');
    clearTimeout(p.timer);
    pronPending.delete(key);
    p.resolve(data);
  };
  worker.onerror = () => { if (worker === pronWorker) pronReset('load'); };
  worker.onmessageerror = () => { if (worker === pronWorker) pronReset('asr'); };
  return worker;
}

function pronRequest(data, timeout, transfer = []) {
  const key = data.id ?? 'load', reason = key === 'load' ? 'load' : 'asr';
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => pronReset(reason), timeout);
    pronPending.set(key, { resolve, reject, timer });
    try { pronWorkerStart().postMessage(data, transfer); }
    catch { pronReset(reason); }
  });
}

async function pronLoad(onProgress) {
  pronProgress = onProgress;
  try { await (pronReady ||= pronRequest({ type: 'load' }, PRON_LOAD_TIMEOUT_MS)); }
  catch (err) { pronReady = undefined; throw err; }
  finally { if (pronProgress === onProgress) pronProgress = undefined; }
}

function pronAudible(samples) {
  if (samples.length < PRON_MIN_SAMPLES) return false;
  let power = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample)) return false;
    power += sample * sample;
  }
  return Math.sqrt(power / samples.length) >= PRON_MIN_RMS;
}

// samples: Float32Array at 16 kHz mono. Only the bounded copy crosses into the worker.
async function pronRun(samples) {
  const clip = samples.slice(0, PRON_RATE * PRON_MAX_MS / 1000);
  try {
    if (!pronAudible(clip)) throw asrFail('empty');
    const { ids, probs, vocab } = await pronRequest({ type: 'run', id: ++pronNext, audio: clip.buffer }, PRON_RUN_TIMEOUT_MS, [clip.buffer]);
    return pronDecode(ids, probs, vocab);
  } finally {
    if (clip.byteLength) clip.fill(0); // A successful transfer detaches the buffer. The worker then owns cleanup.
  }
}

const pronCancelRun = () => {
  if ([...pronPending.keys()].some(key => key !== 'load')) pronReset('asr');
};
