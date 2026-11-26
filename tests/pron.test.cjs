// Pure pronunciation scoring: no model, no mic. Modules are plain globals, loaded into one vm context.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { read, root } = require('../scripts/project.cjs');
const tk = require('../content/pronunciation/tokens.json');
const cats = require('../content/pronunciation/categories.json');

const ctx = vm.createContext({ Intl, Date, Set, Array, Object, Math, String });
vm.runInContext(['constants', 'ctc', 'align', 'classify', 'score', 'content'].map(f => read(`lib/pron/${f}.js`)).join('\n')
  + '\nthis.api = { pronScore, pronDecode, pronMastered, pronDayKey, pronBlend, pronCounts, pronItemFromError, pronItemFromUnit };', ctx);
const a = ctx.api, dec = (tokens, conf = 0.9) => ({ tokens, conf });
const cat = { ipa: ['k', 'æ', 't'], category: 'final_consonant', expectedErrors: [{ category: 'final_consonant', variantIpa: ['k', 'æ', 'ʔ'], note: { vi: 'x', en: 'y' } }] };
const js = x => JSON.parse(JSON.stringify(x));

test('perfect, dropped final, glottal stop (expectedErrors first)', () => {
  assert.equal(a.pronScore(dec(['k', 'æ', 't']), cat, tk, cats).score, 100);
  const drop = a.pronScore(dec(['k', 'æ']), cat, tk, cats);
  assert.equal(drop.errors[0].cat, 'final_consonant'); assert.equal(drop.errors[0].op, 'del'); assert.ok(drop.score < 70);
  assert.equal(a.pronScore(dec(['k', 'æ', 'ʔ']), cat, tk, cats).errors[0].note.en, 'y');
});
test('th, sibilant, vowel length, voicing, cluster', () => {
  const c = (ipa, got, category) => a.pronScore(dec(got), { ipa, category }, tk, cats).errors[0]?.cat;
  assert.equal(c(['θ', 'ɪ', 'ŋ', 'k'], ['t', 'ɪ', 'ŋ', 'k'], 'th'), 'th');
  assert.equal(c(['ʃ', 'ɪ', 'p'], ['s', 'ɪ', 'p'], 'sibilant'), 'sibilant');
  assert.equal(c(['ʃ', 'iː', 'p'], ['ʃ', 'ɪ', 'p'], 'vowel_length'), 'vowel_length');
  assert.equal(c(['b', 'ɛ', 'd'], ['b', 'ɛ', 't'], 'final_voicing'), 'final_voicing');
  assert.equal(c(['s', 't', 'ɹ', 'iː', 't'], ['s', 'ə', 't', 'ɹ', 'iː', 't'], 'cluster'), 'cluster');
});
test('equivalent variants and optional r are not errors', () => {
  assert.equal(a.pronScore(dec(['k', 'ɑ']), { ipa: ['k', 'ɑː'], category: 'x' }, tk, cats).score, 100);
  assert.equal(a.pronScore(dec(['k', 'ɑː']), { ipa: ['k', 'ɑː', 'ɹ'], category: 'x' }, tk, cats).score, 100);
});
test('low confidence or silence is never scored; low-confidence groups are reference only', () => {
  const x = a.pronScore(dec([], 0), cat, tk, cats), y = a.pronScore(dec(['k', 'æ', 't'], 0.2), cat, tk, cats);
  assert.ok(x.lowConfidence && x.score === null && y.lowConfidence && y.score === null);
  const r = a.pronScore(dec(['k', 'æ']), { ipa: ['k', 'æ', 't'], category: 'linking' }, tk, cats);
  assert.ok(r.reference && !a.pronCounts(r) && a.pronCounts(a.pronScore(dec(['k', 'æ', 't']), cat, tk, cats)));
  assert.deepEqual(js(r.errors), []);
});
test('CTC greedy decode collapses repeats and drops blanks', () => {
  const r = a.pronDecode([0, 5, 5, 0, 5, 7], [1, 0.1, 0.9, 1, 0.8, 0.7], ['<pad>', , , , , 'k', , 't']);
  assert.deepEqual(js(r.tokens), ['k', 'k', 't']);
  assert.ok(Math.abs(r.conf - 0.8) < 1e-8);
});

