'use strict';
// Shared Local Guide Connect markup and actions. Rules are enforced on the server; nothing here decides eligibility.

const CONNECT_SLOGAN = 'Learn Locally. Connect Globally.';
const ELIGIBILITY_NAMES = {
  eligible: ['Đủ điều kiện', 'Eligible'],
  'awaiting-approval': ['Đang chờ phê duyệt', 'Awaiting approval'],
  'not-eligible': ['Chưa đủ điều kiện kết nối offline', 'Not yet eligible to meet offline'],
};
const VERIFY_NAMES = { unverified: ['Chưa xác minh', 'Not verified'], verified: ['Quản trị viên đã xác minh', 'Verified by an admin'], rejected: ['Bị từ chối xác minh', 'Verification rejected'] };
const ROLE_NAMES = { student: ['Học sinh', 'Student'], tourist: ['Du khách', 'Tourist'] };
const AGE_NAMES = { adult: ['Từ 18 tuổi', '18 or older'], minor: ['Dưới 18 tuổi', 'Under 18'] };
const REQUEST_STATUS = { pending: ['Đang chờ', 'Pending'], accepted: ['Đã chấp nhận', 'Accepted'], declined: ['Đã từ chối', 'Declined'], cancelled: ['Đã huỷ', 'Cancelled'], blocked: ['Đã chặn', 'Blocked'] };
const REPORT_REASONS = [['unsafe', 'Hành vi không an toàn', 'Unsafe behaviour'], ['inappropriate', 'Nội dung không phù hợp', 'Inappropriate content'], ['spam', 'Spam hoặc lừa đảo', 'Spam or scam'], ['contact', 'Đòi thông tin liên lạc riêng', 'Asked for private contact details']];
const CONNECT_GATE = {
  idle: ['Đang tải dữ liệu Kết nối từ máy chủ…', 'Loading Connect from the server…'],
  'signed-out': ['Kết nối cần tài khoản EchoLạc đã đồng bộ và có mạng. Hãy tạo tài khoản và đồng ý điều khoản trước.', 'Connect needs a synced EchoLạc account and a network. Create an account and accept the terms first.'],
  offline: ['Bạn đang ngoại tuyến. Kết nối cần mạng để máy chủ kiểm tra điều kiện.', 'You are offline. Connect needs a network so the server can check eligibility.'],
  error: ['Chưa tải được dữ liệu Kết nối từ máy chủ.', 'Could not load Connect from the server.'],
};
const ACT_FAIL = { 'signed-out': CONNECT_GATE['signed-out'], offline: CONNECT_GATE.offline, error: ['Máy chủ từ chối hoặc không phản hồi. Chưa có gì thay đổi.', 'The server refused or did not answer. Nothing changed.'], denied: ['Bạn không có quyền làm việc này.', 'You are not allowed to do this.'] };

const cLabel = (map, k) => (Object.hasOwn(map, k) && Array.isArray(map[k]) ? V(...map[k]) : esc(String(k ?? '')));
const interestName = k => esc(L(CONNECT_INTEREST_NAMES[k]) || k);
const slotName = k => esc(L(CONNECT_SLOT_NAMES[k]) || k);
const placeName = id => { const p = approvedPlace(id); return esc(p ? V(p.name_vi, p.name_en) : L(loc(id)?.name) || id); };
const reasonsHtml = reasons => `<ul class="c-why" role="alert">${(reasons?.length ? reasons : ['unverifiable']).map(r => `<li>${cLabel(REASON_TEXT, r)}</li>`).join('')}</ul>`;
const actFail = r => toast(cLabel(ACT_FAIL, r?.why || 'error'));
const notOpen = (what, why) => `<div class="card c-gate"><p><b>${what}: ${V('Chưa mở', 'Not open yet')}</b></p><p class="small muted">${why}</p></div>`;
const connectGate = () => (S.connect.status === 'ready' ? '' : `<div class="card c-gate" role="status"><p>${cLabel(CONNECT_GATE, S.connect.status)}</p>
  ${S.connect.status === 'idle' ? '' : `<button class="btn white sm mt-16" onclick="loadConnect(true)">${icon('refresh', 'sm')} ${V('Thử lại', 'Try again')}</button>`}</div>`);
// policy.js reads the server profile only.
const serverAccount = me => (me ? { id: me.id, role: me.role, ageGroup: me.age_group, verified: me.verification_status === 'verified', level: me.level } : null);
const eligTone = s => (s === 'eligible' ? 'green' : s === 'not-eligible' ? '' : 'amber');
const eligTag = me => { const s = accountEligibility(serverAccount(me)).status; return `<span class="tag ${eligTone(s)}">${cLabel(ELIGIBILITY_NAMES, s)}</span>`; };
const locPhoto = id => { const l = loc(id); return l?.referenceImages?.[0]?.url
  ? `<img src="${esc(l.referenceImages[0].url)}" alt="" loading="lazy">`
  : l ? `<span class="c-ph" style="background:linear-gradient(145deg,${esc(l.bg[0])},${esc(l.bg[1])})">${img(l.icon)}</span>` : '<span class="c-ph"></span>'; };
