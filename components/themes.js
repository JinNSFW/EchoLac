'use strict';
// Theme rendering; THEMES remains in app.js as required by AGENTS.md (X-06).

const rnd = (a, b) => a + Math.random() * (b - a);
function particles(type, n, band = [4, 55]) {
  const [s0, s1, t0, t1] = { petal: [8, 14, 9, 16], mist: [160, 260, 30, 50], star: [2, 4, 1.5, 3.5] }[type];
  return Array.from({ length: n }, () => {
    const s = rnd(s0, s1), t = rnd(t0, t1);
    const pos = type === 'mist' ? `top:${rnd(...band).toFixed(0)}%;left:-${s.toFixed(0)}px`
      : type === 'star' ? `top:${rnd(...band).toFixed(0)}%;left:${rnd(3, 97).toFixed(0)}%` : `left:${rnd(0, 96).toFixed(0)}%`;
    const dx = type === 'mist' ? '760px' : `${rnd(-60, 60).toFixed(0)}px`;
    return `<i class="fx ${type}" style="${pos};--s:${s.toFixed(1)}px;--t:${t.toFixed(1)}s;--dl:-${rnd(0, t).toFixed(1)}s;--dx:${dx}"></i>`;
  }).join('');
}
// Writes one :root[data-theme] block per entry of THEMES, so colours have a single source
function installThemes() {
  const css = Object.entries(THEMES).map(([id, t]) => `:root[data-theme="${id}"]{${Object.entries(t.c).map(([k, v]) => `--${k}:${v}`).join(';')}}`).join('\n');
  document.head.insertAdjacentHTML('beforeend', `<style id="themes">${css}</style>`);
}
// Crossfade: the new layer fades in while the old one fades out (400 ms)
function swapLayer(host, html) {
  host.querySelectorAll('.layer').forEach(l => { l.classList.add('leave'); setTimeout(() => l.remove(), 450); });
  host.insertAdjacentHTML('beforeend', `<div class="layer scene">${html}</div>`);
}
function applyTheme(id, from) {
  const t = theme(id);
  document.documentElement.dataset.theme = THEMES[id] ? id : 'other';
  $('meta[name="theme-color"]').content = t.c.bg1;
  swapLayer($('.bg'), `${t.pattern ? `<div class="pattern" style="background:${t.pattern}"></div>` : ''}${t.frame ? `<div class="frame" style="background:${t.frame}"></div>` : ''}${t.land ? `<div class="land">${t.land()}</div>` : ''}`);
  swapLayer($('.fx-layer'), t.fx ? t.fx() : '');
  if (from) {
    const b = document.createElement('i'); b.className = 'burst';
    b.style.left = from.x + 'px'; b.style.top = from.y + 'px';
    document.body.append(b); setTimeout(() => b.remove(), 800);
  }
}
