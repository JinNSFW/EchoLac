const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { read } = require('../scripts/project.cjs');

const ID = 'a'.repeat(20);
function env({ clips = { 'Hello there.': ID }, clipOk = true } = {}) {
  const log = { synth: [], audio: [], fetched: [] };
  class Audio {
    constructor(url) { this.url = url; log.audio.push(this); }
    play() { return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  const ctx = vm.createContext({
    S: { settings: { accent: 'en-US', rate: 1 } }, RATES: [1, 0.8], AbortController, Promise, Audio,
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
    SpeechSynthesisUtterance: class {},
    speechSynthesis: { cancel() {}, getVoices: () => [], speak: u => { log.synth.push(u); u.onend(); } },
    fetch: async url => {
      log.fetched.push(url);
      if (url.endsWith('index.json')) return { ok: true, json: async () => ({ version: 1, voices: { 'en-US': 'v' }, clips }) };
      return { ok: clipOk, blob: async () => ({}) };
    },
  });
  ctx.window = ctx;
  vm.runInContext(read('lib/speech.js') + read('lib/line-audio.js'), ctx);
  return { ctx, log };
}
const tick = () => new Promise(r => setImmediate(r));

test('manifest hit plays the clip at the learner rate, no browser speech', async () => {
  const { ctx, log } = env();
  const p = ctx.speak('Hello there.', { rate: 0.8 });
  await tick(); await tick();
  assert.equal(log.audio.length, 1);
  assert.equal(log.audio[0].playbackRate, 0.8);
  assert.ok(log.fetched.some(u => u === `assets/audio/lines/en-US/${ID}.mp3`));
  log.audio[0].onended(); await p;
  assert.equal(log.synth.length, 0);
});

test('miss and clip failure fall back to browser speech', async () => {
  const miss = env();
  await miss.ctx.speak('Not rendered.');
  assert.equal(miss.log.synth.length, 1);
  const bad = env({ clipOk: false });
  await bad.ctx.speak('Hello there.');
  assert.equal(bad.log.synth.length, 1);
});

test('stopAudio stops a playing clip without starting browser speech', async () => {
  const { ctx, log } = env();
  const p = ctx.speak('Hello there.');
  await tick(); await tick();
  vm.runInContext('stopAudio()', ctx);
  await p;
  assert.equal(log.audio[0].paused, true);
  assert.equal(log.synth.length, 0);
});
