'use strict';
// Tutor practice: recording and on-device scoring glue.

/* ================= Tutor practice (on-device scoring, lib/pron/) ================= */
let P = null; // router clears this on navigation; recording itself is released by pronStop
async function practiceRec(id) {
  const e = S.errors.find(x => x.id === id), mic = $('#pmic');
  if (!e || !mic || mic.disabled) return;
  const item = await pronRetryItem(e).catch(() => null);
  if (mic !== $('#pmic')) return;
  return pronStart(item, { box: '#pron-box', mic: '#pmic', hint: '#pm-hint', onScore: r => practiceScored(e, r) });
}
function practiceScored(e, r) {
  if (!learningSessionCurrent() || !pronCounts(r)) return;
  const score = r.score;
  e.attempts.push(score); e.best = Math.max(e.best, score); e.at = Date.now();
  e.attemptCount = Math.max(0, e.attemptCount || 0, e.attempts.length - 1) + 1;
  e.updatedAt = syncStamp(e.updatedAt);
  S.xp += 5; recordStudy(1);
  S.scores.pron = hasSkillScore('pron') ? pronBlend(S.scores.pron, score) : score;
  if (score >= MASTERY_SCORE && !e.days.includes(pronDayKey())) e.days.push(pronDayKey());
  if (e.days.length >= MASTERY_DAYS && e.status !== 'mastered') { e.status = 'mastered'; confetti(); }
  save();
  syncError(e);
  const fg = $('#sr .fg'), c = +fg.getAttribute('stroke-dasharray');
  fg.style.stroke = scoreColor(score); fg.style.strokeDashoffset = c * (1 - score / 100);
  countUp($('#sv'), score); $('#sr .val span').textContent = V('điểm lần này', 'this attempt');
  $('#att').innerHTML = attemptsHtml(e); $('#ms').innerHTML = masteryHtml(e);
}

function savePronCardResult(result, item) {
  if (!learningSessionCurrent() || !pronCounts(result)) return;
  const { score } = result;
  recordStudy(1);
  S.scores.pron = hasSkillScore('pron') ? pronBlend(S.scores.pron, score) : score;
  const cat = result.errors[0]?.cat;
  if (item.finals || score >= PRON_THRESHOLD || !Object.hasOwn(ERR_CAT, cat)) { save(); return; }
  const id = 'pron-' + item.id;
  let error = S.errors.find(e => e.id === id);
  if (!error) {
    error = {
      id, itemId: item.id, word: item.text, cat, best: score, attempts: [], attemptCount: 0, days: [], status: 'open',
      tip: { vi: 'Nghe mẫu rồi luyện lại.', en: 'Listen to the example and try again.' },
    };
    S.errors.push(error);
  }
  error.attemptCount = Math.max(error.attemptCount, error.attempts.length) + 1;
  error.attempts.push(score);
  error.best = Math.max(error.best, score);
  error.at = Date.now();
  error.updatedAt = syncStamp(error.updatedAt);
  save();
  syncError(error);
  const queue = $('#tq');
  if (queue) {
    queue.innerHTML = tutorList();
    observe(queue);
  }
}
function countUp(el, to) { const from = +el.textContent || 0, t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
