'use strict';
// Student Connect: verification from the server (set by an admin), free time (public.availability), incoming requests.
const ELIGIBILITY_HELP = {
  eligible: ['Bạn có thể nhận yêu cầu tại địa điểm công khai đã duyệt.', 'You can take requests at approved public places.'],
  'awaiting-approval': ['Bạn dưới 18 tuổi: đợt thí điểm chỉ mở gặp du khách cho người từ 18 tuổi.', 'You are under 18: the pilot opens meetings with tourists only to people 18 or older.'],
  'not-eligible': ['Chờ quản trị viên EchoLạc xác minh tài khoản, trình độ (tối thiểu A2) và nhóm tuổi.', 'Wait for an EchoLạc admin to verify your account, level (A2 or higher) and age group.'],
};
async function toggleSlot(btn) { btn.disabled = true; const r = await toggleAvailability(btn.dataset.l, btn.dataset.s); if (!r.ok) { btn.disabled = false; actFail(r); } }

VIEWS.connect = {
  render() {
    const me = S.connect.me, head = `<header class="c-head"><h1>${V('Kết nối với du khách', 'Connect with tourists')}</h1>
      <p class="muted">${V('Hướng dẫn du khách tại địa điểm công khai và luyện tiếng Anh thật.', 'Guide tourists at public places and practise real English.')}</p></header>`;
    if (!me) return head + connectGate() + safetyNote();
    const status = accountEligibility(serverAccount(me)).status;
    const incoming = S.connect.requests.filter(r => r.student_id === me.id);
    return `${head}
    <section class="card c-status" aria-labelledby="c-st">
      <div class="row between"><h2 id="c-st">${V('Trạng thái an toàn', 'Safety status')}</h2>${eligTag(me)}</div>
      <p class="small mt-8">${cLabel(VERIFY_NAMES, me.verification_status)}</p>
      <p class="small muted mt-8">${cLabel(ELIGIBILITY_HELP, status)}</p>
    </section>

    <div class="section-title"><span>${V('Lịch rảnh theo địa điểm', 'Free time by place')}</span></div>
    <p class="tiny muted">${V('Lịch được lưu trên máy chủ. Gặp 1-1 chưa mở trong đợt thí điểm; chỉ có buổi nhóm do quản trị viên giám sát.', 'Saved on the server. One-to-one meetings are not open in the pilot; only admin-supervised group sessions.')}</p>
    <div class="c-list">${S.connect.locations.map(l => `<section class="card c-avail" aria-label="${placeName(l.id)}"><b>${placeName(l.id)}</b>
      <div class="c-slots" role="group">${CONNECT_SLOTS.map(s => { const on = hasSlot(l.id, s); return `<button class="c-slot ${on ? 'on' : ''}" aria-pressed="${on}" data-k="slot-${esc(l.id)}-${s}" data-l="${esc(l.id)}" data-s="${s}" onclick="toggleSlot(this)">${slotName(s)}</button>`; }).join('')}</div></section>`).join('')}</div>

    <div class="section-title"><span>${V('Yêu cầu đến', 'Incoming requests')}</span><span class="tiny muted">${incoming.filter(r => r.status === 'pending').length}</span></div>
    ${incoming.length ? `<div class="c-list">${incoming.map(r => requestRow(r, r.tourist_id, r.status === 'pending'
      ? `<button class="btn sm" onclick="answerConnect(this,'accepted')">${icon('check', 'sm')} ${V('Chấp nhận', 'Accept')}</button>
         <button class="btn white sm" onclick="answerConnect(this,'declined')">${V('Từ chối', 'Decline')}</button>
         <button class="btn white sm" data-u="${esc(r.tourist_id)}" data-r="${esc(r.id)}" onclick="openReport(this.dataset.u,this.dataset.r)">${V('Báo cáo hoặc chặn', 'Report or block')}</button>`
      : r.status === 'accepted' ? `<button class="btn white sm" onclick="answerConnect(this,'cancelled')">${V('Huỷ kết nối', 'Cancel connection')}</button>` : '')).join('')}</div>
      <p class="tiny muted mt-8">${V('Máy chủ kiểm tra lại điều kiện của cả hai bên ngay lúc chấp nhận.', 'The server checks both accounts again at the moment you accept.')}</p>`
      : `<div class="card center"><p class="muted">${V('Chưa có yêu cầu nào.', 'No requests yet.')}</p></div>`}
    ${safetyNote()}`;
  },
  mount: () => connectMount(),
};
