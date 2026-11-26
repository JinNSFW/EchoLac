'use strict';
// Mic button for AI Talk: tap to download the model once, tap to speak, tap to stop; the transcript lands in the typing box.
// Audio stays on the device (lib/asr-device.js). Any failure leaves the typing box as the way to answer.
let SPEECH = null, ASR_LOADED = false, speechLoad = 0;
const ASR_MSG = {
  denied: () => V('Chưa cho phép micro. Bạn có thể gõ câu trả lời.', 'Microphone is blocked. You can type your reply.'),
  unsupported: () => V('Thiết bị này chưa nhận giọng nói được. Hãy gõ câu trả lời.', 'This device cannot transcribe speech. Please type your reply.'),
  load: () => V('Không tải được mô hình nhận giọng nói. Hãy gõ câu trả lời.', 'The speech model could not load. Please type your reply.'),
  empty: () => V('Mình chưa nghe rõ. Thử nói lại hoặc gõ câu trả lời.', 'I could not hear that. Try again or type your reply.'),
  mic: () => V('Không mở được micro. Hãy gõ câu trả lời.', 'The microphone did not start. Please type your reply.'),
  asr: () => V('Chưa chép được lời nói. Thử lại hoặc gõ câu trả lời.', 'Could not transcribe that. Try again or type your reply.'),
};

function aiSpeechState(state, info) {
  if (!T?.ai) return;
  if (state === 'idle') {
    if (T.state === 'listening' || T.state === 'processing') aiInput(true);
    return;
  }
  const hint = $('#mic-hint');
  if (state === 'recording') {
    setMic('listening');
    hint.textContent = V('Đang nghe (tối đa 15 giây)… nhấn lần nữa để dừng', 'Listening (up to 15 s)… tap again to stop');
  } else if (state === 'transcribing') {
    setMic('processing');
    hint.textContent = V('Đang chép lời trên máy…', 'Transcribing on your device…');
  } else {
    setMic('ready'); $('#ai-send').disabled = false;
    if (state === 'done') {
      const inp = $('#ai-text'); inp.value = info.text.slice(0, AI_CHARS); inp.focus();
      hint.textContent = V('Kiểm tra câu rồi nhấn Gửi', 'Check the text, then tap Send');
    } else {
      hint.textContent = (ASR_MSG[info.reason] || ASR_MSG.asr)();
      if (['unsupported', 'load'].includes(info.reason)) $('#mic').disabled = true;
    }
  }
}

async function aiMicTap() {
  const t = T;
  if (!t?.ai) return;
  SPEECH ||= createSpeechInput({ capture: asrCapture, transcribe: asrTranscribe, onChange: aiSpeechState });
  if (t.state === 'listening') return SPEECH.stop();
  if (t.state !== 'ready' || document.hidden) return;
  if (!ASR_LOADED) {
    const mb = ASR_TOTAL_MB, load = ++speechLoad;
    const cached = await asrCached();
    if (T !== t || load !== speechLoad || t.state !== 'ready' || document.hidden) return;
    if (!cached && !confirm(V(`Tải mô hình nhận giọng nói một lần (khoảng ${mb} MB, nên dùng Wi-Fi)? Âm thanh của bạn luôn ở lại trên máy.`,
      `Download the speech model once (about ${mb} MB, Wi-Fi recommended)? Your audio always stays on your device.`))) return;
    setMic('processing');
    const hint = $('#mic-hint');
    try {
      await asrLoad(b => { if (T === t && load === speechLoad) hint.textContent = V('Đang tải mô hình… ', 'Downloading model… ') + `${Math.min(ASR_MODEL_MB, Math.round(b / 1e6))}/${ASR_MODEL_MB} MB`; });
      ASR_LOADED = true;
    } catch {
      if (T !== t || load !== speechLoad) return;
      return aiSpeechState('error', { reason: 'load' });
    }
    if (T !== t || load !== speechLoad) return;
    setMic('ready'); $('#ai-send').disabled = false;
    hint.textContent = V('Mô hình sẵn sàng. Nhấn micro để nói', 'Model ready. Tap the mic to speak');
    return;
  }
  stopAudio();
  SPEECH.start();
}
// Leaving the screen or hiding the tab: stop the recorder and release the microphone.
function speechCancel() {
  speechLoad++;
  SPEECH?.cancel();
  if (T?.ai && (T.state === 'listening' || T.state === 'processing')) aiInput(true);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) speechCancel(); });
