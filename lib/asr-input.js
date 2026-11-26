'use strict';
// Mic state machine for on-device speech input: idle -> recording -> transcribing -> done | error.
// `capture()` resolves to { stop() -> Promise<Float32Array 16 kHz mono>, abort() }; `transcribe(samples)` -> Promise<string>.
// Both are injected, so tests never touch a microphone or download a model. Audio is zeroed after use and never stored.
const ASR_MAX_MS = 15000;

function createSpeechInput({ capture, transcribe, onChange, maxMs = ASR_MAX_MS }) {
  let state = 'idle', rec, timer, session = 0, starting = false;
  const set = (next, info) => { state = next; onChange(next, info); };
  const drop = () => { clearTimeout(timer); timer = undefined; };

  async function start() {
    if (state === 'recording' || state === 'transcribing' || starting) return;
    const id = ++session; starting = true;
    try {
      const r = await capture();
      if (id !== session) return r.abort();
      rec = r; set('recording');
      timer = setTimeout(stop, maxMs);
    } catch (err) {
      if (id === session) set('error', { reason: err?.reason || 'mic' });
    } finally { starting = false; }
  }

  async function stop() {
    if (state !== 'recording') return;
    const id = session, r = rec; drop();
    set('transcribing');
    let samples;
    try {
      samples = await r.stop();
      if (id !== session) return;
      rec = undefined;
      const text = String(await transcribe(samples) || '').trim();
      if (id !== session) return;
      text ? set('done', { text }) : set('error', { reason: 'empty' }); // never invent a transcript
    } catch (err) {
      if (id === session) set('error', { reason: err?.reason || 'asr' });
    } finally {
      if (rec === r) rec = undefined;
      if (samples?.byteLength) samples.fill(0); // After a transfer, the worker owns the buffer.
    }
  }

  // Leaving the screen, tab hidden: release the mic and drop any clip in flight.
  function cancel() {
    session++; drop();
    rec?.abort(); rec = undefined;
    if (state !== 'idle') set('idle');
  }

  return { start, stop, cancel, get state() { return state; } };
}
