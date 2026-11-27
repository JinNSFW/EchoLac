'use strict';
// Roleplay tab menu: one entry point for the three practice modes (PRD C.6).

const PLAY_MODES = [
  ['#practice/danang', 'book', 'blue', 'Luyện tập', 'Practice'],
  ['#practice/directions', 'mic', 'violet', 'Luyện tập nói', 'Speaking practice'],
  ['#roleplay', 'temple', 'amber', 'Nhập vai văn hoá', 'Cultural roleplay'],
];

function openPlayMenu() {
  if (document.body.classList.contains('play-open')) { closePlayMenu(); return false; } // second tap closes
  const root = $('#sheet-root');
  root.innerHTML = `<div class="scrim" onclick="closePlayMenu()"></div>
    <div class="play-menu" role="dialog" aria-modal="true" aria-label="${V('Chọn cách luyện', 'Choose a practice mode')}">
      <button class="play-menu-x" onclick="closePlayMenu()" aria-label="${V('Đóng', 'Close')}">${icon('x')}</button>
      ${PLAY_MODES.map(([href, ic, tone, vi, en]) => `<a class="play-opt" href="${href}" onclick="closePlayMenu()"><span class="play-ic ${tone}">${icon(ic)}</span>${V(vi, en)}</a>`).join('')}
    </div>`;
  document.body.classList.add('play-open');
  requestAnimationFrame(() => root.querySelectorAll('.scrim,.play-menu').forEach(e => e.classList.add('on')));
  root.querySelector('.play-opt').focus({ focusVisible: false }); // focus for keyboard users, no ring after a tap
  document.addEventListener('keydown', playMenuKey);
  return false; // keep the tab link from navigating
}
function closePlayMenu() {
  document.removeEventListener('keydown', playMenuKey);
  document.body.classList.remove('play-open');
  const root = $('#sheet-root');
  root.querySelectorAll('.scrim,.play-menu').forEach(e => e.classList.remove('on'));
  setTimeout(() => { if (!root.querySelector('.play-menu.on, .sheet.on')) root.innerHTML = ''; }, 250);
}
function playMenuKey(e) { if (e.key === 'Escape') closePlayMenu(); }

// Today's mission uses the learner's review queue and journey.
function todayMission() {
  const s = nextScen(), open = S.errors.filter(e => e.status === 'open').length;
  return open
    ? { href: '#tutor', text: V(`Luyện lại ${open} mục trong Gia sư.`, `Review ${open} items in Tutor.`) }
    : { href: '#scenario/' + s.id, text: V(`Thử tình huống “${L(s.name)}” hôm nay.`, `Try “${L(s.name)}” today.`) };
}
function openNotices() {
  const m = todayMission();
  openSheet(`<h2 class="sheet-title">${V('Thông báo', 'Notifications')}</h2>
    <a class="notice" href="${m.href}" onclick="closeSheet()"><span class="lbl">${V('Nhiệm vụ hôm nay', 'Today’s mission')}</span><b>${m.text}</b></a>`);
}
