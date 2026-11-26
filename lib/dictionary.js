'use strict';
// Recorded human pronunciations from the Free Dictionary API (dictionaryapi.dev, no key).
// Only the vocabulary word leaves the device. Recordings come from Wiktionary (CC BY-SA).

const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const dictCache = new Map();
let dictPlayer = null;

// The API marks each recording's accent in its file name: hello-us.mp3, hello-uk.mp3.
const ACCENT_TAG = { 'en-US': 'us', 'en-GB': 'uk', 'en-AU': 'au' };

function pickRecording(entries, accent) {
  const urls = (Array.isArray(entries) ? entries : [])
    .flatMap(e => e.phonetics || []).map(p => p.audio)
    .filter(u => /^https:\/\/.+\.mp3$/.test(u || '')); // mp3 only: iOS Safari cannot play ogg
  const tag = ACCENT_TAG[accent];
  return urls.find(u => tag && u.endsWith(`-${tag}.mp3`)) || urls[0] || null;
}

function recordingFor(word) {
  const key = word.trim().toLowerCase();
  if (!dictCache.has(key)) {
    dictCache.set(key, fetch(DICT_API + encodeURIComponent(key))
      .then(r => (r.ok ? r.json() : []))
      .catch(() => { dictCache.delete(key); return []; }));
  }
  return dictCache.get(key).then(entries => pickRecording(entries, S.settings.accent));
}

async function playRecording(word) {
  stopAudio();
  const url = await recordingFor(word);
  if (!url) return false;
  dictPlayer = new Audio(url);
  try { await dictPlayer.play(); return true; } catch { return false; }
}
