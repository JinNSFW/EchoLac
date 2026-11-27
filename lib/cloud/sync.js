'use strict';
// Local state is saved first. The queue stays linked to its anonymous account across retries.

const SYNC_TABLES = {
  profiles: ['id', ['display_name', 'birth_year', 'guardian_consent', 'level', 'accent', 'voice_upload_consent_at', 'place_id', 'updated_at']],
  unit_progress: ['user_id,unit_id', ['unit_id', 'status', 'perception_best', 'items_passed', 'updated_at']],
  attempts: ['id', ['id', 'item_id', 'unit_id', 'score', 'reference_score', 'engine', 'categories', 'created_at']],
  error_items: ['user_id,id', ['id', 'item_id', 'category', 'word', 'best', 'attempts', 'days', 'status', 'source', 'updated_at']],
  srs_cards: ['user_id,item_id', ['item_id', 'fsrs_state', 'due', 'updated_at']],
};
const rowKey = row => row.id ?? row.unit_id ?? row.item_id;
const validQueueItem = item => item?.op === 'upsert' && Object.hasOwn(SYNC_TABLES, item.table)
  && item.row && typeof rowKey(item.row) === 'string';

function queued() {
  const q = store.get('sync-queue', []);
  return Array.isArray(q) ? q.filter(validQueueItem) : [];
}

function queueUpsert(table, row) {
  if (!canUseCloud()) return false;
  const owner = cloudOwner();
  const item = { table, row, op: 'upsert', owner };
  if (!validQueueItem(item) || (row.user_id && row.user_id !== owner)) return false;
  const q = queued().filter(i => i.table !== table || rowKey(i.row) !== rowKey(row) || (i.owner && i.owner !== owner));
  store.set('sync-queue', [...q, item]);
  return true;
}

function bindQueuedRows(owner) {
  const q = queued();
  if (!q.length) return;
  if (q.some(i => !i.owner)) store.set('sync-queue', q.map(i => ({ ...i, owner: i.owner || i.row.user_id || owner })));
}

function withCloudSignal(query) {
  const signal = cloudSignal();
  return signal && typeof query.abortSignal === 'function' ? query.abortSignal(signal) : query;
}

function outboundRow(item, uid) {
  const [, fields] = SYNC_TABLES[item.table];
  const row = Object.fromEntries(fields.filter(k => Object.hasOwn(item.row, k)).map(k => [k, item.row[k]]));
  return item.table === 'profiles' ? { ...row, id: uid } : { ...row, user_id: uid };
}

let flushing = null;
async function pushPendingRows() {
  const user = await ensureSession();
  if (!user || cloudUserId() !== user.id) return 0;
  const c = await cloudClient(), uid = user.id;
  if (!c || cloudUserId() !== uid) return 0;
  bindQueuedRows(uid);
  let sent = 0;
  while (cloudUserId() === uid && navigator.onLine !== false) {
    const item = queued().find(candidate => candidate.owner === uid);
    if (!item) break;
    const [onConflict] = SYNC_TABLES[item.table];
    const row = outboundRow(item, uid);
    if (item.table === 'profiles' && voiceConsentRecord()) row.voice_upload_consent_at = currentVoiceConsent();
    const { error } = await withCloudSignal(c.from(item.table).upsert(row, { onConflict }));
    if (cloudUserId() !== uid) break;
    if (error) { console.warn('[EchoLac] sync failed'); break; }
    if (item.table === 'profiles') markProfileSynced(uid, row);
    sent++;
    const remaining = queued(), index = remaining.findIndex(i => JSON.stringify(i) === JSON.stringify(item));
    if (index >= 0) {
      remaining.splice(index, 1);
      store.set('sync-queue', remaining);
      if (queued().some(i => JSON.stringify(i) === JSON.stringify(item))) break;
    }
  }
  return sent;
}

function flushSync() {
  if (!canUseCloud() || navigator.onLine === false || !queued().length) return Promise.resolve(0);
  flushing ||= Promise.resolve().then(() => withCloudLock('echolac-pending-sync', pushPendingRows))
    .catch(() => 0).finally(() => { flushing = null; });
  return flushing;
}

