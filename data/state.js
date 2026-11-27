'use strict';
// Account state, local progress and practice dates.

const emptyScores = () => ({ fluency: null, vocab: null, grammar: null, pron: null });
const defaultSettings = () => ({ accent: 'en-GB', rate: 'medium', subs: true });
const studyDateFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
const studyDate = () => studyDateFormat.format(new Date());
const priorStudyDate = (date, days) => new Date(Date.parse(date) - days * 864e5).toISOString().slice(0, 10);
const demoScores = { fluency: 62, vocab: 71, grammar: 58, pron: 49 };
const demoError = e => SEED_ERRORS.find(seed => seed.id === e?.id);
const unchangedDemoError = e => {
  const seed = demoError(e);
  return seed && Math.max(e.attemptCount || 0, e.attempts?.length || 0) <= seed.attempts.length;
};

function migrateLearningProgress(owner) {
  const savedErrors = rawStore.get('errors', []), errors = Array.isArray(savedErrors) ? savedErrors.filter(Boolean) : [];
  const scores = rawStore.get('scores', {}) ?? {};
  const seeded = errors.some(demoError) || Object.entries(demoScores).every(([key, score]) => scores[key] === score);
  const counter = (key, seed) => Math.max(0, (Number(rawStore.get(key, 0)) || 0) - (seeded ? seed : 0));
  const done = rawStore.get('done', []);
  const progress = {
    errors: errors.filter(e => !unchangedDemoError(e)),
    scores: Object.fromEntries(Object.keys(emptyScores()).map(key => [key, scores[key] === demoScores[key] && seeded ? null : scores[key] ?? null])),
    xp: counter('xp', 1240), sessions: counter('sessions', 12), minutes: counter('minutes', 96),
    done: Array.isArray(done) ? done.filter(id => id !== 'dragon' || !seeded || counter('sessions', 12) > 0) : [],
  };
  for (const key of learningKeys) {
    const value = Object.hasOwn(progress, key) ? progress[key] : rawStore.get(key, undefined);
    if (value !== undefined && rawStore.get(learningKey(owner, key), undefined) === undefined) {
      rawStore.set(learningKey(owner, key), value);
    }
  }
}

const initialUser = rawStore.get('user', null);
if (initialUser) {
  const owner = rawStore.get('cloud-owner', null);
  const legacyProfile = !initialUser.learningId && initialUser.consent?.terms;
  openLearningSession(initialUser, owner);
  if (legacyProfile) migrateLearningProgress(learningOwner);
}

function loadLearningProgress() {
  const today = store.get('today', { date: studyDate(), min: 0 });
  const days = store.get('study-days', []);
  if (today.min > 0 && !days.includes(today.date)) days.push(today.date);
  return {
    errors: store.get('errors', []), scores: store.get('scores', emptyScores()),
    xp: store.get('xp', 0), sessions: store.get('sessions', 0), minutes: store.get('minutes', 0),
    done: store.get('done', []), cam: store.get('cam', {}),
    today: today.date === studyDate() ? today : { date: studyDate(), min: 0 }, 'study-days': days,
  };
}

const S = {
  lang: store.get('lang', 'vi'),
  user: initialUser,
  settings: initialUser ? store.get('settings', defaultSettings()) : defaultSettings(),
  place: initialUser ? store.get('place', 'other') : 'other',
  ...loadLearningProgress(),
  rpMode: 'journey', libCat: 'all', tutorCat: 'all', weekOff: 0, heard: new Set(), learnTab: 'discover',
};
function startLearningAccount(user, owner) {
  openLearningSession(user, owner);
  Object.assign(S, { user, settings: defaultSettings(), place: 'other' }, loadLearningProgress());
}
function save() {
  store.set('lang', S.lang);
  if (!S.user || !learningSessionCurrent()) return;
  ['user', 'settings', 'place', 'errors', 'scores', 'xp', 'sessions', 'minutes', 'done', 'today', 'cam', 'study-days']
    .forEach(key => store.set(key, S[key]));
}

function recordStudy(minutes) {
  const date = studyDate();
  if (S.today.date !== date) S.today = { date, min: 0 };
  S.today.min += minutes;
  if (!S['study-days'].includes(date)) S['study-days'].push(date);
}

const level = () => Math.floor(S.xp / 250) + 1;
function streakNow() {
  const date = studyDate(), days = new Set(S['study-days']);
  let offset = days.has(date) ? 0 : 1, streak = 0;
  while (days.has(priorStudyDate(date, offset++))) streak++;
  return streak;
}
const hasSkillScore = key => Number.isFinite(S.scores[key]);
const skillScoreText = key => hasSkillScore(key) ? S.scores[key] + '%' : '—';
const avgScore = () => CRIT.every(c => hasSkillScore(c.k)) ? Math.round(CRIT.reduce((sum, c) => sum + S.scores[c.k], 0) / CRIT.length) : null;
const cefr = v => CEFR.find(([min]) => v >= min);
const nextScen = () => scen(JOURNEY.find(id => !S.done.includes(id)) || 'hoian');
const stopState = i => (S.done.includes(JOURNEY[i]) ? 'done' : i <= S.done.length + 1 ? 'open' : 'locked');
const isLocked = id => stopState(JOURNEY.indexOf(id)) === 'locked';
