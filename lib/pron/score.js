'use strict';
// Score 0-100 from one decoded clip, plus the mastery rule (T-05) and the running-score blend. Pure functions; no model, no DOM.
// A clip that decodes to nothing or with low posteriors is never scored: the learner is asked to repeat.
const pronClamp = (v, a, b) => Math.max(a, Math.min(b, v));

function pronScore(dec, item, tk, cats = {}) {
  const { phones: exp, finals } = pronNormalise(item?.ipa ?? [], tk, item?.finals);
  const got = pronNormalise(dec?.tokens ?? [], tk);
  const noScore = reason => ({ lowConfidence: true, reason, score: null, errors: [], heard: got.phones, expected: exp });
  if (!got.phones.length || !Number.isFinite(dec?.conf) || dec.conf < PRON_MIN_CONF || dec.conf > 1 || !exp.length) return noScore('unclear');
  const ops = pronAlign(exp, got.phones, tk), cost = ops.reduce((a, o) => a + o.cost, 0);
  const matches = ops.filter(o => o.op === 'match').length;
  const expected = exp.length - ops.filter(o => o.op === 'del' && o.cost === 0).length;
  if (!matches || matches / Math.max(expected, got.phones.length) < PRON_MIN_MATCH) return noScore('mismatch');
  const reference = PRON_LOW_CONF.includes(item.category) || cats[item.category]?.confidence === 'low'; // PRD §6: label, not error items/radar
  const classifiedItem = item.finals ? { ...item, finals } : item;
  const errors = reference ? [] : pronClassify(ops, classifiedItem, tk, exp, got.phones, got.glottal);
  return { lowConfidence: false, reference, score: pronClamp(Math.round(100 * (1 - cost / exp.length)), 0, 100), errors, heard: got.phones, expected: exp };
}

const pronDayKey = (ts = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: PRON_TZ }).format(ts); // YYYY-MM-DD in Asia/Ho_Chi_Minh
// attempts: [{ score, at }] -> mastered when >= MASTERY_SCORE on MASTERY_DAYS different days
const pronMastered = attempts => new Set(attempts.filter(a => a.score >= MASTERY_SCORE).map(a => pronDayKey(a.at))).size >= MASTERY_DAYS;
const pronBlend = (current, score) => pronClamp(Math.round(current + (score - current) * TUTOR_WEIGHT * PRON_STEP), 0, 100);
// Only reliable results feed progress, radar and error items.
const pronCounts = r => !r.lowConfidence && !r.reference && Number.isFinite(r.score);
