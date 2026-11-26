'use strict';
// Student Connect: school and verification from the server, free time (public.availability), incoming requests.
const ELIGIBILITY_HELP = {
  eligible: ['Bạn có thể nhận yêu cầu tại địa điểm công khai đã duyệt.', 'You can take requests at approved public places.'],
  'supervised-only': ['Bạn dưới 18 tuổi: chỉ tham gia buổi nhóm có giáo viên giám sát.', 'You are under 18: you join only teacher-supervised group sessions.'],
  'awaiting-approval': ['Cần nhà trường phê duyệt và phụ huynh đồng ý trước khi kết nối.', 'Your school must approve and a guardian must consent before you connect.'],
  'not-eligible': ['Tham gia trường bằng mã mời, rồi chờ nhà trường xác minh.', 'Join your school with an invite code, then wait for the school to verify you.'],
};
const JOIN_FAIL = {
  'wrong-code': ['Mã mời không đúng. Hỏi lại giáo viên của bạn.', 'Wrong invite code. Ask your teacher again.'],
  locked: ['Bạn nhập sai quá nhiều lần. Thử lại sau một giờ.', 'Too many wrong codes. Try again in an hour.'],
};
async function submitJoin(e) {
  e.preventDefault();
  const r = await joinSchool($('#c-code').value);
  if (r.ok) return toast(V('Đã vào trường. Chờ nhà trường xác minh.', 'Joined. Wait for the school to verify you.'));
  Object.hasOwn(JOIN_FAIL, r.why) ? toast(cLabel(JOIN_FAIL, r.why)) : actFail(r);
}
async function toggleSlot(btn) { btn.disabled = true; const r = await toggleAvailability(btn.dataset.l, btn.dataset.s); if (!r.ok) { btn.disabled = false; actFail(r); } }

function joinCard() {
  return `<section class="card"><h2>${V('Tham gia trường', 'Join your school')}</h2>
    <p class="small muted mt-8">${V('Nhập mã mời do giáo viên đưa. Nhà trường sẽ xác minh bạn sau đó.', 'Enter the invite code from your teacher. The school verifies you afterwards.')}</p>
    <form class="row mt-16" style="gap:8px" onsubmit="submitJoin(event)">
      <div class="input-wrap grow"><input id="c-code" aria-label="${V('Mã mời', 'Invite code')}" autocomplete="off" maxlength="64" required></div>
      <button class="btn sm">${V('Tham gia', 'Join')}</button></form></section>`;
}

VIEWS.connect = {
  render() {
    const me = S.connect.me, head = `<header class="c-head"><h1>${V('Kết nối với du khách', 'Connect with tourists')}</h1>
      <p class="muted">${V('Hướng dẫn du khách tại địa điểm công khai và luyện tiếng Anh thật.', 'Guide tourists at public places and practise real English.')}</p></header>`;
    if (!me) return head + connectGate() + safetyNote();
    const status = accountEligibility(serverAccount(me)).status, minor = me.age_group === 'minor', ap = S.connect.approval;
    const incoming = S.connect.requests.filter(r => r.student_id === me.id);
    return `${head}
    ${me.role === 'student' && !me.school_id ? joinCard() : ''}
    <section class="card c-status" aria-labelledby="c-st">
      <div class="row between"><h2 id="c-st">${V('Trạng thái an toàn', 'Safety status')}</h2>${eligTag(me)}</div>
      <p class="small mt-8">${S.connect.school ? esc(S.connect.school.name) + ' · ' : ''}${cLabel(VERIFY_NAMES, me.verification_status)}</p>
      ${minor ? `<p class="small mt-8">${V('Nhà trường phê duyệt', 'School approval')}: <b>${ap?.school_approved_at ? V('Đã duyệt', 'Approved') : V('Chưa duyệt', 'Not yet')}</b></p>
        <p class="small">${V('Phụ huynh đồng ý', 'Guardian consent')}: <b>${ap?.guardian_consent_at ? V('Đã có', 'Given') : V('Chưa mở', 'Not open yet')}</b>${ap?.guardian_consent_at ? '' : ` <span class="tiny muted">${V('(cần luồng email đồng ý phụ huynh, sắp có)', '(needs the guardian email flow, coming soon)')}</span>`}</p>` : ''}
      <p class="small muted mt-8">${cLabel(ELIGIBILITY_HELP, status)}</p>
    </section>

    <div class="section-title"><span>${V('Lịch rảnh theo địa điểm', 'Free time by place')}</span></div>
    <p class="tiny muted">${V('Lịch được lưu trên máy chủ. Gặp 1-1 chưa mở trong đợt thí điểm; chỉ có buổi nhóm do giáo viên xếp.', 'Saved on the server. One-to-one meetings are not open in the pilot; only teacher-run group sessions.')}</p>
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
