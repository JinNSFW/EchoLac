'use strict';
// Pre-rendered Kokoro clips for fixed lines (scripts/render-lines.py). A miss or any failure falls back to speakSynth().
const LINE_PATH = 'assets/audio/lines/';
let lineIndex, lineIndexP, lineCur;

const loadLineIndex = () => lineIndexP ||= fetch(LINE_PATH + 'index.json').then(r => {
  if (!r.ok) throw new Error('no line index');
  return r.json();
}).then(v => (lineIndex = v.version === 1 && v.clips && v.voices ? v : {})).catch(() => (lineIndex = {}));

function lineAudioStop() {
  const c = lineCur; lineCur = undefined;
  if (!c) return;
  c.ctl.abort(); c.audio?.pause();
  if (c.url) URL.revokeObjectURL(c.url);
  c.done();
}

// Resolves true when a clip played to the end, false on miss/failure (caller then uses browser speech).
async function playLine(text, rate) {
  const ix = lineIndex || await loadLineIndex(), accent = S.settings.accent, id = ix.clips?.[text];
  if (!id || !ix.voices?.[accent] || !/^[a-f0-9]{20}$/.test(id)) return false;
  const c = lineCur = { ctl: new AbortController(), done() {} };
  try {
    const r = await fetch(`${LINE_PATH}${accent}/${id}.mp3`, { signal: c.ctl.signal });
    if (!r.ok) throw new Error('clip unavailable');
    const blob = await r.blob();
    if (lineCur !== c) return true; // stopped while loading
    c.url = URL.createObjectURL(blob);
    const a = c.audio = new Audio(c.url);
    a.playbackRate = rate ?? 1;
    const ended = new Promise(res => { c.done = () => res(true); a.onended = lineAudioStop; a.onerror = () => { c.done = () => res(false); lineAudioStop(); }; });
    await a.play();
    return await ended;
  } catch {
    const stopped = lineCur !== c; // aborted by stopAudio: do not also start browser speech
    if (!stopped) lineAudioStop();
    return stopped;
  }
}
