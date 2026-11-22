'use strict';
// Shared onboarding fields, headings and the anonymous-account status (X-01).

/* ================= Views ================= */
const field = (id, label, ico, type, ph, d, opts = {}) => `
  <div class="field reveal" style="--d:${d}ms"><label for="${id}">${label}</label>
    <div class="input-wrap">${icon(ico)}<input id="${id}" type="${type}" placeholder="${ph}" autocomplete="${opts.ac || 'off'}" ${opts.attrs || ''}>
      <span class="ok-badge" data-ok="${id}">${icon('check')}</span>
    </div>${opts.after || ''}</div>`;

const steps = n => `<div class="steps reveal" role="progressbar" aria-valuemin="1" aria-valuemax="2" aria-valuenow="${n}" aria-label="${V('Tiến trình', 'Progress')}"><span class="on"></span><span class="${n > 1 ? 'on' : ''}"></span><b>${V('Bước', 'Step')} ${n}/2</b></div>`;
const authHead = (title, sub, back = 'history.length>1&&(event.preventDefault(),history.back())') => `
  <div class="topbar reveal">
    <a class="icon-btn" href="#signup" onclick="${back}" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a>
    <div class="grow center"><h1 class="grad-title" style="font-size:26px">${title}</h1><p class="small muted mt-8" style="font-size:13px">${sub}</p></div>
    <button class="icon-btn" style="font-weight:700;font-size:13px" onclick="setLang('${S.lang === 'vi' ? 'en' : 'vi'}')" aria-label="${V('Switch to English', 'Chuyển sang tiếng Việt')}">${S.lang === 'vi' ? 'EN' : 'VI'}</button>
  </div>
  <div class="tile-3d logo-tile reveal zoom" style="--d:120ms">${LOGO()}</div>`;

/* ================= Anonymous account ================= */
// lib/cloud is optional: every call is guarded so the app stays local-only without it or its config.
const cloudReady = () => typeof canUseCloud === 'function' && canUseCloud();
const cloudId = () => (typeof cloudUserId === 'function' && cloudUserId()) || '';
const isSynced = () => typeof cloudProfileSynced === 'function' && cloudProfileSynced();
const acctStatus = () => `${isSynced()
  ? `<span class="tag green">${icon('check', 'sm')} ${V('Đã đồng bộ', 'Synced')}</span>`
  : `<span class="tag">${cloudId() ? V('Có thay đổi chưa đồng bộ', 'Changes not synced yet') : V('Chỉ lưu trên máy này', 'Saved on this device only')}</span>`}${cloudId() ? ` <span class="tiny muted">ID ${esc(cloudId().slice(0, 8))}</span>` : ''}`;
const deviceNote = () => `<div class="tutor-note mt-16 reveal">${icon('shield', 'sm')}<p>${V(
  'Không cần email hay mật khẩu: tiến độ gắn với máy và trình duyệt này (tài khoản ẩn danh). Đổi máy hoặc xoá dữ liệu trình duyệt sẽ mất liên kết tiến độ.',
  'No email or password: your progress is tied to this device and browser (anonymous account). Changing device or clearing browser data loses the link to your progress.')}</p></div>`;
// Profile card: status, device warning, voice-upload consent (PRD §9, revocable here) and sign-out
const accountCard = () => {
  const voice = !!S.user.voiceConsentAt, voiceLbl = V('Cho phép gửi giọng nói tới máy chủ chấm điểm', 'Allow sending my voice to the scoring server');
  return `<section class="card reveal">
    <div class="set-row"><span class="ic">${icon('user')}</span><div class="grow"><div>${V('Tài khoản ẩn danh', 'Anonymous account')}</div><div id="acct-status" class="mt-8" role="status">${acctStatus()}</div></div></div>
    ${deviceNote()}
    <div class="set-row mt-16"><span class="ic">${icon('mic')}</span><div class="grow"><div>${voiceLbl}</div><div class="tiny muted mt-8">${V('Máy chủ đặt ngoài Việt Nam. Bản ghi chỉ dùng để chấm điểm, không được lưu. Tắt bất cứ lúc nào.', 'The server is outside Vietnam. Recordings are used only for scoring and are never stored. Turn off at any time.')}</div></div>
      <button id="acct-voice" class="toggle ${voice ? 'on' : ''}" onclick="setVoiceConsent(this.getAttribute('aria-pressed') !== 'true')" aria-label="${voiceLbl}" aria-pressed="${voice}"></button></div>
    <div class="set-row"><span class="ic" style="color:var(--danger)">${icon('logout')}</span><button class="grow" style="text-align:left;color:var(--danger);font-weight:600" onclick="signOut()">${V('Đăng xuất và xoá dữ liệu trên máy', 'Sign out and clear this device')}</button></div>
  </section>`;
};
