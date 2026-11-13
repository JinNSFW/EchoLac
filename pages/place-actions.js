'use strict';
// Onboarding and saved-place actions (X-01, X-06).

// Radio groups (gender, hometown/destination): one tab stop, arrow keys move and select
function setRadio(group, v) {
  group.querySelectorAll('[role="radio"]').forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
}
function radioKeys(e) {
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (!d) return;
  e.preventDefault();
  const r = [...e.currentTarget.querySelectorAll('[role="radio"]')], i = r.indexOf(document.activeElement);
  const next = r[(Math.max(i, 0) + d + r.length) % r.length];
  next.focus(); next.click();
}
function pickGender(k) { F.gender = k; setRadio($('.choice-row'), k); window.signupCheck?.(); }
function pickType(t) { F.placeType = t; setRadio($('.seg[role="radiogroup"]'), t); $('#place-sub').textContent = placeSub(t); }
const markCards = id => document.querySelectorAll('.place').forEach(b => { const on = b.dataset.place === id; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
const burstFrom = ev => { const r = ev?.currentTarget?.getBoundingClientRect(); return r && { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
// Step 2: live preview only; nothing is saved until "Bắt đầu hành trình"
function previewPlace(id, ev) {
  F.placeId = id; markCards(id);
  applyTheme(id, burstFrom(ev));
  $('#theme-note').innerHTML = themeNote(id);
  $('#start').disabled = false;
}
function finishOnboarding(placeId) {
  Object.assign(S.user, { placeType: F.placeType, placeId, themeId: placeId });
  S.place = placeId; F.ready = false;
  save(); location.hash = '#home';
}
const startJourney = () => F.placeId && finishOnboarding(F.placeId);
function skipPlace() { applyTheme('other'); finishOnboarding('other'); }
// Profile → Settings: change place later, saved at once
function pickPlace(id, ev) {
  Object.assign(S.user, { placeId: id, themeId: id, placeType: S.user.placeType || 'hometown' });
  S.place = id; save();
  applyTheme(id, burstFrom(ev));
  const y = scrollY; route(); scrollTo(0, y); document.querySelectorAll('.reveal').forEach(show);
}
