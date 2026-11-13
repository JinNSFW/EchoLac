'use strict';
// Hash routing, navigation and cleanup when leaving a screen.

/* ================= Router ================= */
const TABS = [['home', 'home'], ['roleplay', 'chat'], ['tutor', 'micAi'], ['radar', 'radar'], ['profile', 'user']];
const TAB_NAMES = { home: ['Trang chủ', 'Home'], roleplay: ['Nhập vai', 'Roleplay'], tutor: ['Gia sư', 'Tutor'], radar: ['Bản đồ lỗi', 'Radar'], profile: ['Hồ sơ', 'Profile'] };
function renderNav(active) {
  const nav = $('#nav'), on = TABS.some(([k]) => k === active);
  nav.classList.toggle('hidden', !on);
  nav.innerHTML = TABS.map(([k, ic]) => `<a href="#${k}" class="${k === active ? 'active' : ''}" aria-label="${V(...TAB_NAMES[k])}" ${k === active ? 'aria-current="page"' : ''}>${icon(ic)}</a>`).join('');
}
function route() {
  const [name, arg] = (location.hash.slice(1) || (S.user ? 'home' : 'signup')).split('/');
  let view = VIEWS[name] ? name : 'home';
  if (!S.user && !['signup', 'signin'].includes(view)) view = 'signup';
  clearTalk(); clearTimeout(P); P = null; closeSheet(); stopCam(); clearPractice(); stopScan(true);
  const app = $('#app');
  VIEWS[view].init?.(arg);
  app.innerHTML = VIEWS[view].render(arg);
  app.classList.toggle('no-nav', !TABS.some(([k]) => k === view));
  renderNav(view);
  document.documentElement.lang = S.lang;
  scrollTo(0, 0);
  VIEWS[view].mount?.(arg);
  observe(app);
}
window.addEventListener('hashchange', route);
