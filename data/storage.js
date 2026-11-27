'use strict';
// Browser persistence. Learning data is readable only for the active local sign-in.

const rawStore = {
  get(k, d) { try { const v = localStorage.getItem('lt:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('lt:' + k, JSON.stringify(v)); } catch { /* private mode: state lives in memory only */ } },
  remove(k) { try { localStorage.removeItem('lt:' + k); } catch { /* storage unavailable */ } },
};

const learningKeys = ['errors', 'scores', 'xp', 'sessions', 'minutes', 'done', 'today', 'cam', 'study-days',
  'directions-practice', 'practice:da-nang', 'sync-queue'];
const learningKey = (owner, key) => 'learning:' + owner + ':' + key;
let learningId = null, learningOwner = null;

function learningSessionCurrent() {
  return !!learningId && rawStore.get('user', null)?.learningId === learningId
    && (rawStore.get('cloud-owner', null) || learningId) === learningOwner;
}

const store = {
  get(key, fallback) {
    if (!learningKeys.includes(key)) return rawStore.get(key, fallback);
    return learningSessionCurrent() ? rawStore.get(learningKey(learningOwner, key), fallback) : fallback;
  },
  set(key, value) {
    if (!learningKeys.includes(key)) rawStore.set(key, value);
    else if (learningSessionCurrent()) rawStore.set(learningKey(learningOwner, key), value);
  },
};

function openLearningSession(user, owner = null) {
  user.learningId ||= 'local-' + (globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random().toString(36).slice(2));
  learningId = user.learningId;
  learningOwner = owner || learningId;
  rawStore.set('user', user);
}

function bindLearningOwner(owner) {
  if (!learningId || learningOwner !== learningId || rawStore.get('user', null)?.learningId !== learningId) return;
  for (const key of learningKeys) {
    const from = learningKey(learningId, key), to = learningKey(owner, key);
    const value = rawStore.get(from, undefined);
    if (value === undefined) continue;
    if (rawStore.get(to, undefined) === undefined) rawStore.set(to, value);
    if (rawStore.get(to, undefined) !== undefined) rawStore.remove(from);
  }
  learningOwner = owner;
}

function clearLearningProgress(includeQueue = false) {
  if (!learningSessionCurrent()) return;
  for (const key of learningKeys) {
    if (includeQueue || key !== 'sync-queue') rawStore.remove(learningKey(learningOwner, key));
  }
}
