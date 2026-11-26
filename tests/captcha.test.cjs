const test = require('node:test');
const assert = require('node:assert/strict');
const { cloudConfig } = require('../scripts/env.cjs');
const { headers } = require('../scripts/site.cjs');
const { app, ON, J } = require('./helpers/cloud.cjs');

// Cloudflare's published dummy keys (always pass); not real credentials.
const SITE_KEY = '1x00000000000000000000AA', SECRET_KEY = '1x0000000000000000000000000000000AA';
const SUPABASE = { SUPABASE_URL: 'https://a.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_t' };

test('config passes the Turnstile site key and rejects anything that looks secret', () => {
  assert.equal(cloudConfig({ ...SUPABASE, TURNSTILE_SITE_KEY: SITE_KEY }).turnstileSiteKey, SITE_KEY);
  assert.equal(Object.hasOwn(cloudConfig(SUPABASE), 'turnstileSiteKey'), false);
  for (const bad of [SECRET_KEY, 'sb_secret_x', 'my_service_role_key', 'not a key']) {
    let error;
    try { cloudConfig({ ...SUPABASE, TURNSTILE_SITE_KEY: bad }); } catch (caught) { error = caught; }
    assert.match(error?.message || '', /TURNSTILE_SITE_KEY must be the Turnstile site key/, bad);
    assert.ok(!error.message.includes(bad), 'the error never echoes the value');
  }
  assert.throws(() => cloudConfig({ TURNSTILE_SITE_KEY: SECRET_KEY }), /site key/, 'a secret fails even with cloud off');
});

test('CSP allows challenges.cloudflare.com only when a site key is set', () => {
  const on = headers({ supabaseUrl: 'https://a.supabase.co', turnstileSiteKey: SITE_KEY })['Content-Security-Policy'];
  assert.match(on.split('; ').find(s => s.startsWith('script-src ')), / https:\/\/challenges\.cloudflare\.com$/);
  assert.ok(on.split('; ').includes('frame-src https://challenges.cloudflare.com'));
  const off = headers({ supabaseUrl: 'https://a.supabase.co' })['Content-Security-Policy'];
  assert.doesNotMatch(off, /challenges\.cloudflare\.com|frame-src/);
});

// A fake Turnstile: answer chooses what the widget does once rendered.
function withTurnstile(cfg, answer) {
  const a = app(cfg);
  a.run(`window.__appended = []; window.__removed = [];
    const signIn = window.__supabaseForTest.auth.signInAnonymously;
    window.__supabaseForTest.auth.signInAnonymously = args => { window.__signInArgs = args; return signIn(); };
    const fake = { render(box, opts) { window.__opts = opts; (${answer})(opts); return 'w1'; }, remove: id => window.__removed.push(id) };
    document.head.append = s => { window.__appended.push(s.src); window.turnstile = fake; s.onload(); };
    document.body.append = box => window.__appended.push(box.className);`);
  return a;
}

test('anonymous sign-in waits for the Turnstile token and passes it to Supabase', async () => {
  const a = withTurnstile({ ...ON, turnstileSiteKey: SITE_KEY }, "o => o.callback('XXXX.DUMMY.TOKEN.XXXX')");
  assert.equal((await a.run('ensureSession()'))?.id, 'u1');
  assert.equal(a.run('window.__signInArgs.options.captchaToken'), 'XXXX.DUMMY.TOKEN.XXXX');
  assert.equal(a.run('window.__opts.sitekey'), SITE_KEY);
  assert.deepEqual(J(a, 'window.__appended'), ['https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', 'captcha-box']);
  assert.deepEqual(J(a, 'window.__removed'), ['w1'], 'the widget is removed after use');
});

test('without a site key nothing loads and sign-in is unchanged', async () => {
  const a = withTurnstile(ON, "() => { throw new Error('rendered'); }");
  assert.equal((await a.run('ensureSession()'))?.id, 'u1');
  assert.equal(a.run('window.__signInArgs.options.captchaToken'), undefined);
  assert.deepEqual(J(a, 'window.__appended'), []);
});

test('a failed or expired check creates no account and leaves the app local-only', async () => {
  for (const callback of ['error-callback', 'expired-callback', 'timeout-callback']) {
    const a = withTurnstile({ ...ON, turnstileSiteKey: SITE_KEY }, `o => o['${callback}']()`);
    assert.equal(await a.run('ensureSession()'), null, callback);
    assert.equal(a.run('window.__signIns'), 0);
    assert.equal(a.run("store.get('cloud-owner', null)"), null);
    assert.deepEqual(J(a, 'window.__removed'), ['w1']);
    assert.match(a.run('accountCard()'), /Saved on this device only/);
  }
});

test('signing out while the check is open sends no sign-in', async () => {
  const a = withTurnstile({ ...ON, turnstileSiteKey: SITE_KEY }, 'o => { window.__pass = o.callback; }');
  const signingIn = a.run('ensureSession()');
  await new Promise(resolve => setImmediate(resolve));
  await a.run('cloudSignOut()');
  a.run("window.__pass('XXXX.DUMMY.TOKEN.XXXX')");
  assert.equal(await signingIn, null);
  assert.equal(a.run('window.__signIns'), 0);
});