const yearOf = dob => {
  const y = +String(dob || '').slice(0, 4);
  return y >= 1920 && y <= new Date().getFullYear() ? y : null;
};
const syncStamp = (previous) => new Date(Math.max(Date.now(), (Date.parse(previous) || 0) + 1)).toISOString();
const validPlace = id => typeof id === 'string' && Object.hasOwn(THEMES, id);
const cloudAccent = accent => accent === 'en-US' ? 'en-US' : 'en-GB';
const voiceConsentRecord = () => store.get('voice-consent', null);

function currentVoiceConsent() {
  const record = voiceConsentRecord();
  return record ? record.value : S.user?.voiceConsentAt || null;
}

function recordVoiceConsent(value) {
  S.user.voiceConsentAt = value;
  store.set('voice-consent', { value });
}

function profileRow() {
  const u = S.user || {}, place = u.placeId || (S.place !== 'other' ? S.place : null);
  return {
    id: 'me', display_name: u.name ? String(u.name).slice(0, 60) : null, birth_year: yearOf(u.dob) ?? u.birthYear ?? null,
    guardian_consent: !!u.consent?.guardian, accent: cloudAccent(S.settings?.accent),
    voice_upload_consent_at: currentVoiceConsent(), place_id: validPlace(place) ? place : null,
    updated_at: u.updatedAt || syncStamp(),
  };
}

const cloudProfileFields = ['display_name', 'birth_year', 'guardian_consent', 'accent', 'voice_upload_consent_at', 'place_id'];
const sameProfile = (a, b) => cloudProfileFields.every(k => k === 'voice_upload_consent_at'
  ? (Date.parse(a[k]) || 0) === (Date.parse(b[k]) || 0)
  : a[k] === b[k]);

function markProfileSynced(uid, row) {
  store.set('profile-synced', { owner: uid, row });
  if (store.get('profile-dirty', null) === row.updated_at) store.set('profile-dirty', null);
}

function cloudProfileSynced() {
  const uid = cloudUserId(), receipt = store.get('profile-synced', null);
  return !!uid && receipt?.owner === uid && !!receipt.row && !queued().length
    && sameProfile(receipt.row, profileRow());
}

function syncProfile() {
  if (!hasLocalCloudProfile()) return Promise.resolve(0);
  if (voiceConsentRecord()) S.user.voiceConsentAt = currentVoiceConsent();
  S.user.updatedAt = syncStamp(S.user.updatedAt);
  store.set('user', S.user);
  store.set('profile-dirty', S.user.updatedAt);
  if (!canUseCloud()) return Promise.resolve(0);
  queueUpsert('profiles', profileRow());
  return flushSync();
}

function errorRow(e) {
  return {
    id: e.id, item_id: e.itemId || null, category: e.cat || 'other', word: e.word, best: e.best | 0,
    attempts: Math.max(e.attemptCount || 0, Array.isArray(e.attempts) ? e.attempts.length : +e.attempts || 0),
    days: e.days || [], status: e.status === 'mastered' ? 'mastered' : 'open',
    source: SEED_ERRORS.some(seed => seed.id === e.id) ? 'seed' : e.id.startsWith('w-') ? 'roleplay' : 'pron',
    updated_at: e.updatedAt || syncStamp(),
  };
}

function syncError(e) {
  if (!canUseCloud()) return Promise.resolve(0);
  if (unchangedDemoError(e)) return Promise.resolve(0);
  queueUpsert('error_items', errorRow(e));
  return flushSync();
}

const newer = (remote, local) => Number.isFinite(Date.parse(remote)) && Date.parse(remote) > (Date.parse(local) || 0);
const hasPendingProfile = () => queued().some(item => item.table === 'profiles');

