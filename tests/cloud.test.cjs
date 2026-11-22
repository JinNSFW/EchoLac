const test = require('node:test');
const assert = require('node:assert/strict');
const { app, ON, J, pausedWrite, pausedSignIn } = require('./helpers/cloud.cjs');

test('disabled without config: no queue, no network', async () => {
  const a = app(null);
  assert.equal(a.run('CLOUD.enabled'), false);
  a.run("queueUpsert('profiles', { id: 'me' })");
  assert.deepEqual(J(a, "store.get('sync-queue', [])"), []);
  assert.equal(await a.run('flushSync()'), 0);
  assert.equal(await a.run('ensureSession()'), null);
  assert.equal(await a.run('pullOnSignIn()'), false);
  assert.equal(a.run('window.__sessionReads'), 0);
});

test('queue keeps order, coalesces by key, flushes and empties', async () => {
  const a = app(ON);
  a.run("queueUpsert('error_items', { id: 'a', best: 1 }); queueUpsert('error_items', { id: 'b' }); queueUpsert('error_items', { id: 'a', best: 9 })");
  assert.deepEqual(J(a, "store.get('sync-queue').map(i => i.row.id)"), ['b', 'a']);
  assert.equal(await a.run('flushSync()'), 2);
  assert.deepEqual(J(a, 'window.__log'), [['error_items', 'b', 'u1', 'user_id,id'], ['error_items', 'a', 'u1', 'user_id,id']]);
  assert.equal(a.run('window.__rows[1].best'), 9);
  assert.deepEqual(J(a, "store.get('sync-queue', [])"), []);
  assert.equal(a.run('cloudUserId()'), 'u1');
});

test('failure keeps the item and later ones; retry succeeds', async () => {
  const a = app(ON);
  a.run("window.__fail = 1; queueUpsert('error_items', { id: 'a' }); queueUpsert('error_items', { id: 'b' })");
  assert.equal(await a.run('flushSync()'), 0);
  assert.equal(J(a, "store.get('sync-queue')").length, 2);
  assert.equal(await a.run('flushSync()'), 2);
  assert.deepEqual(J(a, "window.__log.map(l => l[1])"), ['a', 'a', 'b']);
});

test('profile and error rows map from S', async () => {
  const a = app(ON);
  a.run("Object.assign(S.user, { dob: '2001-05-06', gender: 'female' }); S.settings.accent = 'en-US'; S.place = 'danang'");
  await a.run('syncProfile()');
  const row = J(a, 'window.__log[0]');
  assert.deepEqual(row, ['profiles', 'u1', null, 'id']);
  const r = J(a, "window.__rows[0]");
  assert.equal(r.display_name, 'Lan'); assert.equal(r.birth_year, 2001); assert.equal(r.accent, 'en-US'); assert.equal(r.place_id, 'danang');
  assert.equal(Object.hasOwn(r, 'dob'), false);
  assert.equal(Object.hasOwn(r, 'gender'), false);
  assert.doesNotMatch(JSON.stringify(r), /2001-05-06/);
  assert.equal(J(a, "errorRow(S.errors[0])").source, 'seed');
  assert.equal(J(a, "errorRow({ id: 'x1', word: 'w', cat: 'c', best: 5, attempts: [1, 2], status: 'open' })").source, 'pron');
});

