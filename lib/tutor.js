'use strict';
// Tutor practice: recording and on-device scoring glue.

/* ================= Tutor practice (on-device scoring, lib/pron/) ================= */
let P = null; // router clears this on navigation; recording itself is released by pronStop
async function practiceRec(id) {
  const e = S.errors.find(x => x.id === id), mic = $('#pmic');
  if (!e || !mic || mic.disabled) return;
  const { tk } = await pronContent().catch(() => ({}));
  if (mic !== $('#pmic')) return;
  return pronStart(tk && pronItemFromError(e, tk), { box: '#pron-box', mic: '#pmic', hint: '#pm-hint', onScore: r => practiceScored(e, r) });
}
function practiceScored(e, r) {
  if (!pronCounts(r)) return; // low confidence or reference-only: shown, never saved
  const score = r.score;
  e.attempts.push(score); e.best = Math.max(e.best, score); e.at = Date.now();
  S.xp += 5; S.today.min += 1;
  S.scores.pron = pronBlend(S.scores.pron, score); // Tutor weighs less than Roleplay (TUTOR_WEIGHT, PRD §7.2)
  if (score >= MASTERY_SCORE && !e.days.includes(pronDayKey())) e.days.push(pronDayKey());
  if (e.days.length >= MASTERY_DAYS && e.status !== 'mastered') { e.status = 'mastered'; confetti(); }
  save();
  const fg = $('#sr .fg'), c = +fg.getAttribute('stroke-dasharray');
  fg.style.stroke = scoreColor(score); fg.style.strokeDashoffset = c * (1 - score / 100);
  countUp($('#sv'), score); $('#sr .val span').textContent = V('điểm lần này', 'this attempt');
  $('#att').innerHTML = attemptsHtml(e); $('#ms').innerHTML = masteryHtml(e);
}
function countUp(el, to) { const from = +el.textContent || 0, t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
