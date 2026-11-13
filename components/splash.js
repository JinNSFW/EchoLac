'use strict';
// Cold-start splash timing and reduced-motion handling.

// Cold-start splash: stays at least 2.4s (1.8s with reduced motion) and until fonts are in, never past 4s.
// The first screen renders under it as it fades, so its own entrance animations play in view.
function splash() {
  const el = $('#splash');
  if (!el) return route();
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const min = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1800 : 2400;
  Promise.race([Promise.all([wait(min), document.fonts?.ready]), wait(4000)]).then(() => {
    route();
    el.classList.add('out');
    setTimeout(() => el.remove(), 450);
  });
}