test('pull: newer remote wins, older remote keeps local, unknown remote is added', async () => {
  const a = app(ON);
  a.run(`S.errors = [{ id: 'e1', word: 'one', best: 50, attempts: [50], days: [], status: 'open', updatedAt: '2026-11-10T00:00:00Z' },
    { id: 'e2', word: 'two', best: 60, attempts: [60], days: [], status: 'open', updatedAt: '2026-11-10T00:00:00Z' }];
    Object.assign(S.user, { name: 'Local', updatedAt: '2026-11-10T00:00:00Z' });
    window.__remote.profiles = { display_name: 'Remote', accent: 'en-US', place_id: null, voice_upload_consent_at: null, updated_at: '2026-11-11T00:00:00Z' };
    window.__remote.error_items = [
      { id: 'e1', word: 'one', category: 'final_consonant', best: 80, attempts: 3, days: [], status: 'mastered', updated_at: '2026-11-11T00:00:00Z' },
      { id: 'e2', word: 'two', category: 'final_consonant', best: 10, attempts: 1, days: [], status: 'open', updated_at: '2026-11-01T00:00:00Z' },
      { id: 'e3', word: 'three', category: 'final_consonant', best: 70, attempts: 2, days: [], status: 'open', updated_at: '2026-11-11T00:00:00Z' }]`);
  assert.equal(await a.run('pullOnSignIn()'), true);
  assert.deepEqual(J(a, 'S.errors.map(e => [e.id, e.best, e.status])'), [['e1', 80, 'mastered'], ['e2', 60, 'open'], ['e3', 70, 'open']]);
  assert.equal(a.run('S.user.name'), 'Remote');
  assert.equal(a.run('S.settings.accent'), 'en-US');
  assert.deepEqual(J(a, 'window.__queries'), [
    ['profiles', '*', 'id', 'u1'],
    ['error_items', '*', 'user_id', 'u1'],
  ]);
});

test('cloud accepts neither a demo session nor a profile without terms', async () => {
  const a = app(ON);
  a.run("location.search = '?demo'");
  assert.equal(await a.run('ensureSession()'), null);
  await a.run('syncProfile()');
  a.run("location.search = ''; S.user.consent.terms = false");
  assert.equal(await a.run('ensureSession()'), null);
  await a.run('syncProfile()');
  assert.equal(a.run('window.__signIns'), 0);
  assert.equal(a.run('window.__sessionReads'), 0);
  assert.deepEqual(J(a, 'window.__log'), []);
  assert.deepEqual(J(a, "store.get('sync-queue', [])"), []);
});

test('concurrent session requests share one anonymous sign-in', async () => {
  const a = app(ON);
  const started = pausedSignIn(a);
  const requests = [a.run('ensureSession()'), a.run('ensureSession()'), a.run('ensureSession()')];
  await started;
  a.run('window.__finishAuth()');
  assert.deepEqual((await Promise.all(requests)).map(user => user?.id), ['u1', 'u1', 'u1']);
  assert.equal(a.run('window.__signIns'), 1);
});

test('a session alone cannot confirm profile sync', async () => {
  const a = app(ON);
  await a.run('ensureSession()');
  assert.match(a.run('accountCard()'), /Changes not synced yet/);
  await a.run('pullOnSignIn()');
  assert.match(a.run('accountCard()'), /Changes not synced yet/);
  a.run('window.__fail = 1');
  await a.run('syncProfile()');
  assert.match(a.run('accountCard()'), /Changes not synced yet/);
  await a.run('flushSync()');
  assert.match(a.run('accountCard()'), /\bSynced\b/);
});

test('pulling a matching cloud profile confirms sync without an additional upsert', async () => {
  const a = app(ON);
  await a.run('ensureSession()');
  a.run("window.__remote.profiles = { ...profileRow(), id: 'u1' }");
  assert.equal(await a.run('pullOnSignIn()'), true);
  assert.match(a.run('accountCard()'), /\bSynced\b/);
  assert.deepEqual(J(a, 'window.__log'), []);
});

test('refreshing the account reconciles a local profile and repaints its status', async () => {
  const a = app(ON);
  a.run("S.user.name = 'Lan Anh'; window.__fail = 1");
  await a.run('refreshAccount()');
  const status = a.document.querySelector('#acct-status');
  assert.match(status.innerHTML, /Changes not synced yet/);
  assert.equal(J(a, "store.get('sync-queue')")[0].row.display_name, 'Lan Anh');
  await a.run('refreshAccount()');
  assert.match(status.innerHTML, /\bSynced\b/);
  assert.deepEqual(J(a, 'window.__rows.map(row => row.display_name)'), ['Lan Anh', 'Lan Anh']);
});