test('unrelated speech and invalid CTC output do not produce a score', () => {
  const wrongWord = a.pronScore(dec(['ʃ', 'ɪ', 'p']), cat, tk, cats);
  assert.equal(wrongWord.score, null);
  assert.equal(wrongWord.reason, 'mismatch');
  assert.ok(!a.pronCounts(wrongWord));
  assert.equal(a.pronScore(dec(['k', 'æ', 't'], NaN), cat, tk, cats).score, null);
  assert.equal(a.pronDecode([1, 2], [0.9, NaN], ['<pad>', 'k', 't']).conf, 0);
  assert.equal(a.pronDecode([1, 2], [0.9, 1], ['<pad>', 'k', '<unk>']).conf, 0);
  assert.equal(a.pronDecode([2], [], ['<pad>', 'k', 't']).conf, 0);
});

test('sentence scoring maps word endings after an IPA token expands', () => {
  const unit = { category: 'final_consonant' };
  const words = [{ ipa: ['v', 'aɪ', 't', 'əl'] }, { ipa: ['ɡ', 'ɛ', 's', 't'] }];
  const item = a.pronItemFromUnit(unit, { text: 'vital guest', words });
  const clear = a.pronScore(dec(['v', 'aɪ', 't', 'ə', 'l', 'ɡ', 'ɛ', 's', 't']), item, tk, cats);
  assert.equal(clear.score, 100);
  assert.deepEqual(js(clear.expected), ['v', 'aɪ', 't', 'ə', 'l', 'ɡ', 'ɛ', 's', 't']);
  const missing = a.pronScore(dec(['v', 'aɪ', 't', 'ə', 'ɡ', 'ɛ', 's', 't']), item, tk, cats);
  assert.ok(missing.score < 100);
  assert.equal(missing.errors[0].cat, 'final_consonant');
  assert.ok(a.pronItemFromError({ word: 'go', ipa: '/gəʊ/' }, tk));
  assert.equal(a.pronItemFromError(undefined, tk), null);
});
test('mastery: 80+ on two different Ho Chi Minh days; blend uses TUTOR_WEIGHT', () => {
  const d = new Date('2026-11-20T10:00:00Z').getTime(), at = n => d + n * 86400000;
  assert.equal(a.pronMastered([{ score: 85, at: d }, { score: 90, at: d + 3600000 }]), false);
  assert.equal(a.pronMastered([{ score: 85, at: d }, { score: 79, at: at(1) }]), false);
  assert.equal(a.pronMastered([{ score: 85, at: d }, { score: 80, at: at(1) }]), true);
  assert.equal(a.pronDayKey(new Date('2026-11-20T18:00:00Z').getTime()), '2026-11-21'); // UTC+7 rolls over
  assert.equal(a.pronBlend(50, 100), 53);
});

test('Kokoro sample manifest maps all lesson words and sentences to both deployed accents', () => {
  const { siteFiles } = require('../scripts/site.cjs');
  const base = 'assets/audio/pronunciation';
  const manifestPath = `${base}/index.json`;
  const { version, items, voices } = JSON.parse(read(manifestPath));
  const lessons = require('../content/pronunciation/index.json');
  const expected = lessons.units.flatMap(({ file }) => {
    const { words, sentences } = JSON.parse(read(`content/pronunciation/${file}`));
    return [...words, ...sentences];
  });
  const deployed = siteFiles();
  assert.ok(deployed.has(manifestPath));
  assert.equal(version, 1);
  assert.deepEqual(Object.keys(voices).sort(), ['en-GB', 'en-US']);
  assert.equal(Object.keys(items).length, expected.length);
  const keys = new Map();
  for (const { id, text } of expected) {
    const [clipText, key] = items[id];
    assert.equal(clipText, text);
    assert.match(key, /^[a-f0-9]{20}$/);
    if (keys.has(text)) assert.equal(key, keys.get(text));
    keys.set(text, key);
  }
  assert.equal(new Set(keys.values()).size, keys.size);
  for (const accent of Object.keys(voices)) {
    for (const key of keys.values()) {
      const relative = `${base}/${accent}/${key}.mp3`;
      assert.ok(deployed.has(relative), `Clip not deployed: ${relative}`);
      const clip = fs.readFileSync(path.join(root, relative));
      assert.ok(clip.length > 144 && clip[0] === 0xff && (clip[1] & 0xe0) === 0xe0, `Invalid MP3 header: ${relative}`);
    }
  }
});