const personName = id => {
  const person = S.connect.people[id];
  return person?.role === 'tourist' ? V('Du khách', 'Guest') : esc(person?.display_name || V('Người dùng', 'User'));
};
// safe_profiles never returns minors, so a group request is shown only as a supervised session.
const requestWho = (r, otherId) => (r.mode === 'supervised-group' && !S.connect.people[otherId] ? V('Buổi nhóm có giám sát', 'Supervised group session') : personName(otherId));
const requestRow = (r, otherId, actions) => `
  <article class="c-req" data-req="${esc(r.id)}">
    <div class="row between"><b>${requestWho(r, otherId)}</b><span class="tag ${r.status === 'accepted' ? 'green' : r.status === 'pending' ? 'amber' : ''}">${cLabel(REQUEST_STATUS, r.status)}</span></div>
    <p class="small muted">${icon('pin', 'sm')} ${placeName(r.location_id)} · ${r.mode === 'one-to-one' ? V('Gặp 1-1', 'One-to-one') : V('Nhóm có giám sát', 'Supervised group')} · ${esc(String(r.created_at || '').slice(0, 10))}</p>
    <div class="c-why-slot"></div>
    ${actions ? `<div class="c-actions">${actions}</div>` : ''}
  </article>`;
const safetyNote = () => `<p class="c-note small">${icon('shield', 'sm')} ${V('Không chia sẻ vị trí chính xác, số điện thoại hay email. Chỉ gặp tại địa điểm công khai đã được duyệt.', 'Never share your exact location, phone number or email. Meet only at approved public places.')}</p>`;

// Re-render in place: keep scroll and keyboard focus.
function rerender() {
  const y = scrollY, k = document.activeElement?.dataset?.k;
  route(); scrollTo(0, y);
  if (k) $(`[data-k="${k}"]`)?.focus();
}
function showWhy(el, reasons) { const slot = el.closest('[data-req], .c-card')?.querySelector('.c-why-slot'); if (slot) slot.innerHTML = reasonsHtml(reasons); }

async function answerConnect(btn, decision) {
  btn.disabled = true;
  const r = await respondConnect(btn.closest('[data-req]').dataset.req, decision);
  if (!r.ok) { btn.disabled = false; return r.why && r.why !== 'error' ? actFail(r) : showWhy(btn, r.reasons); }
  toast(cLabel(REQUEST_STATUS, decision));
}
async function blockConnect(id) {
  closeSheet();
  const r = await blockPerson(id);
  r.ok ? toast(V('Đã chặn. Người này không thể kết nối với bạn.', 'Blocked. This person can no longer connect with you.')) : actFail(r);
}
function openReport(id, requestId = '') {
  openSheet(`<h2 class="sheet-title">${V('Báo cáo người dùng', 'Report user')}</h2>
    <p class="small muted">${V('Báo cáo được gửi tới máy chủ để người kiểm duyệt xem xét.', 'Reports go to the server for a moderator to review.')}</p>
    <div class="c-sheet-list mt-16">${REPORT_REASONS.map(([k, vi, en]) => `<button class="btn white" data-u="${esc(id)}" data-r="${esc(requestId)}" onclick="sendReport(this.dataset.u,this.dataset.r,'${k}')">${V(vi, en)}</button>`).join('')}
    <button class="btn" data-u="${esc(id)}" onclick="blockConnect(this.dataset.u)">${icon('shield', 'sm')} ${V('Chặn người này', 'Block this person')}</button></div>`);
}
async function sendReport(id, requestId, reason) {
  closeSheet();
  const r = await reportPerson(id, requestId, reason);
  r.ok ? toast(V('Đã gửi báo cáo. Cảm ơn bạn.', 'Report sent. Thank you.')) : actFail(r);
}
async function pickConnectRole(role) { const r = await chooseRole(role); if (!r.ok) actFail(r); }

/* ---- Profile cards: role and Safety & privacy, read from the server ---- */
function connectProfileCards() {
  const me = S.connect.me;
  if (!me) return `<div class="section-title"><span>${V('Kết nối', 'Connect')}</span></div>${connectGate()}`;
  const choose = canChooseRole(me), blocked = S.connect.blocks;
  return `
  <div class="section-title"><span>${V('Vai trò', 'Role')}</span></div>
  <section class="card">
    <p class="c-slogan">${CONNECT_SLOGAN}</p>
    ${choose ? `<div class="seg mt-8" role="group" aria-label="${V('Vai trò', 'Role')}">${['student', 'tourist'].map(k => `<button class="${me.role === k ? 'on' : ''}" aria-pressed="${me.role === k}" data-k="role-${k}" onclick="pickConnectRole('${k}')">${cLabel(ROLE_NAMES, k)}</button>`).join('')}</div>
      <p class="tiny muted mt-8">${V('Chọn một lần. Sau khi được xác minh, vai trò được khoá.', 'Choose once. Once you are verified, your role is locked.')}</p>`
      : `<p class="mt-8"><b>${cLabel(ROLE_NAMES, me.role)}</b></p><p class="tiny muted">${V('Vai trò do quản trị viên và máy chủ xác nhận.', 'Your role is confirmed by an admin and the server.')}</p>`}
  </section>
  <div class="section-title"><span>${V('An toàn & quyền riêng tư', 'Safety & privacy')}</span>${eligTag(me)}</div>
  <section class="card">
    <div class="set-row"><span class="grow">${V('Xác minh', 'Verification')}</span><b>${cLabel(VERIFY_NAMES, me.verification_status)}</b></div>
    <div class="set-row"><span class="grow">${V('Nhóm tuổi', 'Age group')}</span><b>${me.age_group ? cLabel(AGE_NAMES, me.age_group) : V('Quản trị viên chưa xác nhận', 'Not confirmed by an admin')}</b></div>
    <div class="set-row" style="display:block"><span>${V('Đã chặn', 'Blocked')}</span>
      <p class="small muted mt-8">${blocked.length ? blocked.map(personName).join(', ') : V('Chưa chặn ai.', 'Nobody blocked.')}</p></div>
    ${safetyNote()}
  </section>`;
}
