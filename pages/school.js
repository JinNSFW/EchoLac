'use strict';
// #school: verified school_admin (members, verification, minor approval, invite code) and teacher (group sessions).
// The page reads the role from the server profile; every RPC and RLS policy checks it again.
let shownInvite = null; // shown once after rotating, never stored
const minorApproval = id => S.connect.approvals.find(a => a.student_id === id && !a.revoked_at) || null;
const opt = (map, cur) => Object.keys(map).map(k => `<option value="${k}" ${k === cur ? 'selected' : ''}>${cLabel(map, k)}</option>`).join('');
const STAFF_ROLES = { student: ROLE_NAMES.student, teacher: ROLE_NAMES.teacher, school_admin: ROLE_NAMES.school_admin };

async function saveMember(btn) {
  const row = btn.closest('[data-m]'), v = n => row.querySelector(`[name="${n}"]`).value || null;
  btn.disabled = true;
  const r = await setMember(row.dataset.m, v('role'), v('verification'), v('age'));
  r.ok ? toast(V('Đã lưu', 'Saved')) : (btn.disabled = false, actFail(r));
}
async function approveMinor(btn, on) { btn.disabled = true; const r = await setMinorApproval(btn.closest('[data-m]').dataset.m, on); if (!r.ok) { btn.disabled = false; actFail(r); } }
async function newInvite(btn) {
  btn.disabled = true;
  const r = await rotateInvite();
  if (!r.ok) { btn.disabled = false; return actFail(r); }
  try { shownInvite = r.data; rerender(); } finally { shownInvite = null; } // gone on the next render
}
async function submitSession(e) {
  e.preventDefault();
  const f = e.target, at = n => new Date(f[n].value).toISOString();
  if (!approvedPlace(f.place.value) || !f.start.value || !f.end.value) return toast(V('Điền đủ địa điểm và thời gian.', 'Fill in the place and times.'));
  const r = await createSession({ location_id: f.place.value, starts_at: at('start'), ends_at: at('end'), capacity: Math.min(50, Math.max(1, Number(f.cap.value) || 10)) });
  r.ok ? toast(V('Đã tạo buổi nhóm', 'Group session created')) : actFail(r);
}

function memberRow(m) {
  const minor = m.age_group === 'minor', ap = minorApproval(m.id);
  return `<article class="c-req" data-m="${esc(m.id)}">
    <div class="row between"><b>${esc(m.display_name || V('Thành viên', 'Member'))}</b><span class="tag">${cLabel(VERIFY_NAMES, m.verification_status)}</span></div>
    <div class="c-form mt-8">
      <select name="role" aria-label="${V('Vai trò', 'Role')}">${opt(STAFF_ROLES, m.role)}</select>
      <select name="verification" aria-label="${V('Xác minh', 'Verification')}">${opt(VERIFY_NAMES, m.verification_status)}</select>
      <select name="age" aria-label="${V('Nhóm tuổi', 'Age group')}"><option value="">—</option>${opt(AGE_NAMES, m.age_group)}</select>
    </div>
    <div class="c-actions"><button class="btn sm" onclick="saveMember(this)">${V('Lưu', 'Save')}</button>
      ${minor ? (ap?.school_approved_at
        ? `<button class="btn white sm" onclick="approveMinor(this,false)">${V('Thu hồi phê duyệt', 'Revoke approval')}</button>`
        : `<button class="btn white sm" onclick="approveMinor(this,true)">${V('Phê duyệt học sinh dưới 18', 'Approve minor')}</button>`) : ''}</div>
    ${minor ? `<p class="tiny muted">${V('Phụ huynh đồng ý', 'Guardian consent')}: ${ap?.guardian_consent_at ? V('Đã có', 'Given') : `${V('Chưa mở', 'Not open yet')} · ${V('cần luồng email đồng ý phụ huynh', 'needs the guardian email flow')}`}</p>` : ''}
  </article>`;
}

function adminPart() {
  return `<div class="section-title"><span>${V('Thành viên', 'Members')}</span><span class="tiny muted">${S.connect.members.length}</span></div>
    ${S.connect.members.length ? `<div class="c-list">${S.connect.members.map(memberRow).join('')}</div>` : `<div class="card center"><p class="muted">${V('Chưa có thành viên.', 'No members yet.')}</p></div>`}
    <div class="section-title"><span>${V('Mã mời', 'Invite code')}</span></div>
    <section class="card">${shownInvite
      ? `<p><b class="c-code">${esc(shownInvite)}</b></p><p class="small muted">${V('Chỉ hiện một lần. Ghi lại ngay; mã cũ đã hết hiệu lực.', 'Shown once. Write it down now; the old code no longer works.')}</p>`
      : `<p class="small muted">${V('Máy chủ chỉ lưu mã đã băm. Tạo mã mới sẽ vô hiệu mã cũ.', 'The server keeps only a hash. A new code disables the old one.')}</p>
         <button class="btn white sm mt-8" onclick="newInvite(this)">${icon('refresh', 'sm')} ${V('Tạo mã mời mới', 'New invite code')}</button>`}</section>`;
}

function teacherPart() {
  const places = S.connect.locations, mine = S.connect.sessions;
  return `<div class="section-title"><span>${V('Buổi nhóm có giám sát', 'Supervised group sessions')}</span></div>
    <form class="card c-form" onsubmit="submitSession(event)">
      <select name="place" aria-label="${V('Địa điểm', 'Place')}">${places.map(l => `<option value="${esc(l.id)}">${placeName(l.id)}</option>`).join('')}</select>
      <label class="small">${V('Bắt đầu', 'Starts')} <input name="start" type="datetime-local" required></label>
      <label class="small">${V('Kết thúc', 'Ends')} <input name="end" type="datetime-local" required></label>
      <label class="small">${V('Sức chứa', 'Capacity')} <input name="cap" type="number" min="1" max="50" value="10"></label>
      <button class="btn sm">${V('Tạo buổi nhóm', 'Create session')}</button>
    </form>
    ${mine.length ? `<div class="c-list mt-16">${mine.map(g => `<article class="c-req"><b>${placeName(g.location_id)}</b>
      <p class="small muted">${esc(new Date(g.starts_at).toLocaleString(S.lang))} · ${esc(String(g.capacity))} ${V('chỗ', 'places')} · ${g.status === 'cancelled' ? V('Đã huỷ', 'Cancelled') : V('Đã lên lịch', 'Scheduled')}</p></article>`).join('')}</div>` : ''}`;
}

VIEWS.school = {
  render() {
    const me = S.connect.me, head = `<header class="c-head"><h1>${V('Trường của bạn', 'Your school')}</h1>
      ${S.connect.school ? `<p class="muted">${esc(S.connect.school.name)}</p>` : ''}</header>`;
    if (!me) return head + connectGate();
    if (!isStaff(me)) return head + `<div class="card c-gate" role="alert"><p>${V('Trang này chỉ dành cho giáo viên và quản trị trường đã được xác minh.', 'This page is only for verified teachers and school admins.')}</p></div>`;
    return head + (me.role === 'school_admin' ? adminPart() : teacherPart()) + safetyNote();
  },
  mount: () => connectMount(),
};