test('sample playback selects an accent and uses only matching on-device voices as a fallback', async () => {
  const key = '123456789abcdef12345', devices = [], requests = [], states = [], players = [], revoked = [];
  let delayedBlob;
  const remote = { lang: 'en-GB', localService: false }, local = { lang: 'en_GB', localService: true };
  const s = { settings: { accent: 'en-GB', rate: 'fast' } };
  const ctx = vm.createContext({
    AbortController, S: s, RATES: { fast: 1.15 },
    window: { speechSynthesis: { getVoices: () => [remote, local], cancel: () => {} } },
    pronStop: () => {}, stopAudio: () => {},
    speak: async (text, opts) => devices.push({ text, voice: opts.voice }),
    fetch: async (url, options) => {
      requests.push(url);
      return {
        ok: true,
        json: async () => ({ version: 1, items: { x: ['cat', key] }, voices: { 'en-GB': 'bf_emma' } }),
        blob: async () => delayedBlob ? delayedBlob(options.signal) : {},
      };
    },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: url => revoked.push(url) },
    Audio: class {
      constructor(url) { this.url = url; players.push(this); }
      addEventListener() {}
      async play() {}
      pause() { this.paused = true; }
    },
  });
  vm.runInContext(`${read('lib/pron/samples.js')}\nthis.sample = { playPronSample, pronSampleStop };`, ctx);
  const { playPronSample, pronSampleStop } = ctx.sample;
  const report = state => states.push(state);
  await playPronSample({ id: 'x', text: 'cat' }, report);
  assert.deepEqual(states.splice(0), ['loading', 'en-GB']);
  assert.equal(players[0].playbackRate, 1.15);
  assert.equal(requests.at(-1), `assets/audio/pronunciation/en-GB/${key}.mp3`);
  pronSampleStop();
  assert.ok(players[0].paused);
  assert.deepEqual(revoked, ['blob:test']);
  await playPronSample({ text: 'cat' }, report, .6);
  assert.equal(players[1].playbackRate, .6);
  pronSampleStop(); states.length = 0;
  await playPronSample({ text: 'unmatched word' }, report);
  assert.equal(states.at(-1), 'browser');
  assert.deepEqual(devices, [{ text: 'unmatched word', voice: local }]);
  assert.ok(requests.every(url => !url.includes('unmatched')));
  pronSampleStop(); s.settings.accent = 'en-AU';
  await playPronSample({ text: 'cat' }, report);
  assert.equal(states.at(-1), 'unavailable');
  assert.equal(devices.length, 1);

  s.settings.accent = 'en-GB';
  let release;
  let started;
  const blobStarted = new Promise(resolve => { started = resolve; });
  delayedBlob = signal => new Promise(resolve => { release = resolve; started(signal); });
  const pending = playPronSample({ id: 'x', text: 'cat' }, report);
  const signal = await blobStarted;
  pronSampleStop();
  assert.equal(signal.aborted, true);
  release({});
  await pending;
  assert.equal(states.at(-1), '');
  assert.equal(players.length, 2);
  assert.equal(devices.length, 1);
});

test('worker loads on demand, sends only bounded PCM for scoring, and recovers after failure', async () => {
  const workers = [];
  class Worker {
    constructor() { workers.push(this); this.messages = []; }
    postMessage(data, transfer) { this.messages.push(structuredClone(data, { transfer })); }
    terminate() { this.terminated = true; }
    reply(data) { this.onmessage({ data }); }
  }
  const client = vm.createContext({
    Worker, Float32Array, setTimeout, clearTimeout,
    asrFail: reason => Object.assign(new Error(reason), { reason }),
  });
  vm.runInContext(['constants', 'ctc', 'engine'].map(f => read(`lib/pron/${f}.js`)).join('\n')
    + '\nthis.client = { pronLoad, pronRun, pronCancelRun };', client);
  const { pronLoad, pronRun, pronCancelRun } = client.client;
  assert.equal(workers.length, 0);
  await assert.rejects(pronRun(new Float32Array(16000)), { reason: 'empty' });
  assert.equal(workers.length, 0);
  const loading = pronLoad();
  workers[0].reply({ type: 'error' });
  await assert.rejects(loading, { reason: 'load' });
  assert.ok(workers[0].terminated);
  const reloading = pronLoad();
  workers[1].reply({ type: 'ready' });
  await reloading;

  const clip = new Float32Array(7 * 16000).fill(0.05);
  const scoring = pronRun(clip), [, message] = workers[1].messages;
  assert.equal(message.audio.byteLength, 6 * 16000 * 4);
  assert.ok(clip.byteLength, 'the shared recorder retains its buffer for cleanup');
  workers[1].reply({ type: 'result', id: message.id, ids: [1], probs: [0.99], vocab: ['<pad>', 'k'] });
  assert.deepEqual(js((await scoring).tokens), ['k']);

  const cancelled = pronRun(clip);
  pronCancelRun();
  await assert.rejects(cancelled, { reason: 'asr' });
  assert.ok(workers[1].terminated);
});
