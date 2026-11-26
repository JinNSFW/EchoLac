'use strict';
// Pre-rendered lesson samples. Read full MP3s so the existing audio cache can serve them offline.
const PRON_SAMPLE_PATH = 'assets/audio/pronunciation/';
let pronSampleIndex, pronSample;

function loadPronSampleIndex() {
  pronSampleIndex ||= fetch(PRON_SAMPLE_PATH + 'index.json').then(async response => {
    if (!response.ok) throw new Error('Pronunciation sample index unavailable');
    const value = await response.json();
    if (value.version !== 1 || !value.items || !value.voices) throw new Error('Invalid pronunciation sample index');
    return value;
  }).catch(error => { pronSampleIndex = undefined; throw error; });
  return pronSampleIndex;
}

function pronSampleStop() {
  if (!pronSample) return;
  const { controller, audio, url, browser, clearLoading } = pronSample;
  pronSample = undefined;
  controller.abort();
  if (audio) audio.pause();
  if (url) URL.revokeObjectURL(url);
  if (browser) window.speechSynthesis?.cancel();
  clearLoading?.();
}

function pronSampleBrowser(request, text, rate, report) {
  const accent = S.settings.accent;
  const voice = window.speechSynthesis?.getVoices().find(v => v.localService && v.lang.replace('_', '-') === accent);
  if (!voice) {
    pronSampleStop();
    report('unavailable');
    return;
  }
  request.browser = true;
  report('browser');
  speak(text, { rate, voice }).catch(() => {
    if (pronSample === request) { pronSampleStop(); report('unavailable'); }
  });
}

async function playPronSample(item, report, rate = RATES[S.settings.rate]) {
  pronStop();
  stopAudio();
  const request = { controller: new AbortController() };
  pronSample = request;
  const accent = S.settings.accent;
  if (accent !== 'en-GB' && accent !== 'en-US') return pronSampleBrowser(request, item.text, rate, report);
  request.clearLoading = () => report('');
  report('loading');
  try {
    const { items, voices } = await loadPronSampleIndex();
    if (pronSample !== request) return;
    const match = item.id ? items[item.id] : Object.values(items).find(value => value[0] === item.text);
    if (!voices[accent] || match?.[0] !== item.text || !/^[a-f0-9]{20}$/.test(match[1])) throw new Error('No matching lesson sample');
    const response = await fetch(`${PRON_SAMPLE_PATH}${accent}/${match[1]}.mp3`, { signal: request.controller.signal });
    if (!response.ok) throw new Error('Pronunciation sample unavailable');
    const blob = await response.blob();
    if (pronSample !== request) return;
    request.url = URL.createObjectURL(blob);
    const audio = request.audio = new Audio(request.url);
    audio.playbackRate = rate ?? 1;
    audio.addEventListener('ended', () => { if (pronSample === request) pronSampleStop(); }, { once: true });
    audio.addEventListener('error', () => {
      if (pronSample === request && request.started) { pronSampleStop(); report('unavailable'); }
    }, { once: true });
    await audio.play();
    if (pronSample === request) { request.started = true; request.clearLoading = undefined; report(accent); }
  } catch {
    if (pronSample === request) {
      pronSampleStop();
      const fallback = { controller: new AbortController() };
      pronSample = fallback;
      pronSampleBrowser(fallback, item.text, rate, report);
    }
  }
}

const pronSampleStatus = status => ({
  loading: V('Đang tải mẫu…', 'Loading sample…'),
  'en-GB': V('Mẫu tổng hợp · Anh-Anh', 'Synthesized sample · UK English'),
  'en-US': V('Mẫu tổng hợp · Anh-Mỹ', 'Synthesized sample · US English'),
  browser: V('Giọng đọc trên thiết bị', 'On-device browser speech'),
  unavailable: V('Chưa phát được mẫu. Hãy thử lại.', 'Sample playback unavailable. Try again.'),
}[status] || '');
