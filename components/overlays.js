'use strict';
// Bottom sheets, toast messages and celebrations.

let toastTimer;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2400);
}
function openSheet(html) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="scrim" onclick="closeSheet()"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grip"></div>${html}</div>`;
  requestAnimationFrame(() => root.querySelectorAll('.scrim,.sheet').forEach(e => e.classList.add('on')));
  root.querySelectorAll('[data-off]').forEach(c => setTimeout(() => (c.style.strokeDashoffset = c.dataset.off), 250));
  root.querySelectorAll('[data-w]').forEach(b => setTimeout(() => (b.style.width = b.dataset.w), 250));
}
function closeSheet() {
  const root = $('#sheet-root');
  root.querySelectorAll('.scrim,.sheet').forEach(e => e.classList.remove('on'));
  setTimeout(() => { if (!root.querySelector('.sheet.on')) root.innerHTML = ''; }, 400);
}
function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  box.innerHTML = Array.from({ length: 16 }, (_, i) => `<img src="assets/3d/${['lantern', 'sparkles', 'star'][i % 3]}.png" alt="" style="left:${Math.random() * 92}%;animation-delay:${Math.random() * 0.6}s">`).join('');
  document.body.append(box); setTimeout(() => box.remove(), 2600);
}
