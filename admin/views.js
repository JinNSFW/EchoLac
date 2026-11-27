'use strict';
// Admin console markup (Vietnamese only). Every value from the database or the user goes through esc().
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const LEVELS = { A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2', C1: 'C1' };
const VERIFY = { unverified: 'Chưa xác minh', verified: 'Đã xác minh', rejected: 'Từ chối' };
const AGE = { adult: 'Từ 18 tuổi', minor: 'Dưới 18 tuổi' };
const ROLE = { student: 'Học sinh', tourist: 'Du khách' };
const STATUS = { pending: 'Đang chờ', accepted: 'Đã chấp nhận', declined: 'Đã từ chối', cancelled: 'Đã huỷ', blocked: 'Đã chặn',
  scheduled: 'Đã lên lịch', open: 'Mới', reviewed: 'Đã xem', closed: 'Đã đóng' };
const TABS = [['learners', 'Học viên'], ['sessions', 'Buổi nhóm'], ['requests', 'Yêu cầu & báo cáo'], ['audit', 'Nhật ký']];

const label = (map, k) => esc(Object.hasOwn(map, k) ? map[k] : k);
const when = t => (t ? esc(new Date(t).toLocaleString('vi-VN')) : '—');
const short = id => `<code>${esc(String(id || '').slice(0, 8))}</code>`;
const who = (people, id) => (id ? `${esc(people[id]?.display_name || 'Người dùng')} ${short(id)}` : '—');
const opts = (map, cur, blank) => (blank ? '<option value="">—</option>' : '')
  + Object.entries(map).map(([k, v]) => `<option value="${esc(k)}"${k === cur ? ' selected' : ''}>${esc(v)}</option>`).join('');
const table = (head, rows, empty) => (rows.length
  ? `<div class="scroll"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`
  : `<p class="muted">${empty}</p>`);
const note = msg => (msg ? `<p class="msg" role="alert">${esc(msg)}</p>` : '');

function loginView(msg) {
  return `<form id="login" class="card"><h2>Đăng nhập quản trị</h2>
    <label>Email <input name="email" type="email" autocomplete="username" required></label>
    <label>Mật khẩu <input name="password" type="password" autocomplete="current-password" minlength="12" required></label>
    <button>Đăng nhập</button>${note(msg)}
    <p class="muted">Tài khoản admin do chủ dự án tạo trong Supabase Dashboard. Không có đăng ký ở đây.</p></form>`;
}

// qr is the SVG data URL from supabase.auth.mfa.enroll; the caller checks its prefix.
function enrollView(qr, secret, msg) {
  return `<form id="mfa" class="card"><h2>Bật xác thực hai bước (TOTP)</h2>
    <p>Quét mã bằng ứng dụng xác thực (Google Authenticator, 1Password…), rồi nhập mã 6 số.</p>
    <img class="qr" src="${esc(qr)}" alt="Mã QR TOTP" width="180" height="180">
    <p class="muted">Không quét được? Nhập khoá: <code class="wrap">${esc(secret)}</code></p>
    <label>Mã 6 số <input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>
    <button>Xác nhận</button>${note(msg)}</form>`;
}

function verifyView(msg) {
  return `<form id="mfa" class="card"><h2>Xác thực hai bước</h2>
    <label>Mã 6 số từ ứng dụng xác thực <input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>
    <button>Xác nhận</button>${note(msg)}</form>`;
}

const tabsView = active => `<nav class="tabs" role="tablist">${TABS.map(([k, v]) =>
  `<button type="button" role="tab" data-tab="${k}" aria-selected="${k === active}">${v}</button>`).join('')}</nav>`;

function learnersView({ profiles }) {
  const row = r => `<tr data-id="${esc(r.id)}"><td>${esc(r.display_name || '—')} ${short(r.id)}</td><td>${label(ROLE, r.role)}</td>
    <td><select name="verification" aria-label="Xác minh">${opts(VERIFY, r.verification_status)}</select></td>
    <td><select name="level" aria-label="Trình độ">${opts(LEVELS, r.level, true)}</select></td>
    <td><select name="age" aria-label="Nhóm tuổi">${opts(AGE, r.age_group, true)}</select></td>
    <td><button type="button" data-act="save-learner">Lưu</button></td></tr>`;
  const head = ['Tên', 'Vai trò', 'Xác minh', 'Trình độ', 'Nhóm tuổi', ''];
  const pending = profiles.filter(p => p.verification_status !== 'verified'), done = profiles.filter(p => p.verification_status === 'verified');
  return `<h2>Chờ xác minh (${pending.length})</h2>${table(head, pending.map(row), 'Không có ai chờ.')}
    <h2>Đã xác minh (${done.length})</h2>${table(head, done.map(row), 'Chưa có ai.')}
    <p class="muted">Đã xác minh cần nhóm tuổi. Học sinh cần trình độ từ A2 để kết nối.</p>`;
}

function sessionsView({ sessions, places }) {
  const place = id => esc(places.find(p => p.id === id)?.name_vi || id);
  const row = g => `<tr data-id="${esc(g.id)}"><td>${place(g.location_id)}</td><td>${when(g.starts_at)}</td><td>${when(g.ends_at)}</td>
    <td>${esc(g.capacity)}</td><td>${label(STATUS, g.status)}</td>
    <td>${g.status === 'scheduled' ? '<button type="button" data-act="close-session">Đóng buổi</button>' : ''}</td></tr>`;
  return `<form id="new-session" class="card"><h2>Tạo buổi nhóm có giám sát</h2>
    <label>Địa điểm đã duyệt <select name="place" required>${places.map(p => `<option value="${esc(p.id)}">${esc(p.name_vi)}</option>`).join('')}</select></label>
    <label>Bắt đầu <input name="start" type="datetime-local" required></label>
    <label>Kết thúc <input name="end" type="datetime-local" required></label>
    <label>Sức chứa <input name="cap" type="number" min="1" max="50" value="10" required></label>
    <button>Tạo buổi</button><p class="muted">Bạn là người giám sát buổi này. Đóng buổi sẽ huỷ các yêu cầu đang mở.</p></form>
    <h2>Các buổi (${sessions.length})</h2>${table(['Địa điểm', 'Bắt đầu', 'Kết thúc', 'Sức chứa', 'Trạng thái', ''], sessions.map(row), 'Chưa có buổi nào.')}`;
}

function requestsView({ requests, reports, blocks, people }) {
  const req = r => `<tr><td>${when(r.created_at)}</td><td>${who(people, r.tourist_id)}</td><td>${who(people, r.student_id)}</td>
    <td>${esc(r.location_id)}</td><td>${esc(r.mode)}</td><td>${label(STATUS, r.status)}</td></tr>`;
  const rep = r => `<tr data-id="${esc(r.id)}"><td>${when(r.created_at)}</td><td>${who(people, r.reporter_id)}</td><td>${who(people, r.reported_id)}</td>
    <td>${esc(r.reason)}</td><td>${label(STATUS, r.status)}</td><td>${r.status === 'closed' ? '' : `${r.status === 'open'
      ? '<button type="button" data-act="report" data-status="reviewed">Đã xem</button> ' : ''}<button type="button" data-act="report" data-status="closed">Đóng</button>`}</td></tr>`;
  const blk = b => `<tr><td>${when(b.created_at)}</td><td>${who(people, b.blocker_id)}</td><td>${who(people, b.blocked_id)}</td></tr>`;
  return `<h2>Báo cáo (${reports.length})</h2>${table(['Lúc', 'Người báo', 'Bị báo', 'Lý do', 'Trạng thái', ''], reports.map(rep), 'Không có báo cáo.')}
    <h2>Yêu cầu kết nối (${requests.length})</h2>${table(['Lúc', 'Du khách', 'Học sinh', 'Địa điểm', 'Hình thức', 'Trạng thái'], requests.map(req), 'Không có yêu cầu.')}
    <h2>Chặn (${blocks.length})</h2>${table(['Lúc', 'Người chặn', 'Bị chặn'], blocks.map(blk), 'Không có.')}`;
}

function auditView({ audit }) {
  const row = a => `<tr><td>${when(a.created_at)}</td><td>${short(a.actor_id)}</td><td>${esc(a.action)}</td>
    <td>${esc(a.target_table)} ${short(a.target_id)}</td><td><code class="wrap">${esc(JSON.stringify(a.details))}</code></td></tr>`;
  return `<h2>Nhật ký quản trị (200 dòng mới nhất, chỉ đọc)</h2>${table(['Lúc', 'Admin', 'Hành động', 'Đối tượng', 'Chi tiết'], audit.map(row), 'Chưa có dòng nào.')}`;
}

const VIEWS = { learners: learnersView, sessions: sessionsView, requests: requestsView, audit: auditView };