test('the newest voice consent survives an in-flight write and an offline retry', async () => {
  const a = app(ON);
  a.run('route = () => {}; navigator.onLine = false');
  a.run('setVoiceConsent(true)');
  const granted = a.run("store.get('user').voiceConsentAt");
  assert.ok(granted);
  assert.equal(await a.run('flushSync()'), 0);
  assert.deepEqual(J(a, 'window.__log'), []);
  assert.equal(a.run('window.__signIns'), 0);

  const started = pausedWrite(a);
  a.run('navigator.onLine = true');
  const first = a.run('flushSync()');
  await started;
  a.run('setVoiceConsent(false)');
  assert.equal(a.run("store.get('user').voiceConsentAt"), null);
  a.run('window.__finishWrite()');
  await first;
  await a.run('flushSync()');
  assert.deepEqual(J(a, 'window.__rows.map(row => row.voice_upload_consent_at)'), [granted, null]);
  assert.deepEqual(J(a, "store.get('sync-queue', [])"), []);
  assert.match(a.run('accountCard()'), /\bSynced\b/);
});

test('a restored session for a different account cannot upload the retained queue', async () => {
  const a = app(ON, {
    'cloud-owner': 'old-user',
    'sync-queue': [{ table: 'error_items', row: { id: 'old-item' }, op: 'upsert', owner: 'old-user' }],
  });
  const queue = J(a, "store.get('sync-queue')");
  a.run("window.__session = { user: { id: 'new-user' } }");
  assert.equal(await a.run('flushSync()'), 0);
  assert.deepEqual(J(a, 'window.__log'), []);
  assert.deepEqual(J(a, "store.get('sync-queue')"), queue);
  assert.equal(a.run("store.get('cloud-owner')"), 'old-user');
  assert.match(a.run('accountCard()'), /Saved on this device only/);
});

test('a saved legacy account can recover its existing anonymous session', async () => {
  const a = app(ON, {
    user: { name: 'Lan', consent: { terms: true } },
    'sync-queue': [{ table: 'error_items', row: { id: 'old-item' }, op: 'upsert' }],
  });
  a.run("window.__session = { user: { id: 'existing-user', is_anonymous: true } }");
  assert.equal(await a.run('flushSync()'), 1);
  assert.equal(a.run('window.__signIns'), 0);
  assert.equal(a.run("store.get('cloud-owner')"), 'existing-user');
  assert.deepEqual(J(a, 'window.__log'), [['error_items', 'old-item', 'existing-user', 'user_id,id']]);
});

test('sign-out invalidates an anonymous sign-in that has not completed', async () => {
  const a = app(ON);
  const started = pausedSignIn(a);
  const signingIn = a.run('ensureSession()');
  await started;
  const closing = a.run('cloudSignOut()');
  a.run('window.__finishAuth()');
  await closing;
  assert.equal(await signingIn, null);
  assert.equal(a.run("store.get('cloud-owner', null)"), null);
  assert.equal(a.run('cloudUserId()'), null);
});

test('an upsert completing after sign-out cannot acknowledge or send later rows', async () => {
  const a = app(ON);
  a.run(`
    const saved = {};
    Object.defineProperties(saved, {
      getItem: { value: key => saved[key] ?? null },
      setItem: { value: (key, value) => { saved[key] = String(value); } },
      removeItem: { value: key => { delete saved[key]; } },
    });
    localStorage = saved;
    confirm = () => true;
    location.replace = hash => { location.hash = hash; };
    store.set('lang', 'en');
    store.set('user', S.user);
  `);
  await a.run('ensureSession()');
  const started = pausedWrite(a);
  const flushing = a.run("queueUpsert('profiles', profileRow()); queueUpsert('error_items', { id: 'old-item' }); flushSync()");
  await started;
  await a.run('signOut()');
  assert.equal(a.run('location.hash'), '#signup');
  a.run('window.__finishWrite()');
  await flushing;
  assert.deepEqual(J(a, 'window.__log.map(([table]) => table)'), ['profiles']);
  assert.deepEqual(J(a, 'Object.keys(localStorage)'), ['lt:lang']);
  assert.equal(a.run('cloudUserId()'), null);
  assert.match(a.run('acctStatus()'), /Saved on this device only/);
});
