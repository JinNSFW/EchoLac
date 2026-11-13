'use strict';
// Camera verification results, confirmation and lesson navigation.

const IMG_ST = { matched: ['Khớp', 'Matched'], uncertain: ['Chưa chắc chắn', 'Uncertain'], no_match: ['Không khớp', 'No match'] };
const XV_ST = { confirmed: ['Đã xác nhận', 'Confirmed'], needs_confirmation: ['Cần bạn xác nhận', 'Needs your confirmation'], rejected: ['Bị từ chối', 'Rejected'] };
const AGREE = { agree: ['Đồng thuận', 'Agree'], conflict: ['Mâu thuẫn', 'Conflict'], image_only: ['Chỉ có ảnh (không GPS)', 'Image only (no GPS)'], image_failed: ['Ảnh thất bại, chỉ có GPS', 'Image failed, GPS only'], none: ['Không có địa danh hỗ trợ', 'No supported place'] };
const toneOf = v => (v.status === 'confirmed' ? 'ok' : v.status === 'rejected' || v.agreement === 'conflict' ? 'bad' : 'warn');
// Screen 3: what the image matcher saw, next to the reference it was compared with
function imageHtml(im) {
  const best = loc(im.bestId), sample = best && !best.referenceImages[0];
  return `<section class="vsec"><h3>${V('Khớp ảnh', 'Image matching')}</h3>
    <div class="cmp">
      <figure><img src="${esc(CL.photo)}" alt="${V('Ảnh của bạn', 'Your photo')}"><figcaption>${V('Ảnh của bạn', 'Your photo')}</figcaption></figure>
      <figure>${best ? `<img src="${esc(refUrl(best))}" alt="${V('Ảnh tham chiếu', 'Reference image')} ${esc(best.name.en)}">` : `<div class="cmp-empty">${icon('image')}</div>`}<figcaption>${best ? `${V('Tham chiếu', 'Reference')}${best.referenceImages[0]?.sample || sample ? V(' · mẫu minh hoạ', ' · sample illustration') : ''}` : V('Không có ảnh khớp', 'No matching reference')}</figcaption></figure>
    </div>
    <dl class="kv">
      <div><dt>${V('Trạng thái', 'Status')}</dt><dd><span class="st ${im.status === 'matched' ? 'ok' : im.status === 'uncertain' ? 'warn' : 'bad'}">${V(...IMG_ST[im.status])}</span></dd></div>
      <div><dt>${V('Ứng viên tốt nhất', 'Best visual candidate')}</dt><dd>${best ? esc(best.name.en) : '—'}</dd></div>
      <div><dt>${im.simulated ? V('Độ tương đồng', 'Similarity') : V('Xác suất từ model', 'Model probability')}</dt><dd>${im.service ? `${im.score.toFixed(2)}${im.simulated ? ` <span class="tag amber">${V('mô phỏng', 'simulated')}</span>` : ''}` : '—'}</dd></div>
    </dl>
    ${im.service ? '' : `<p class="tiny muted mt-8">${V('Không tải được model nhận diện ảnh (kiểm tra kết nối mạng), nên không có điểm số và ảnh không xác nhận nơi nào.', 'The image model couldn’t load (check your connection), so there is no score and the photo confirms nothing.')}</p>`}
  </section>`;
}
// Screen 4: both results side by side, then the verdict
function crossHtml(v) {
  const g = v.gps, im = v.image;
  const gpsCell = g.gpsStatus === 'unavailable' ? V('Không khả dụng', 'Unavailable') : g.status === 'none' ? V('Không có địa danh hỗ trợ', 'No supported place') : `${names(g.candidates.map(c => c.id))}${g.gpsStatus === 'inaccurate' ? V(' (chưa chính xác)', ' (inaccurate)') : ''}`;
  const imgCell = im.status === 'matched' ? names([im.bestId]) : im.status === 'uncertain' ? `${V('Chưa chắc', 'Unsure')}: ${names([im.bestId])}?` : im.service ? V('Không nhận diện được', 'Not recognised') : V('Chưa kết nối dịch vụ', 'No service connected');
  return `<section class="vsec"><h3>${V('Đối chiếu chéo', 'Cross-validation')}</h3>
    <table class="xv"><tbody>
      <tr><th scope="row">${V('Khớp GPS', 'GPS matching')}</th><td>${gpsCell}</td></tr>
      <tr><th scope="row">${V('Khớp ảnh', 'Image matching')}</th><td>${imgCell}</td></tr>
      <tr><th scope="row">${V('Đồng thuận', 'Agreement')}</th><td>${V(...AGREE[v.agreement])}</td></tr>
      <tr><th scope="row">${V('Kết quả cuối', 'Final result')}</th><td><b>${v.finalId ? names([v.finalId]) : '—'}</b></td></tr>
    </tbody></table>
    <div class="verdict ${toneOf(v)}">${icon(toneOf(v) === 'ok' ? 'check' : toneOf(v) === 'bad' ? 'x' : 'bulb')}<div><b>${V(...XV_ST[v.status])}${isDemo() ? ` · ${demoLabel()}` : ''}</b><p>${esc(L(v.reason))}</p></div></div>
  </section>`;
}
const retakeBtn = () => `<button class="btn white sm grow" onclick="route()">${icon('refresh', 'sm')} ${V('Chụp lại', 'Retake')}</button>`;
function actionsHtml(v) {
  const dist = id => G.gps.candidates.find(c => c.id === id)?.d;
  if (v.status === 'confirmed') return `<button class="btn mt-16" onclick="openLesson('${v.finalId}','auto')">${V('Bắt đầu học', 'Start learning')}: ${names([v.finalId])} ${icon('right')}</button>
    <div class="row mt-16" style="gap:10px">${retakeBtn()}<button class="btn white sm grow" onclick="choosePlace('manual')">${V('Không phải nơi này', 'Not this place')}</button></div>`;
  if (v.status === 'rejected') return `<a class="btn mt-16" href="#roleplay">${icon('chat')} ${V('Luyện tiếng Anh chung', 'Practise general English')}</a>
    <div class="row mt-16" style="gap:10px">${retakeBtn()}<a class="btn white sm grow" href="#explore">${V('Địa danh được hỗ trợ', 'Supported places')}</a></div>`;
  return `<p class="rec-q">${V('Chọn nơi đúng (bạn tự xác nhận, không phải xác minh tự động)', 'Pick the right place (your confirmation, not automatic verification)')}</p>
    ${[...new Set(v.options)].map(id => locRow(loc(id), dist(id), 'manual')).join('')}
    <div class="row mt-16" style="gap:10px">${retakeBtn()}<button class="btn white sm grow" onclick="choosePlace('manual')">${V('Nơi khác', 'Somewhere else')}</button></div>`;
}
const tile = l => `<span class="tile-3d sm" style="background:linear-gradient(145deg,${esc(l.bg[0])},${esc(l.bg[1])})">${img(l.icon)}</span>`;
const locRow = (l, d, how, right = '') => `<button class="loc-row" onclick="openLesson('${l.id}','${how}')">${tile(l)}<span class="grow"><b>${esc(l.name.en)}</b><small>${esc(l.name.vi)}${d != null ? ' · ' + km(d) : ''}</small></span>${right}${icon('chevR')}</button>`;
function choosePlace(how) {
  openSheet(`<h2>${V('Chọn địa điểm', 'Choose a place')}</h2><p class="small muted mt-8">${how === 'manual' ? V('Bạn tự xác nhận nơi này. Bài học sẽ ghi rõ là xác nhận thủ công.', 'You confirm this place yourself. The lesson will say it was confirmed by hand.') : V('Học kiểu thư viện, không xác minh vị trí.', 'Library study, no location check.')}</p><div class="mt-16">${LOCS.map(l => locRow(l, null, how)).join('')}</div>`);
}
// how: 'auto' = both matchers agreed, 'manual' = learner confirmed, 'library' = opened from the list, no check
function openLesson(id, how) {
  S.learnTab = 'discover';
  CL.verify = { id, how, demo: isDemo() && how !== 'library' };
  CL.photoFor = how !== 'library' && CL.photo ? id : '';
  location.hash = '#learn/' + id;
}
function verifyTag(id) {
  const v = CL.verify?.id === id ? CL.verify : { how: 'library' }, demo = v.demo ? ` · ${V('Demo', 'Demo')}` : '';
  return v.how === 'auto' ? `<span class="tag green">${icon('check', 'sm')} ${V('Đã xác minh kép: GPS + ảnh', 'Double-verified: GPS + image')}${demo}</span>`
    : v.how === 'manual' ? `<span class="tag amber">${V('Bạn tự xác nhận', 'Confirmed by you')}${demo}</span>`
    : `<span class="tag">${V('Học từ thư viện · không xác minh vị trí', 'Library study · location not checked')}</span>`;
}
function clearCamSheet() {
  openSheet(`<h2>${V('Xoá lịch sử học?', 'Delete learning history?')}</h2><p class="muted mt-8">${V('Tiến độ học của mọi địa danh và ảnh đang mở sẽ bị xoá. Không thể hoàn tác.', 'Lesson progress for every place and any open photo will be deleted. This can’t be undone.')}</p>
    <button class="btn mt-24" onclick="clearCam()">${icon('trash')} ${V('Xoá', 'Delete')}</button><button class="btn white mt-16" onclick="closeSheet()">${V('Huỷ', 'Cancel')}</button>`);
}
function clearCam() { S.cam = {}; setPhoto(''); CL.verify = null; save(); route(); toast(V('Đã xoá lịch sử học', 'Learning history deleted')); }
