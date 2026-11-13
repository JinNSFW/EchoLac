'use strict';
// Scroll-reveal behaviour with reduced-motion support.

/* ================= Scroll reveal ================= */
function show(el) {
  el.classList.add('in');
  el.querySelectorAll('[data-off]').forEach(c => (c.style.strokeDashoffset = c.dataset.off));
  el.querySelectorAll('[data-w]').forEach(b => (b.style.width = b.dataset.w));
  el.querySelectorAll('[data-left]').forEach(b => (b.style.left = b.dataset.left));
}
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { threshold: 0.08, rootMargin: '0px 0px -24px 0px' })
  : null;
const observe = root => root.querySelectorAll('.reveal:not(.in)').forEach(el => (io ? io.observe(el) : show(el)));
