'use strict';
// Browser speech playback for the prototype.

function speak(text, opts = {}) {
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
const stopAudio = () => {
  try { speechSynthesis.cancel(); } catch { /* unsupported */ }
  if (typeof dictPlayer !== 'undefined' && dictPlayer) dictPlayer.pause();
  if (typeof pronSampleStop === 'function') pronSampleStop();
};
