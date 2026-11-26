'use strict';

let activeDirectionsPractice;

function clearDirectionsPractice() {
  activeDirectionsPractice?.dispose();
  activeDirectionsPractice = undefined;
}

function mountDirectionsPractice() {
  const root = $('#directions-practice');
  const key = directionsProgressKey();
  const saved = store.get(key, null);
  let run = restoreDirectionsRun(saved);
  let lastSaved = JSON.stringify(saved);
  let phase, timer, listenerView = false, temporary = false;
  let audioState = 'idle', audioUrl;
  const recorder = createDirectionsRecorder(updateAudio);
  const audioMessages = {
    requesting: ['Đang chờ quyền micro…', 'Waiting for microphone access…'],
    recording: ['Đang ghi âm, tối đa 30 giây.', 'Recording for up to 30 seconds.'],
    finishing: ['Đang chuẩn bị bản ghi…', 'Preparing the recording…'],
    ready: ['Bạn có thể nghe lại lượt nói.', 'You can replay this attempt.'],
    denied: ['Chưa có quyền micro. Bạn vẫn có thể nói trực tiếp.', 'Microphone access was denied. You can still speak live.'],
    unsupported: ['Trình duyệt này chưa hỗ trợ ghi âm. Bạn vẫn có thể nói trực tiếp.', 'Recording is unavailable in this browser. You can still speak live.'],
    failed: ['Không lấy được bản ghi. Thử lại hoặc nói trực tiếp.', 'No recording was captured. Try again or speak live.'],
  };

  function unloadAudio(audio) {
    if (!audio?.hasAttribute('src')) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  function updateAudio(state = audioState, url = audioUrl) {
    audioState = state;
    audioUrl = state === 'ready' ? url : undefined;
    const status = $('[data-dir-audio-status]', root);
    if (!status) return;
    status.textContent = audioMessages[state] ? V(...audioMessages[state]) : '';
    status.hidden = !status.textContent;
    const audio = $('[data-dir-audio]', root);
    audio.hidden = !audioUrl;
    if (audioUrl) {
      if (audio.getAttribute('src') !== audioUrl) audio.src = audioUrl;
    } else unloadAudio(audio);
    const record = $('[data-dir-action="record"]', root);
    if (record) {
      record.textContent = state === 'recording' ? V('Dừng ghi', 'Stop recording')
        : ['requesting', 'finishing'].includes(state) ? V('Huỷ ghi âm', 'Cancel recording')
          : state === 'ready' ? V('Ghi lại', 'Record again') : V('Ghi âm', 'Record');
    }
    const handoff = $('[data-dir-action="listener"]', root);
    if (handoff) handoff.disabled = ['requesting', 'recording', 'finishing'].includes(state);
  }

  function draw(focus = false) {
    clearTimeout(timer);
    unloadAudio($('[data-dir-audio]', root));
    phase = directionsPhase(run);
    const map = directionsMapFor(run, phase);
    if (directionsAssessmentPhases.includes(phase)) {
      root.innerHTML = listenerView ? directionsListenerHtml() : directionsLearnerHtml(map, phase);
    } else if (phase === 'listenSound') root.innerHTML = directionsListenSoundHtml(map);
    else if (phase === 'followup') root.innerHTML = directionsFollowupHtml(run);
    else root.innerHTML = directionsSummaryHtml(run, phase);
    if (temporary) root.insertAdjacentHTML('beforeend', `<p class="small muted">${V('Trình duyệt không lưu được tiến độ. Kết quả chỉ có trong lượt mở này.', 'This browser could not save progress. Results last only for this visit.')}</p>`);
    updateAudio();
    if (phase === 'wait') timer = setTimeout(draw, Math.min(directionsDelay, run.readyAt - Date.now() + 50));
    if (focus) $('h2', root)?.focus();
  }

  function saveAndDraw({ keepClip = false, focus = true } = {}) {
    const current = store.get(key, null);
    if (JSON.stringify(current) !== lastSaved) {
      loadProgress(current);
      return;
    }
    store.set(key, run);
    lastSaved = JSON.stringify(store.get(key, null));
    temporary = lastSaved !== JSON.stringify(run);
    if (!keepClip) recorder.reset();
    listenerView = false;
    draw(focus);
  }

  root.addEventListener('click', event => {
    const action = event.target.closest('button[data-dir-action]')?.dataset.dirAction;
    if (action === 'record' && directionsAssessmentPhases.includes(phase) && !listenerView) {
      if (audioState === 'recording') recorder.stop();
      else if (['requesting', 'finishing'].includes(audioState)) recorder.reset();
      else recorder.start();
    }
    if (action === 'listener' && directionsAssessmentPhases.includes(phase) &&
        !['requesting', 'recording', 'finishing'].includes(audioState)) {
      listenerView = true;
      draw(true);
    }
    if (action === 'skip' && recordDirectionsResponse(run, phase, null)) saveAndDraw();
    if (directionsSoundOptions.includes(action) && phase === 'listenSound') {
      run.sound = action;
      saveAndDraw();
    }
    if (phase === 'followup' && action === 'model') {
      speak(run.sound === 'missing' ? directionsMapFor(run, 'baseline').word : 'Go this way.');
    }
    if (phase === 'followup' && action === 'continue') {
      stopAudio();
      run.followup = true;
      saveAndDraw();
    }
    if (phase === 'finished' && action === 'restart' &&
        confirm(V('Xoá các kết quả chỉ đường đã lưu trên máy và bắt đầu lại?', 'Clear the directions results on this device and start again?'))) {
      run = newDirectionsRun();
      saveAndDraw();
    }
  });

  root.addEventListener('submit', event => {
    event.preventDefault();
    if (!listenerView) return;
    const response = Object.fromEntries(new FormData(event.target));
    if (recordDirectionsResponse(run, phase, response)) saveAndDraw({ keepClip: phase === 'baseline' });
  });

  const onVisibility = () => {
    if (document.hidden) recorder.reset();
    else if (directionsPhase(run) !== phase) draw();
  };
  const onPageHide = () => recorder.reset();
  function loadProgress(current) {
    lastSaved = JSON.stringify(current);
    recorder.reset();
    run = restoreDirectionsRun(current);
    listenerView = temporary = false;
    draw(true);
  }
  const onStorage = event => {
    if (event.key === 'lt:' + key) loadProgress(store.get(key, null));
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('storage', onStorage);
  activeDirectionsPractice = { dispose() {
    clearTimeout(timer);
    recorder.reset();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('storage', onStorage);
  } };
  if (lastSaved !== JSON.stringify(run)) saveAndDraw({ focus: false });
  else draw();
}
