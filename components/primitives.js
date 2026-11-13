'use strict';
// Shared score rings, language toggle and Tutor bubbles.

/* ================= UI primitives ================= */
const ringSvg = (pct, r = 36, w = 8, color = 'var(--navy)', bg = 'rgba(255,255,255,.55)') => {
  const c = 2 * Math.PI * r, size = (r + w) * 2;
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${bg}" stroke-width="${w}"/><circle class="fg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c * (1 - pct / 100)}"/></svg>`;
};
const ipaHl = e => (e.hl ? esc(e.ipa).replace(esc(e.hl), `<span class="hl">${esc(e.hl)}</span>`) : esc(e.ipa || ''));
const scoreColor = v => (v >= 80 ? 'var(--success)' : v >= 60 ? 'var(--primary)' : 'var(--lantern-b)');
const langToggle = () => `<div class="lang-toggle" role="group" aria-label="${V('Ngôn ngữ', 'Language')}">${['vi', 'en'].map(l => `<button class="${S.lang === l ? 'on' : ''}" onclick="setLang('${l}')">${l.toUpperCase()}</button>`).join('')}</div>`;
const tutorSay = (html, d = 0, extra = '') => `<div class="tutor-say reveal ${extra}" style="--d:${d}ms"><div class="av">${LOGO('AI Tutor')}</div><div class="bubble">${html}</div></div>`;
