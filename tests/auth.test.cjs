const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime } = require('./helpers/runtime.cjs');

// The runtime's localStorage has no removeItem/enumeration; swap in an enumerable-by-key one.
function app(seed) {
  const a = runtime(undefined, seed);
  a.run(`(() => { const s = {}; for (const [k, v] of Object.entries(${JSON.stringify(Object.fromEntries([...a.storage]))})) s[k] = v;
    for (const [n, f] of Object.entries({ getItem: k => s[k] ?? null, setItem: (k, v) => { s[k] = String(v); }, removeItem: k => { delete s[k]; } }))
      Object.defineProperty(s, n, { value: f, enumerable: false });
    localStorage = s; })()`);
  return a;
}
const keys = a => JSON.parse(a.run('JSON.stringify(Object.keys(localStorage).sort())'));
const USER = { name: 'Lan', consent: { terms: true } };

function signup(a) {
  a.run('S.user = null; navigator.onLine = false; VIEWS.signup.mount()');
  const get = id => a.document.querySelector('#' + id);
  return {
    change(id, value) {
      const input = get(id);
      const checkbox = typeof value === 'boolean';
      input[checkbox ? 'checked' : 'value'] = value;
      get('f').dispatchEvent({ type: checkbox ? 'change' : 'input' });
    },
    submit: () => get('f').dispatchEvent({ type: 'submit' }),
    blocked: () => get('submit').disabled,
    guardianHidden: () => get('guardian-box').hidden,
  };
}

test('signup needs no email/password/Google/class-code and says progress stays here until an email is added', () => {
  for (const lang of ['vi', 'en']) {
    const a = app({ user: null });
    const html = a.run(`S.lang='${lang}'; VIEWS.signup.render()`);
    assert.doesNotMatch(html, /id="email"|id="otp-email"|id="pw"|googleSignIn|class-?code/i);
    assert.match(html, lang === 'vi' ? /cho đến khi bạn gắn email trong Hồ sơ/ : /until you add an email in Profile/);
    assert.match(html, /href="#signin"/);
  }
});

test('signup validates name, birth date and terms before saving an adult offline', () => {
  const a = app({ user: null });
  const form = signup(a);
  assert.equal(form.blocked(), true);
  form.change('name', ' L ');
  form.change('dob', '2008-11-12');
  form.change('terms', true);
  assert.equal(form.blocked(), true);
  form.change('name', ' Lan ');
  for (const dob of ['2010-02-30', '2021-01-01', '1925-01-01', '2027-01-01']) {
    form.change('dob', dob);
    assert.equal(form.blocked(), true, dob);
  }
  form.change('dob', '2008-11-12');
  form.change('terms', false);
  assert.equal(form.blocked(), true);
  form.submit();
  assert.equal(a.run("store.get('user', null)"), null);
  form.change('terms', true);
  assert.equal(form.guardianHidden(), true);
  assert.equal(form.blocked(), false);
  form.submit();
  const user = JSON.parse(a.run("JSON.stringify(store.get('user'))"));
  assert.equal(user.name, 'Lan');
  assert.equal(user.dob, '2008-11-12');
  assert.deepEqual(user.consent, { terms: true, guardian: false });
  assert.equal(a.run('location.hash'), '#place');
});

test('signup requires guardian consent until the eighteenth birthday', () => {
  const a = app({ user: null });
  const form = signup(a);
  form.change('name', 'Lan');
  form.change('dob', '2008-11-13');
  form.change('terms', true);
  assert.equal(form.guardianHidden(), false);
  assert.equal(form.blocked(), true);
  form.submit();
  assert.equal(a.run("store.get('user', null)"), null);
  assert.equal(a.run('location.hash'), '');
  form.change('guardian', true);
  assert.equal(form.blocked(), false);
  form.submit();
  assert.equal(a.run("store.get('user').consent.guardian"), true);
  assert.equal(a.run('location.hash'), '#place');
});

