// On-device speech input: state machine with injected capture and transcriber (no mic, no model download).
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { read } = require('../scripts/project.cjs');

function make({ transcribe, capture, maxMs } = {}) {
  const timers = [], events = [], clips = [];
  const ctx = vm.createContext({
    setTimeout: (fn, ms) => timers.push({ fn, ms }), clearTimeout: () => { timers.length = 0; }, String, Error, Float32Array,
  });
  vm.runInContext(read('lib/asr-input.js') + '\nthis.createSpeechInput = createSpeechInput; this.MAX = ASR_MAX_MS;', ctx);
  const aborted = [];
  const cap = capture || (async () => {
    const clip = new Float32Array([0.5, -0.5, 0.25]); clips.push(clip);
    return { stop: async () => clip, abort: () => aborted.push(1) };
  });
  const input = ctx.createSpeechInput({ capture: cap, transcribe: transcribe || (async () => ' hello there '), onChange: (s, i) => events.push([s, i?.text ?? i?.reason]), maxMs });
  return { input, timers, events, clips, aborted, MAX: ctx.MAX };
}
const names = e => e.map(x => x[0]);

test('idle -> recording -> transcribing -> done, and the clip buffer is zeroed after use', async () => {
  const m = make();
  await m.input.start();
  assert.equal(m.input.state, 'recording');
  await m.input.stop();
  assert.deepEqual(names(m.events), ['recording', 'transcribing', 'done']);
  assert.equal(m.events.at(-1)[1], 'hello there');
  assert.ok(m.clips[0].every(v => v === 0), 'audio samples must be discarded');
});

test('a turn is capped at 15 s by a timer that stops the recording', async () => {
  const m = make();
  assert.equal(m.MAX, 15000);
  await m.input.start();
  assert.equal(m.timers[0].ms, 15000);
  m.timers[0].fn();
  await new Promise(r => setImmediate(r));
  assert.equal(m.input.state, 'done');
});

test('errors never invent a transcript: empty text, model failure and denied mic', async () => {
  let m = make({ transcribe: async () => '   ' });
  await m.input.start(); await m.input.stop();
  assert.deepEqual(m.events.at(-1), ['error', 'empty']);
  assert.ok(m.clips[0].every(v => v === 0));

  m = make({ transcribe: async () => { throw Object.assign(new Error('x'), { reason: 'load' }); } });
  await m.input.start(); await m.input.stop();
  assert.deepEqual(m.events.at(-1), ['error', 'load']);
  assert.ok(m.clips[0].every(v => v === 0), 'buffer is zeroed on failure too');

  m = make({ capture: async () => { throw Object.assign(new Error('d'), { reason: 'denied' }); } });
  await m.input.start();
  assert.deepEqual(m.events, [['error', 'denied']]);
  m = make({ capture: async () => { throw new Error('no device'); } });
  await m.input.start();
  assert.deepEqual(m.events, [['error', 'mic']]);
});

test('cancel releases the mic and drops a clip still being transcribed', async () => {
  const m = make();
  await m.input.start();
  m.input.cancel();
  assert.equal(m.aborted.length, 1);
  assert.equal(m.input.state, 'idle');

  let release;
  const slow = make({ transcribe: () => new Promise(r => { release = r; }) });
  await slow.input.start();
  const done = slow.input.stop();
  await new Promise(r => setImmediate(r));
  slow.input.cancel();
  release('late text');
  await done;
  assert.ok(!names(slow.events).includes('done'), 'late transcript is ignored after leaving');
  assert.ok(slow.clips[0].every(v => v === 0));
});

test('cancel before decoding finishes discards the clip without transcribing it', async () => {
  let finish, aborted = false;
  const clip = new Float32Array([0.4]);
  const m = make({
    capture: async () => ({ stop: () => new Promise(resolve => { finish = resolve; }), abort: () => { aborted = true; } }),
    transcribe: async () => assert.fail('cancelled clip must not reach the worker'),
  });
  await m.input.start();
  const done = m.input.stop();
  m.input.cancel();
  assert.equal(aborted, true);
  finish(clip);
  await done;
  assert.equal(clip[0], 0);
  assert.equal(m.input.state, 'idle');
});

test('a transfer to the local worker does not throw while cleaning up the detached input', async () => {
  const m = make({ transcribe: async clip => {
    const workerSamples = structuredClone(clip, { transfer: [clip.buffer] });
    assert.equal(workerSamples[0], 0.5);
    workerSamples.fill(0);
    return 'hello';
  } });
  await m.input.start();
  await m.input.stop();
  assert.equal(m.clips[0].byteLength, 0);
  assert.deepEqual(m.events.at(-1), ['done', 'hello']);
});

test('recorder setup errors release every acquired media track', async () => {
  for (const method of ['constructor', 'start']) {
    let stopped = 0;
    const ctx = vm.createContext({ navigator: { mediaDevices: { getUserMedia: async () => ({
      getTracks: () => [1, 2].map(() => ({ stop: () => { stopped++; } })),
    }) } }, MediaRecorder: class {
      constructor() { if (method === 'constructor') throw new Error('recorder unavailable'); }
      start() { throw new Error('start unavailable'); }
    } });
    const capture = vm.runInContext(read('lib/asr-device.js') + '\nasrCapture;', ctx);
    await assert.rejects(capture(), /mic/);
    assert.equal(stopped, 2);
  }
});

test('device glue: unsupported devices fail soft; worker and model load only on demand; no upload code', () => {
  const device = read('lib/asr-device.js'), worker = read('lib/asr-worker.js'), ui = read('lib/ai-speech.js');
  for (const src of [device, worker, ui]) assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|sendBeacon|localStorage|indexedDB/);
  assert.match(device, /typeof Worker === 'function' && typeof WebAssembly === 'object'/);
  assert.match(device, /asrWorker = new Worker\('lib\/asr-worker\.js'\)/);
  assert.doesNotMatch(read('index.html'), /transformers|asr-worker/); // nothing heavy at page load
  assert.match(worker, /@huggingface\/transformers@3\.7\.6\/dist\/transformers\.min\.js/);
  assert.match(worker, /onnx-community\/whisper-tiny\.en/);
  assert.match(worker, /revision: REVISION/);
  assert.match(ui, /track\.stop|speechCancel/); // mic released on leave and tab hide
  assert.match(ui, /visibilitychange/);
  assert.match(read('lib/roleplay.js'), /speechCancel\(\)/);
});
