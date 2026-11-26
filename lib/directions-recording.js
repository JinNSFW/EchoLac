'use strict';
// A short in-memory clip. This module never sends audio to a speech service.
function createDirectionsRecorder(onChange) {
  let active, url;
  const emit = state => onChange(state, url);
  const stopTracks = stream => stream?.getTracks().forEach(track => track.stop());

  function release(attempt) {
    if (active === attempt) active = undefined;
    clearTimeout(attempt.timer);
    stopTracks(attempt.stream);
  }

  function clearClip() {
    if (url) URL.revokeObjectURL(url);
    url = undefined;
  }

  function reset() {
    if (active) release(active);
    clearClip();
    emit('idle');
  }

  function fail(attempt, state = 'failed') {
    if (active !== attempt) return;
    release(attempt);
    emit(state);
  }

  async function start() {
    if (active) return;
    clearClip();
    stopAudio();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder !== 'function') {
      emit('unsupported');
      return;
    }
    const attempt = { chunks: [] };
    active = attempt;
    emit('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (active !== attempt) {
        stopTracks(stream);
        return;
      }
      attempt.stream = stream;
      const recorder = attempt.recorder = new MediaRecorder(stream);
      recorder.addEventListener('dataavailable', event => {
        if (active === attempt && event.data.size) attempt.chunks.push(event.data);
      });
      recorder.addEventListener('error', () => fail(attempt));
      recorder.addEventListener('stop', () => {
        if (active !== attempt) return;
        if (!attempt.stopping || !attempt.chunks.length) {
          fail(attempt);
          return;
        }
        try {
          const clip = new Blob(attempt.chunks, { type: recorder.mimeType || attempt.chunks[0].type });
          url = URL.createObjectURL(clip);
          release(attempt);
          emit('ready');
        } catch {
          fail(attempt);
        }
      });
      recorder.start();
      attempt.timer = setTimeout(stop, 30000);
      emit('recording');
    } catch (error) {
      fail(attempt, ['NotAllowedError', 'SecurityError'].includes(error?.name) ? 'denied' : 'failed');
    }
  }

  function stop() {
    const attempt = active;
    if (attempt?.recorder?.state !== 'recording') return;
    attempt.stopping = true;
    clearTimeout(attempt.timer);
    emit('finishing');
    try {
      attempt.recorder.stop();
    } catch {
      fail(attempt);
    }
  }

  return { start, stop, reset };
}
