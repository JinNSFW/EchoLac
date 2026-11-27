'use strict';
// Browser speech playback for the prototype.

function speakSynth(text, opts = {}) {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  return new Promise(res => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = S.settings.accent;
    u.rate = opts.rate ?? RATES[S.settings.rate];
    const v = opts.voice ?? speechSynthesis.getVoices().find(x => x.lang.replace('_', '-') === u.lang);
    if (v) u.voice = v;
    u.onend = u.onerror = res;
    speechSynthesis.speak(u);
    setTimeout(res, 400 + text.length * 90); // some browsers never fire onend
  });
}
// Fixed lines use a pre-rendered clip when one exists (lib/line-audio.js); a custom voice or any miss uses browser speech.
function speak(text, opts = {}) {
  if (opts.voice || typeof playLine !== 'function') return speakSynth(text, opts);
  stopAudio();
  return playLine(text, opts.rate ?? RATES[S.settings.rate]).then(ok => ok || speakSynth(text, opts));
}
const stopAudio = () => {
  if (typeof lineAudioStop === 'function') lineAudioStop();
  try { speechSynthesis.cancel(); } catch { /* unsupported */ }
  if (typeof dictPlayer !== 'undefined' && dictPlayer) dictPlayer.pause();
  if (typeof pronSampleStop === 'function') pronSampleStop();
};
