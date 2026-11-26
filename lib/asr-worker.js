'use strict';
// Web Worker: on-device English speech-to-text (whisper-tiny.en q8 via transformers.js). Audio never leaves this worker.
// Dynamic import cannot carry SRI, so the library is pinned to an exact version and the CSP allows only that path.
const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/transformers.min.js';
const MODEL = 'onnx-community/whisper-tiny.en', REVISION = '794207fec2761281fe63a23a94b7e9f53a4efbc1';
let asr, loading;

const bytes = {};
function progress(p) {
  if (p.status !== 'progress' || !p.file) return;
  bytes[p.file] = p.loaded;
  self.postMessage({ type: 'progress', loaded: Object.values(bytes).reduce((a, b) => a + b, 0) });
}
function load() {
  loading ||= import(LIB).then(async ({ pipeline, env }) => {
    env.allowLocalModels = false; // weights come from the Hub, then stay in the browser Cache API ('transformers-cache')
    asr = await pipeline('automatic-speech-recognition', MODEL, { dtype: 'q8', device: 'wasm', revision: REVISION, progress_callback: progress });
  });
  return loading;
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') { await load(); self.postMessage({ type: 'ready' }); }
    if (data.type === 'run') {
      await load();
      const audio = new Float32Array(data.audio);
      try {
        const out = await asr(audio, { chunk_length_s: 30 });
        self.postMessage({ type: 'result', id: data.id, text: String(out.text || '').trim() });
      } finally { audio.fill(0); }
    }
  } catch (err) {
    loading = undefined;
    self.postMessage({ type: 'error', id: data.id, message: String(err?.message || err) });
  }
};
