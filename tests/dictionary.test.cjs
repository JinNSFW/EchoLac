const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime } = require('./helpers/runtime.cjs');

test('real-voice recording follows the chosen accent and skips unplayable files', () => {
  const app = runtime();
  app.run(`var entries = [{ phonetics: [
    { audio: '' },
    { audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/bridge-uk.mp3' },
    { audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/bridge-us.mp3' },
    { audio: 'https://upload.wikimedia.org/x/bridge.ogg' },
  ] }];`);
  assert.equal(app.run("pickRecording(entries, 'en-US')"), 'https://api.dictionaryapi.dev/media/pronunciations/en/bridge-us.mp3');
  assert.equal(app.run("pickRecording(entries, 'en-GB')"), 'https://api.dictionaryapi.dev/media/pronunciations/en/bridge-uk.mp3');
  assert.equal(app.run("pickRecording(entries, 'en-IN')"), 'https://api.dictionaryapi.dev/media/pronunciations/en/bridge-uk.mp3');
  assert.equal(app.run("pickRecording({ title: 'No Definitions Found' }, 'en-US')"), null);
  assert.equal(app.run("pickRecording([{ phonetics: [{ audio: 'http://x/a.mp3' }] }], 'en-US')"), null);
});
