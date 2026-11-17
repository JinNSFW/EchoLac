'use strict';
// Theme rendering; THEMES remains in app.js as required by AGENTS.md (X-06).

// Writes one :root[data-theme] block per entry of THEMES, so colours have a single source
function installThemes() {
  const css = Object.entries(THEMES).map(([id, t]) => `:root[data-theme="${id}"]{${Object.entries(t.c).map(([k, v]) => `--${k}:${v}`).join(';')}}`).join('\n');
  document.head.insertAdjacentHTML('beforeend', `<style id="themes">${css}</style>`);
  installIconArt();
}
// Crossfade: the new layer fades in on top while the old one fades out, then is removed
function swapLayer(host, html, cls = '') {
  host.querySelectorAll('.layer').forEach(l => { l.classList.add('leave'); setTimeout(() => l.remove(), 1300); });
  host.insertAdjacentHTML('beforeend', `<div class="layer ${cls}">${html}</div>`);
}
/* ---------- Landmark scenes ----------
   Each place shows its painted scenes in turn (SCENE_MS each) at the top of every screen.
   One scene, reduced motion or a hidden tab: the scene stays put. */
const SCENE_MS = 7000;
const SCENE = { key: 'other', i: 0, timer: 0 };
const sceneName = (key = SCENE.key, i = SCENE.i) => { const s = theme(key).scenes?.[i]; return s ? V(s[1], s[2]) : L(theme(key).scene); };
function showScene(key, i, slow) {
  const s = THEMES[key].scenes[i], src = `assets/scenes/${key}/${s[0]}.webp`, im = new Image();
  Object.assign(SCENE, { key, i });
  im.onload = () => SCENE.key === key && SCENE.i === i && swapLayer($('.bg'), `<img class="hero-scene" src="${src}" alt="">`, slow ? 'slow' : '');
  im.src = src;
  [$('#theme-note b'), $('#home-place')].forEach(el => el && (el.textContent = sceneName(key, i))); // labels follow the scene on screen
}
function playScenes(key) {
  clearInterval(SCENE.timer);
  const n = THEMES[key].scenes?.length || 0;
  if (!n) { Object.assign(SCENE, { key, i: 0 }); return swapLayer($('.bg'), THEMES[key].hero === 'logo' ? '<span class="hero-logo"></span>' : ''); }
  showScene(key, 0, false);
  if (n > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    SCENE.timer = setInterval(() => !document.hidden && showScene(key, (SCENE.i + 1) % n, true), SCENE_MS);
  }
}
function applyTheme(id, from) {
  const key = THEMES[id] ? id : 'other';
  document.documentElement.dataset.theme = key;
  $('meta[name="theme-color"]').content = theme(key).c.bg1;
  if (SCENE.key !== key || !$('.bg .layer')) playScenes(key);
  if (from) {
    const b = document.createElement('i'); b.className = 'burst';
    b.style.left = from.x + 'px'; b.style.top = from.y + 'px';
    document.body.append(b); setTimeout(() => b.remove(), 800);
  }
}
