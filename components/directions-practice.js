'use strict';

const directionsName = id => L(directionsLabels[id]);
const directionsPhaseNames = {
  baseline: ['Chỉ đường lần đầu', 'First directions task'],
  transfer: ['Chỉ đường trên bản đồ mới', 'Give directions on a new map'],
  delayed: ['Bài kiểm tra sau 7 ngày', 'Seven-day follow-up'],
};

function directionsPracticeHtml() {
  return `
    <div class="topbar centered">
      <a class="icon-btn" href="#home" aria-label="${V('Trang chủ', 'Home')}">${icon('left')}</a>
      <h1>${V('Chỉ đường ở Đà Nẵng', 'Directions in Da Nang')}</h1><span></span>
    </div>
    <section id="directions-practice" class="card directions-practice"></section>`;
}

function directionsMapHtml(map) {
  return `<figure class="directions-map">
      <figcaption>${V('Bản đồ mô phỏng khu vực Cầu Rồng. Bắt đầu từ dưới và đi lên.', 'Fictional map of the Dragon Bridge area. Start at the bottom and head up.')}</figcaption>
      <ol class="directions-street">
        ${[...map.junctions].reverse().map(junction => `<li class="directions-junction">
          ${['left', 'landmark', 'right'].map(side => `<span class="directions-${side}${junction[side] === map.answer.destination ? ' directions-destination' : ''}">
            <span class="sr">${side === 'landmark' ? V('Mốc', 'Landmark') : directionsName(side)}</span>
            ${directionsName(junction[side])}
          </span>`).join('')}
        </li>`).join('')}
        <li class="directions-start"><span aria-hidden="true">↑</span> ${V('Bạn ở đây', 'You are here')}</li>
      </ol>
    </figure>`;
}

const directionsAction = (action, label, style = '') =>
  `<button class="btn ${style}" type="button" data-dir-action="${action}">${label}</button>`;

const directionsAudioHtml = () =>
  `<p class="small muted" data-dir-audio-status role="status" hidden></p>
   <audio controls controlslist="nodownload noremoteplayback" disableremoteplayback preload="none"
     data-dir-audio hidden aria-label="${V('Nghe lại lượt nói', 'Replay this attempt')}"></audio>`;

function directionsLearnerHtml(map, phase) {
  return `
    <h2 tabindex="-1">${V(...directionsPhaseNames[phase])}</h2>
    <p>${V('Chỉ đường bằng tiếng Anh. Cho người nghe biết rẽ hướng nào, ở mốc nào và đến đâu.', 'Give directions in English. Tell the listener where to turn, which landmark to look for and where to go.')}</p>
    ${directionsMapHtml(map)}
    <p>${V('Điểm hẹn', 'Meeting point')} <strong>${directionsName(map.answer.destination)}</strong></p>
    <p class="directions-visitor"><q lang="en">${directionsQuestion}</q></p>
    <p class="small muted">${V('Bạn có thể nói trực tiếp hoặc bật micro để nghe lại. Bản ghi chỉ tồn tại tạm thời trên thiết bị này.', 'Speak live or enable the microphone to listen back. The clip is temporary and stays on this device.')}</p>
    ${directionsAction('record', V('Ghi âm', 'Record'), 'soft')}
    ${directionsAudioHtml()}
    ${directionsAction('listener', V('Đưa cho người nghe chấm', 'Hand over to the listener'))}
    ${directionsAction('skip', V('Tiếp tục tự luyện', 'Continue solo'), 'white')}`;
}

function directionsListenerHtml() {
  return `
    <h2 tabindex="-1">${V('Người nghe hiểu gì?', 'What did you hear?')}</h2>
    <p>${V('Đánh dấu điều bạn nghe được khi không nhìn bản đồ. Nếu bạn chưa nghe rõ một thông tin, chọn “Không nghe rõ”.', 'Choose what you heard without looking at the map. If any detail was unclear, select “Unclear”.')}</p>
    ${directionsAudioHtml()}
    <form class="directions-listener-form">
      ${Object.entries(directionsFields).map(([field, spec]) => `<label>
        <span>${L(spec.label)}</span>
        <select name="${field}" required>
          <option value="">${V('Chọn…', 'Choose…')}</option>
          ${[...spec.options, 'unclear'].map(id => `<option value="${id}">${directionsName(id)}</option>`).join('')}
        </select>
      </label>`).join('')}
      <button class="btn" type="submit">${V('Lưu điều bạn nghe được', 'Save what you heard')}</button>
    </form>`;
}

