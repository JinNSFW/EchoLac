'use strict';
// Hash routing, navigation and cleanup when leaving a screen.

/* ================= Router ================= */
// Tabs follow the server role (profiles.role, docs/connect-plan.md §1); Tutor and Radar stay reachable from Home shortcuts.
const ROLE_TABS = {
  student: [['home', 'home'], ['roleplay', 'chat'], ['connect', 'person'], ['profile', 'user']],
  tourist: [['discover', 'pin'], ['connections', 'send'], ['profile', 'user']],
};
const TOURIST_VIEWS = ['discover', 'spot', 'connections', 'profile'];
const TAB_NAMES = { home: ['Học', 'Learn'], roleplay: ['Nhập vai', 'Roleplay'], connect: ['Kết nối', 'Connect'], radar: ['Bản đồ lỗi', 'Radar'], profile: ['Hồ sơ', 'Profile'], discover: ['Khám phá', 'Discover'], connections: ['Kết nối', 'Connections'] };
// Without a server profile yet, use the last server role (display hint); unknown shows student tabs and redirects nothing.
const connectRole = () => { const me = S.connect?.me; if (!me) return connectHint || 'student'; return me.role === 'tourist' ? 'tourist' : 'student'; };
const roleKnown = () => !!S.connect?.me || !!connectHint;
const tabs = () => ROLE_TABS[connectRole()];
function renderNav(active) {
  const nav = $('#nav'), t = tabs(), on = t.some(([k]) => k === active);
  nav.classList.toggle('hidden', !on);
  nav.style.gridTemplateColumns = `repeat(${t.length}, minmax(0, 1fr))`;
  nav.innerHTML = t.map(([k, ic]) => `<a href="#${k}" class="${k === active ? 'active' : ''}" ${k === active ? 'aria-current="page"' : ''}${k === 'roleplay' ? ' aria-haspopup="dialog" onclick="return openPlayMenu()"' : ''}>${icon(ic)}<span>${V(...TAB_NAMES[k])}</span></a>`).join('');
}
// Tourists never reach lessons, Tutor or progress; students use #connect instead of the tourist screens.
function roleView(view) {
  if (['signup', 'signin'].includes(view) || !roleKnown()) return view;
  const tourist = connectRole() === 'tourist';
  if (tourist && !TOURIST_VIEWS.includes(view)) return 'discover';
  if (!tourist && view !== 'profile' && TOURIST_VIEWS.includes(view)) return 'connect';
  return view;
}
function route() {
  const [name, arg] = (location.hash.slice(1) || (S.user ? 'home' : 'signup')).split('/');
  let view = Object.hasOwn(VIEWS, name) ? name : 'home'; // '#toString' must not resolve to a prototype member
  if (!S.user && !['signup', 'signin'].includes(view)) view = 'signup';
  if (S.user) view = roleView(view);
  clearTalk(); clearTimeout(P); P = null; pronStop(); closeSheet(); stopCam(); clearPractice(); stopScan(true);
  clearDirectionsPractice();
  if (document.body.classList.contains('play-open')) closePlayMenu();
  const app = $('#app'), viewArg = view === name ? arg : undefined;
  VIEWS[view].init?.(viewArg);
  app.innerHTML = VIEWS[view].render(viewArg);
  app.classList.toggle('no-nav', !tabs().some(([k]) => k === view));
  renderNav(view);
  document.documentElement.lang = uiLang();
  scrollTo(0, 0);
  VIEWS[view].mount?.(viewArg);
  observe(app);
}
window.addEventListener('hashchange', route);
