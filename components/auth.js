'use strict';
// Shared authentication fields and onboarding headings.

/* ================= Views ================= */
const field = (id, label, ico, type, ph, d, opts = {}) => `
  <div class="field reveal" style="--d:${d}ms"><label for="${id}">${label}</label>
    <div class="input-wrap">${icon(ico)}<input id="${id}" type="${type}" placeholder="${ph}" autocomplete="${opts.ac || 'off'}" ${opts.attrs || ''}>
      <span class="ok-badge" data-ok="${id}">${icon('check')}</span>
      ${type === 'password' ? `<button type="button" class="eye" onclick="toggleEye(this,'${id}')" aria-label="${V('Hiện mật khẩu', 'Show password')}" style="color:var(--faint)">${icon('eye')}</button>` : ''}
    </div>${opts.after || ''}</div>`;

const steps = n => `<div class="steps reveal" role="progressbar" aria-valuemin="1" aria-valuemax="2" aria-valuenow="${n}" aria-label="${V('Tiến trình', 'Progress')}"><span class="on"></span><span class="${n > 1 ? 'on' : ''}"></span><b>${V('Bước', 'Step')} ${n}/2</b></div>`;
const authHead = (title, sub, back = 'history.length>1&&(event.preventDefault(),history.back())') => `
  <div class="topbar reveal">
    <a class="icon-btn" href="#signup" onclick="${back}" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a>
    <div class="grow center"><h1 class="grad-title" style="font-size:26px">${title}</h1><p class="small muted mt-8" style="font-size:13px">${sub}</p></div>
    <button class="icon-btn" style="font-weight:700;font-size:13px" onclick="setLang('${S.lang === 'vi' ? 'en' : 'vi'}')" aria-label="${V('Switch to English', 'Chuyển sang tiếng Việt')}">${S.lang === 'vi' ? 'EN' : 'VI'}</button>
  </div>
  <div class="tile-3d logo-tile reveal zoom" style="--d:120ms">${LOGO()}</div>`;