function mergeRemoteProfile(row) {
  if (!row || hasPendingProfile() || store.get('profile-dirty', null)) return;
  const u = S.user;
  if (newer(row.updated_at, u.updatedAt)) {
    if (typeof row.display_name === 'string') u.name = row.display_name;
    // A recorded local withdrawal remains in force even if an older consent reaches the cloud.
    const consent = currentVoiceConsent();
    const explicitlyRevoked = (voiceConsentRecord() || u.voiceConsentAt === null) && consent === null;
    if (row.voice_upload_consent_at === null) recordVoiceConsent(null);
    else if (!explicitlyRevoked && Number.isFinite(Date.parse(row.voice_upload_consent_at))) {
      recordVoiceConsent(new Date(row.voice_upload_consent_at).toISOString());
    }
    const year = yearOf(row.birth_year);
    if (!u.dob && year) u.birthYear = year;
    if (row.guardian_consent === true) u.consent.guardian = true;
    u.updatedAt = row.updated_at;
    if (['en-US', 'en-GB'].includes(row.accent) && cloudAccent(S.settings.accent) !== row.accent) S.settings.accent = row.accent;
    if (validPlace(row.place_id)) {
      u.placeId = u.themeId = row.place_id;
      if (S.place !== row.place_id) {
        S.place = row.place_id;
        if (!location.hash.startsWith('#place')) applyTheme(S.place);
      }
    }
    store.set('user', u);
    store.set('settings', S.settings);
    store.set('place', S.place);
  }
  if (sameProfile(row, profileRow())) markProfileSynced(cloudUserId(), row);
}

function mergeRemoteError(row) {
  // IDs and categories are later rendered inside inline event handlers and routes.
  if (typeof row?.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(row.id)
    || typeof row.category !== 'string' || !Object.hasOwn(ERR_CAT, row.category) || typeof row.word !== 'string' || !row.word.trim()
    || !Number.isInteger(row.best) || row.best < 0 || row.best > 100
    || !['open', 'mastered'].includes(row.status)) return false;
  if (row.source === 'seed' && unchangedDemoError({ id: row.id, attemptCount: row.attempts })) return false;
  const local = S.errors.find(e => e.id === row.id);
  if (local && !newer(row.updated_at, local.updatedAt)) return false;
  if (queued().some(item => item.table === 'error_items' && item.row.id === row.id)) return false;
  const fields = {
    best: row.best, attemptCount: Number.isInteger(row.attempts) && row.attempts >= 0 ? row.attempts : 0,
    days: Array.isArray(row.days) ? row.days.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [],
    status: row.status, updatedAt: row.updated_at,
  };
  if (local) Object.assign(local, fields);
  else S.errors = [...S.errors, {
    id: row.id, itemId: row.item_id, word: row.word, cat: row.category, attempts: [], at: 0,
    tip: { vi: 'Nghe mẫu rồi luyện lại.', en: 'Listen to the example and try again.' }, ...fields,
  }];
  return true;
}

let pulledFor = null;
async function pullOnSignIn() {
  if (!canUseCloud() || navigator.onLine === false) return false;
  try {
    const user = await ensureSession();
    if (!user || cloudUserId() !== user.id) return false;
    const c = await cloudClient(), uid = user.id;
    if (!c || cloudUserId() !== uid) return false;
    const [profile, errors] = await Promise.all([
      withCloudSignal(c.from('profiles').select('*').eq('id', uid).maybeSingle()),
      withCloudSignal(c.from('error_items').select('*').eq('user_id', uid)),
    ]);
    if (cloudUserId() !== uid) return false;
    if (profile.error || errors.error) throw new Error('read failed');
    if (!profile.data?.id || profile.data.id === uid) mergeRemoteProfile(profile.data);
    let changed = false;
    for (const row of errors.data || []) {
      if ((!row?.user_id || row.user_id === uid) && mergeRemoteError(row)) changed = true;
    }
    if (changed) store.set('errors', S.errors);
    pulledFor = uid;
    return true;
  } catch { console.warn('[EchoLac] pull failed'); return false; }
}

let reconciling = null;
function reconcileCloudAccount() {
  if (!canUseCloud() || navigator.onLine === false) return Promise.resolve(0);
  reconciling ||= (async () => {
    const user = await ensureSession();
    if (!user || cloudUserId() !== user.id) return 0;
    if (pulledFor !== user.id && !await pullOnSignIn()) return flushSync();
    if (cloudUserId() !== user.id) return 0;
    const receipt = store.get('profile-synced', null);
    const pending = queued().find(item => item.table === 'profiles');
    if (pending ? !sameProfile(pending.row, profileRow()) : receipt?.owner !== user.id || !receipt.row || !sameProfile(receipt.row, profileRow())) {
      return syncProfile();
    }
    return flushSync();
  })().catch(() => 0).finally(() => { reconciling = null; });
  return reconciling;
}
