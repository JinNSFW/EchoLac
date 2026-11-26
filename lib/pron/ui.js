'use strict';
// Shared pronunciation practice for Tutor and Practice.
let pronSession, pronDownloadApproved = false;

const pronSelfCheck = message => `<p class="small">${message}</p><p class="small muted">${V('Bạn có thể nghe mẫu, đọc lại và tự so sánh.', 'Listen to the sample, say it aloud and compare.')}</p>`;
const pronUnsupported = () => pronSelfCheck(V('Chưa thể chấm tự động trên thiết bị này.', 'Automatic scoring is unavailable on this device.'));
const pronReason = reason => ({
  denied: V('Chưa được cấp quyền micro.', 'Microphone permission was denied.'),
  mic: V('Không dùng được micro.', 'The microphone is not available.'),
  empty: V('Chưa nghe rõ. Hãy thử nói lại.', 'Could not hear you clearly. Please try again.'),
  load: V('Chưa tải được mô hình chấm điểm.', 'Could not load the scoring model.'),
}[reason] || V('Không chấm được lần này. Hãy thử lại.', 'Could not score this time. Please try again.'));

function pronMsg(x) {
  const g = t => `/${esc(t)}/`;
  if (x.op === 'del') return V(`Có thể thiếu âm ${g(x.exp)}`, `Possible missing ${g(x.exp)}`);
  if (x.op === 'ins') return V(`Có thể thừa âm ${g(x.got)}`, `Possible extra ${g(x.got)}`);
  return V(`Âm ${g(x.exp)} nghe như ${g(x.got)}`, `${g(x.exp)} sounded like ${g(x.got)}`);
}

function pronResultHtml(r) {
  if (r.lowConfidence) {
    const message = r.reason === 'mismatch'
      ? V('Âm nhận được chưa khớp đủ với mẫu. Hãy đọc lại từ hoặc câu đang hiện.', 'The audio did not match enough of the prompt. Repeat the displayed word or sentence.')
      : pronReason('empty');
    return pronSelfCheck(message);
  }
  const fixes = r.errors.slice(0, 3);
  return `<p><b>${r.score}</b>/100${r.reference ? ` <span class="tag amber">${V('Điểm tham khảo', 'Reference score')}</span>` : ''}</p>
    ${fixes.length ? `<p class="small">${V('Âm nên nghe lại', 'Sounds to listen for')} · ${fixes.map(x => `<b>${x.note ? esc(L(x.note)) : pronMsg(x)}</b>`).join(' · ')}</p>` : ''}
    <p class="small muted">${V('Điểm ước tính theo câu mẫu. Chưa đối chiếu với điểm của giáo viên.', 'Estimated score for this prompt. Teacher validation is pending.')}</p>`;
}

const pronActive = session => pronSession === session && session.box.isConnected && !document.hidden;

function pronMic(session, state) {
  const { mic, hint } = session;
  const recording = state === 'recording';
  mic.classList.toggle('rec', recording);
  mic.classList.toggle('pulse', recording);
  mic.disabled = ['loading', 'starting', 'transcribing'].includes(state);
  if (!hint) return;
  hint.textContent = ({
    recording: V('Đang ghi âm… nhấn để dừng', 'Recording… tap to stop'),
    transcribing: V('Đang chấm điểm…', 'Scoring…'),
    starting: V('Đang mở micro…', 'Opening microphone…'),
  })[state] || V('Nhấn để ghi âm', 'Tap to record');
}

function pronChange(session, state, info) {
  if (!pronActive(session)) return;
  pronMic(session, state);
  if (state === 'error') session.box.innerHTML = pronSelfCheck(pronReason(info.reason));
  if (state === 'done') {
    const result = pronScore(JSON.parse(info.text), session.item, session.tk, session.cats);
    session.box.innerHTML = pronResultHtml(result);
    if (pronCounts(result)) session.onScore?.(result, session.item);
  }
}

async function pronEnsure(session) {
  if (!pronDownloadApproved && !(await pronCached())) {
    if (!pronActive(session)) return false;
    session.box.innerHTML = `<p class="small">${V(
      `Mô hình chấm phát âm khoảng <b>${PRON_MODEL_MB} MB</b>, chưa tính thư viện chạy lần đầu. Trình duyệt có thể lưu mô hình để dùng lại. Bản ghi chỉ được xử lý trên máy bạn và xóa sau khi chấm.`,
      `The pronunciation model is about <b>${PRON_MODEL_MB} MB</b>, plus the first-time runtime download. Your browser may cache the model. Recordings stay on your device and are discarded after scoring.`)}</p>
      <button class="btn soft sm" type="button">${V('Tải mô hình', 'Download model')}</button>`;
    session.box.querySelector('button').addEventListener('click', () => {
      if (!pronActive(session)) return;
      pronDownloadApproved = true;
      pronStart(session.item, session.opts);
    });
    return false;
  }
  if (!pronActive(session)) return false;
  session.box.innerHTML = `<p class="small">${V('Đang tải mô hình…', 'Loading model…')}</p>`;
  await pronLoad((loaded, total) => {
    if (!pronActive(session)) return;
    const mb = Math.round(loaded / 1e6), target = total ? Math.round(total / 1e6) : PRON_MODEL_MB;
    session.box.firstElementChild.textContent = V(`Đang chuẩn bị mô hình · ${mb}/${target} MB`, `Preparing model · ${mb}/${target} MB`);
  });
  return pronActive(session);
}

// opts contains selectors for the controls and an optional callback for scoreable attempts.
async function pronStart(item, opts) {
  const box = $(opts.box), mic = $(opts.mic);
  if (!box || !mic || document.hidden || mic.disabled) return;
  if (pronSession?.mic === mic && pronSession.input?.state === 'recording') return pronSession.input.stop();
  pronStop();
  const session = { item, opts, box, mic, hint: $(opts.hint), onScore: opts.onScore };
  pronSession = session;
  if (!item?.ipa?.length || PRON_PROSODY.includes(item.category)) {
    box.innerHTML = pronSelfCheck(V('Mục này chưa hỗ trợ chấm tự động.', 'Automatic scoring is unavailable for this exercise.'));
    return;
  }
  if (!pronSupported()) {
    box.innerHTML = pronUnsupported();
    return;
  }

  pronMic(session, 'loading');
  try {
    ({ tk: session.tk, cats: session.cats } = await pronContent());
    if (!(await pronEnsure(session))) return;
    stopAudio();
    session.box.innerHTML = '';
    pronMic(session, 'starting');
    session.input = createSpeechInput({
      capture: asrCapture,
      transcribe: async samples => {
        if (!pronActive(session)) return '';
        return JSON.stringify(await pronRun(samples));
      },
      onChange: (state, info) => pronChange(session, state, info),
      maxMs: PRON_MAX_MS,
    });
    await session.input.start();
  } catch {
    if (pronActive(session)) box.innerHTML = pronSelfCheck(pronReason('load'));
  } finally {
    if (pronActive(session) && session.input?.state !== 'recording') pronMic(session, 'idle');
  }
}

function pronStop() {
  if (typeof pronSampleStop === 'function') pronSampleStop();
  const session = pronSession;
  if (!session) return;
  pronSession = undefined;
  session.input?.cancel();
  pronCancelRun();
  pronMic(session, 'idle');
}
document.addEventListener('visibilitychange', () => { if (document.hidden) pronStop(); });
