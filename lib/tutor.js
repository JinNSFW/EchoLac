'use strict';
// Prototype Tutor recording and simulated scoring.

/* ================= Tutor practice (simulated scoring) ================= */
let P = null;
function practiceRec(id) {
  const e = S.errors.find(x => x.id === id), m = $('#pmic'), h = $('#pm-hint');
  if (P) return;
  stopAudio();
  P = setTimeout(() => {
    m.classList.remove('rec', 'pulse'); m.disabled = true; h.textContent = V('Đang chấm điểm…', 'Scoring…');
    P = setTimeout(() => {
      const score = clamp(Math.round(Math.max(e.best, 55) + 4 + Math.random() * 18), 35, 98);
      e.attempts.push(score); e.best = Math.max(e.best, score); e.at = Date.now();
      S.xp += 5; S.today.min += 1;
      S.scores.pron = clamp(Math.round(S.scores.pron + (score - S.scores.pron) * 0.06), 0, 100); // Tutor weighs less than Roleplay, PRD §7.2
      let msg;
      if (score >= 80) {
        if (!e.days.includes(iso())) e.days.push(iso());
        if (e.days.length >= 2 && e.status !== 'mastered') { e.status = 'mastered'; confetti(); msg = V('🎉 Thành thạo! Từ này sẽ quay lại để ôn sau vài ngày.', '🎉 Mastered! This word will come back for review in a few days.'); }
        else msg = e.status === 'mastered' ? V('Tuyệt vời! Vẫn chuẩn như cũ.', 'Great! Still spot on.') : V('Tuyệt vời! Ngày mai đạt ≥80 lần nữa là thành thạo.', 'Excellent! Score ≥80 again tomorrow to master it.');
      } else msg = V('Gần rồi! ', 'Almost! ') + esc(L(e.tip));
      save();
      const fg = $('#sr .fg'), c = +fg.getAttribute('stroke-dasharray');
      fg.style.stroke = scoreColor(score); fg.style.strokeDashoffset = c * (1 - score / 100);
      countUp($('#sv'), score); $('#sr .val span').textContent = V('điểm lần này', 'this attempt');
      $('#fbt').innerHTML = msg; $('#att').innerHTML = attemptsHtml(e); $('#ms').innerHTML = masteryHtml(e);
      $('#sr').scrollIntoView({ behavior: 'smooth', block: 'start' });
      m.disabled = false; h.textContent = V('Nhấn để thử lại', 'Tap to try again'); P = null;
    }, 800);
  }, 1800);
  m.classList.add('rec', 'pulse'); h.textContent = V('Đang nghe…', 'Listening…');
}
function countUp(el, to) { const from = +el.textContent || 0, t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