function directionsListenSoundHtml(map) {
  return `
    <h2 tabindex="-1">${V('Người nghe xem lại âm cuối', 'Listener check for the final sound')}</h2>
    <p>${V('Nếu bạn có thể đánh giá, nghe lại âm /t/ cuối trong từ này.', 'If you can assess the sound, listen again for the final /t/ in this word.')}
      <strong lang="en">${map.word}</strong></p>
    ${directionsAudioHtml()}
    ${directionsAction('acceptable', V('Có âm cuối hoặc biến thể chấp nhận được', 'Final sound present or an acceptable variant'), 'soft')}
    ${directionsAction('missing', V('Nghe rõ từ và xác nhận thiếu âm /t/', 'Word heard clearly, with confirmed missing /t/'), 'white')}
    ${directionsAction('uncertain', V('Chưa đủ căn cứ để đánh giá', 'Not enough evidence to judge'), 'white')}`;
}

function directionsFollowupHtml(run) {
  const map = directionsMapFor(run, 'baseline');
  const targeted = run.sound === 'missing';
  const model = targeted ? map.word : 'Go this way.';
  return `
    <h2 tabindex="-1">${targeted ? V('Luyện âm /t/ cuối', 'Practise final /t/') : V('Luyện một cụm chỉ đường', 'Practise a directions phrase')}</h2>
    <p>${targeted
      ? V('Nghe mẫu rồi nói lại. Đặt đầu lưỡi ngay sau răng trên để khép âm /t/ ở cuối từ. Bạn không cần bật hơi mạnh.',
          'Listen and repeat. Put the tip of your tongue just behind your upper teeth to close the final /t/. A strong burst of air is unnecessary.')
      : V('Nghe và nói lại cụm dưới đây để chuẩn bị cho bản đồ mới.', 'Listen and repeat this phrase before trying a new map.')}</p>
    <p class="directions-visitor"><strong lang="en">${model}</strong></p>
    ${directionsAction('model', V('Nghe mẫu', 'Listen to the model'), 'soft')}
    ${directionsAction('continue', V('Sang bản đồ mới', 'Open the new map'))}`;
}

function directionsSummaryHtml(run, phase) {
  const date = new Intl.DateTimeFormat(S.lang === 'vi' ? 'vi-VN' : 'en', {
    timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short',
  }).format(run.readyAt);
  const waiting = phase === 'wait';
  return `
    <h2 tabindex="-1">${waiting ? V('Kết quả hôm nay', 'Today’s results') : V('Kết quả chỉ đường', 'Your directions results')}</h2>
    <dl class="directions-outcomes">
      ${directionsAssessmentPhases.filter(step => Object.hasOwn(run, step)).map(step => {
        const score = directionsResult(run, step);
        const { answer } = directionsMapFor(run, step);
        const clarify = score === null ? [] : Object.keys(directionsFields)
          .filter(field => run[step][field] !== answer[field])
          .map(field => L(directionsFields[field].label).toLowerCase());
        return `<div><dt>${V(...directionsPhaseNames[step])}</dt>
          <dd>${score === null ? V('Tự luyện', 'Solo practice') : V(`${score}/3 thông tin được hiểu`, `${score}/3 details understood`)}</dd>
          ${clarify.length ? `<dd class="small muted">${V('Nói rõ hơn về', 'Make these details clearer')} ${clarify.join(', ')}</dd>` : ''}</div>`;
      }).join('')}
    </dl>
    ${waiting
      ? `<p>${V('Bài kiểm tra sau 7 ngày mở lúc', 'The seven-day check opens at')} <strong>${date}</strong> ${V('giờ Việt Nam.', 'Vietnam time.')}</p>`
      : directionsAction('restart', V('Xoá kết quả và luyện lại', 'Clear results and practise again'), 'white')}
    <a class="btn soft" href="#home">${V('Về trang chủ', 'Back to home')}</a>`;
}