test('signin offers email sign-in without a user; renders escaped name with one', () => {
  const a = app({});
  const signedOut = a.run("S.user = null; S.lang = 'en'; VIEWS.signin.render()");
  assert.match(signedOut, /id="otp-email"[^>]*autocomplete="email"/);
  assert.match(signedOut, /Sign in with email/);
  a.run("S.user = { name: '<b>x</b>', consent: { terms: true } }");
  const html = a.run('VIEWS.signin.render()');
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;') && !html.includes('<b>x</b>'));
});

test('setVoiceConsent stores an ISO string, then null', () => {
  const a = app({});
  a.run("S.user.name = 'Lan'; route = () => {}; show = () => {}");
  a.run('setVoiceConsent(true)');
  const granted = a.run('S.user.voiceConsentAt');
  assert.match(granted, /^\d{4}-\d\d-\d\dT[\d:.]+Z$/);
  assert.equal(a.run("store.get('user').voiceConsentAt"), granted);
  a.run('setVoiceConsent(false)');
  assert.equal(a.run('S.user.voiceConsentAt'), null);
  assert.equal(a.run("store.get('user').voiceConsentAt"), null);
});

test('signOut: cancel changes nothing; confirm wipes lt: keys except lt:lang', async () => {
  const a = app({ user: USER, lang: 'en', progress: { x: 1 }, 'sync-queue': [], 'sb-auth': { t: 1 } });
  a.run('globalThis.calls = []; location.replace = h => calls.push("r" + h); location.reload = () => calls.push("reload"); cloudSignOut = async () => { calls.push("cloud"); };');
  const before = keys(a);
  a.run('confirm = () => false');
  await a.run('signOut()');
  assert.deepEqual(keys(a), before);
  assert.equal(a.run('calls.length'), 0);
  a.run('confirm = () => true');
  await a.run('signOut()');
  assert.deepEqual(keys(a), ['lt:lang']);
  assert.equal(a.run('S.user'), null);
  assert.deepEqual(JSON.parse(a.run('JSON.stringify(calls)')), ['cloud', 'r#signup', 'reload']);
});

test('resetDemo keeps the anonymous identity, profile receipt and pending queue', () => {
  const a = app({
    user: USER, lang: 'vi', 'sync-queue': [], 'sb-auth': {}, 'cloud-owner': 'u1',
    'profile-synced': { owner: 'u1', row: { display_name: 'Lan' } }, progress: {}, streak: 3,
  });
  a.run('globalThis.n = 0; location.reload = () => { n++; }');
  a.run('resetDemo()');
  assert.ok(keys(a).includes('lt:learning:u1:sync-queue'));
  assert.ok(keys(a).includes('lt:cloud-owner'));
  assert.ok(keys(a).includes('lt:profile-synced'));
  assert.equal(a.run("store.get('xp', 0)"), 0);
  assert.equal(a.run('n'), 1);
});

test('accountCard says saved on this device only when cloud is off', () => {
  const a = app({ user: USER });
  a.run("Object.assign(S.user, " + JSON.stringify(USER) + ")");
  assert.match(a.run("S.lang='en'; accountCard()"), /Saved on this device only/);
  assert.match(a.run("S.lang='vi'; accountCard()"), /Chỉ lưu trên máy này/);
});

test('birth date is typed as dd/mm/yyyy and stored as ISO', () => {
  const app = runtime();
  assert.equal(app.run("dobIso('12/11/2008')"), '2008-11-12');
  assert.equal(app.run("dobShow('2008-11-12')"), '12/11/2008');
  assert.ok(app.run("signupAge('12/11/2008')") >= 17);
  assert.equal(app.run("signupAge('30/02/2010')"), -1);
  assert.equal(app.run("signupAge('12/11/08')"), -1);
  assert.equal(app.run("(() => { const el = { value: '1211a2008' }; maskDob(el); return el.value; })()"), '12/11/2008');
});
