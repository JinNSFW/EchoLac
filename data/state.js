'use strict';
// Shared prototype state and persistence.

/* ================= State ================= */
const S = {
  lang: store.get('lang', 'vi'),
  user: store.get('user', null),
  settings: store.get('settings', { accent: 'en-GB', rate: 'medium', subs: true }),
  errors: store.get('errors', SEED_ERRORS),
  scores: store.get('scores', { fluency: 62, vocab: 71, grammar: 58, pron: 49 }),
  xp: store.get('xp', 1240),
  sessions: store.get('sessions', 12),
  minutes: store.get('minutes', 96),
  done: store.get('done', ['dragon']),
  place: store.get('place', 'other'),
  streak: 3, // days in a row before today
  today: store.get('today', { date: iso(), min: 0 }),
  cam: store.get('cam', {}), // camera-lesson progress per location id; never coordinates or photos
  rpMode: 'journey', libCat: 'all', tutorCat: 'all', weekOff: 0, heard: new Set(), learnTab: 'discover',
};
if (S.today.date !== iso()) S.today = { date: iso(), min: 0 };
if (!S.user && new URLSearchParams(location.search).has('demo')) S.user = { name: 'Nguyễn Thị Lan' }; // ?demo skips sign-in for pitch demos
const save = () => ['lang', 'user', 'settings', 'errors', 'scores', 'xp', 'sessions', 'minutes', 'done', 'today', 'place', 'cam'].forEach(k => store.set(k, S[k]));
const level = () => Math.floor(S.xp / 250) + 1;
const streakNow = () => S.streak + (S.today.min > 0 ? 1 : 0);
const avgScore = () => Math.round(CRIT.reduce((a, c) => a + S.scores[c.k], 0) / CRIT.length);
const cefr = v => CEFR.find(([min]) => v >= min);
const weakest = () => CRIT.reduce((w, c) => (S.scores[c.k] < S.scores[w.k] ? c : w));
const nextScen = () => scen(JOURNEY.find(id => !S.done.includes(id)) || 'hoian');
const stopState = i => (S.done.includes(JOURNEY[i]) ? 'done' : i <= S.done.length + 1 ? 'open' : 'locked');
const isLocked = id => stopState(JOURNEY.indexOf(id)) === 'locked';
