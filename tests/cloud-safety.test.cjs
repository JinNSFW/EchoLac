const test = require('node:test');
const assert = require('node:assert/strict');
const { app, ON, J } = require('./helpers/cloud.cjs');

test('losing the account owner in another tab blocks writes before its storage event arrives', async () => {
  const a = app(ON);
  await a.run('ensureSession()');
  a.run("queueUpsert('profiles', profileRow()); store.set('cloud-owner', null); window.__session = null");
  assert.equal(await a.run('ensureSession()'), null);
  assert.equal(await a.run('flushSync()'), 0);
  assert.equal(a.run('window.__signIns'), 1, 'do not enroll old data into a new account');
  assert.deepEqual(J(a, 'window.__rows'), []);
});

test('a stale profile cannot grant voice consent after withdrawal in another tab', async () => {
  const a = app(ON);
  a.run(`S.user.voiceConsentAt = '2026-11-01T00:00:00Z';
    store.set('voice-consent', { value: null });`);
  await a.run('syncProfileChange()');
  assert.equal(a.run('window.__rows[0].voice_upload_consent_at'), null);
  assert.equal(a.run('S.user.voiceConsentAt'), null);
});

test('a storage quota failure cannot make a successful upsert loop indefinitely', async () => {
  const a = app(ON);
  await a.run('ensureSession()');
  a.run(`queueUpsert('profiles', profileRow());
    localStorage.setItem = () => { throw new Error('quota'); };`);
  assert.equal(await a.run('flushSync()'), 1);
  assert.equal(a.run('window.__rows.length'), 1);
  assert.equal(J(a, "store.get('sync-queue')").length, 1, 'retain unsaved acknowledgement for retry');
});

test('online recovery loads only same-origin public config and sends offline profile changes', async () => {
  const a = app(null);
  a.run(`navigator.onLine = false; S.user.placeId = 'hue'; S.place = 'hue';
    document.head.append = script => {
      if (script.src !== 'config.js') throw new Error('unexpected destination');
      window.__loadedConfig = script.src;
      window.ECHOLAC_CONFIG = ${JSON.stringify(ON)};
      script.onload();
    };`);
  await a.run('syncProfileChange()');
  assert.ok(a.run("store.get('profile-dirty')"));
  assert.equal(a.run('window.__sessionReads'), 0);
  a.run(`window.__remote.profiles = { ...profileRow(), place_id: 'danang', updated_at: '2026-11-30T00:00:00Z' };
    navigator.onLine = true;`);
  await a.run('refreshAccount()');
  assert.equal(a.run('window.__loadedConfig'), 'config.js');
  assert.equal(a.run('S.place'), 'hue', 'remote state cannot overwrite unsent local changes');
  assert.equal(a.run('window.__rows.at(-1).place_id'), 'hue');
  assert.equal(a.run("store.get('profile-dirty')"), null);
});

test('remote error data cannot inject route handlers or allocate an arbitrary attempt history', async () => {
  const a = app(ON);
  a.run(`S.errors = []; window.__remote.error_items = [
    { id: "x');alert(1);//", category: 'final_consonant', word: 'one', best: 50, status: 'open' },
    { id: 'valid-item', category: 'final_consonant', word: 'one', best: 50, status: 'open', attempts: 2000000000 }
  ];`);
  assert.equal(await a.run('pullOnSignIn()'), true);
  assert.deepEqual(J(a, 'S.errors.map(e => e.id)'), ['valid-item']);
  assert.equal(a.run('S.errors[0].attempts.length'), 0);
});
