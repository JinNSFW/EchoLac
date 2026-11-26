'use strict';
// Audio stays inside this worker. The main thread receives only CTC token ids and posteriors.
importScripts('pron/constants.js');
const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/transformers.min.js';
let loading;

async function loadVocab() {
  const url = PRON_MODEL_BASE + 'vocab.json';
  const cache = typeof caches === 'undefined' ? null : await caches.open('transformers-cache').catch(() => null);
  const cached = await cache?.match(url).catch(() => null);
  const response = cached || await fetch(url, { credentials: 'omit' });
  if (!response.ok) throw new Error('Missing phoneme vocabulary');
  const vocab = [];
  for (const [token, id] of Object.entries(await response.clone().json())) {
    if (!Number.isInteger(id) || id < 0 || vocab[id] !== undefined) throw new Error('Invalid phoneme vocabulary');
    vocab[id] = token;
  }
  if (vocab[0] !== '<pad>') throw new Error('Missing CTC blank');
  if (!cached) await cache?.put(url, response).catch(() => {});
  return vocab;
}

function load() {
  loading ||= import(LIB).then(async ({ AutoModelForCTC, AutoFeatureExtractor, env }) => {
    env.allowLocalModels = false;
    env.backends.onnx.wasm.numThreads = 1;
    const progress_callback = p => {
      if (p.status === 'progress' && p.file === PRON_WEIGHT_FILE) {
        self.postMessage({ type: 'progress', loaded: p.loaded, total: p.total });
      }
    };
    const options = { revision: PRON_REVISION, progress_callback };
    const [proc, vocab] = await Promise.all([AutoFeatureExtractor.from_pretrained(PRON_MODEL, options), loadVocab()]);
    const model = await AutoModelForCTC.from_pretrained(PRON_MODEL, { ...options, dtype: 'q8', device: 'wasm' });
    return { model, proc, vocab };
  });
  return loading;
}

async function run({ audio: buffer, id }) {
  const audio = new Float32Array(buffer);
  const logError = console.error;
  let inputs;
  try {
    const { model, proc, vocab } = await load();
    // Transformers.js 3.7.6 logs the input tensor if inference throws.
    console.error = () => {};
    inputs = await proc(audio);
    const { logits } = await model(inputs);
    const [batch, frames, size] = logits.dims, data = logits.data;
    if (batch !== 1 || !frames || size !== vocab.length || data.length !== frames * size) throw new Error('Invalid CTC output');
    const ids = new Int32Array(frames), probs = new Float32Array(frames);
    for (let t = 0; t < frames; t++) {
      const offset = t * size;
      let best = 0, max = -Infinity, sum = 0;
      for (let k = 0; k < size; k++) {
        if (data[offset + k] > max) { max = data[offset + k]; best = k; }
      }
      for (let k = 0; k < size; k++) sum += Math.exp(data[offset + k] - max);
      ids[t] = best;
      probs[t] = 1 / sum;
    }
    self.postMessage({ type: 'result', id, ids, probs, vocab }, [ids.buffer, probs.buffer]);
  } finally {
    console.error = logError;
    audio.fill(0);
    inputs?.input_values?.data.fill(0);
  }
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      await load();
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'run') {
      await run(data);
    }
  } catch {
    self.postMessage({ type: 'error', id: data.id });
  }
};
