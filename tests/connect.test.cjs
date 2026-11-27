const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime } = require('./helpers/runtime.cjs');
const { app: cloudApp, ON } = require('./helpers/cloud.cjs');

// Values cross the vm realm as JSON so deepEqual compares plain data.
const json = (app, src) => JSON.parse(app.run(`JSON.stringify(${src})`));

/* ---- Account status hint (the connection rule itself runs on the server: connect-server.test.cjs) ---- */
test('account eligibility fails closed and never shows a student below A2 as eligible', () => {
  const app = runtime(), status = u => app.run(`accountEligibility(${JSON.stringify(u)}).status`);
  const adult = { role: 'student', ageGroup: 'adult', verified: true, level: 'B1' };
  assert.equal(status(adult), 'eligible');
  assert.equal(status({ ...adult, level: 'A1' }), 'not-eligible');
  assert.equal(status({ ...adult, level: undefined }), 'not-eligible');
  assert.equal(status({ ...adult, verified: 'true' }), 'not-eligible');
  assert.equal(status({ ...adult, ageGroup: undefined }), 'not-eligible');
  assert.equal(status({ ...adult, ageGroup: 'minor' }), 'awaiting-approval'); // adults-only pilot: no approval path for minors
  assert.equal(status({ role: 'tourist', ageGroup: 'minor', verified: true }), 'not-eligible');
  assert.equal(app.run('accountEligibility(null).status'), 'not-eligible');
  assert.equal(app.run('[typeof canConnect, typeof matchStudents, typeof MOCK_STUDENTS].join()'), 'undefined,undefined,undefined');
  assert.deepEqual(json(app, 'LOCS.map(l => l.id).filter(id => !LOCATION_TAGS[id])'), []);
});

/* ---- Server-backed state with a mocked supabase client ---- */
const FAKE = `window.__calls = []; window.__rpc = {}; window.__fn = () => ({ data: { ok: true, reasons: [] }, error: null });
const query = t => { const where = []; let one = false, write = false; const b = {
  select() { return b; }, order() { return b; }, eq(k, v) { where.push([k, v]); return b; }, is(k, v) { where.push([k, v]); return b; },
  maybeSingle() { one = true; return b; },
  insert(row) { write = true; window.__calls.push(['insert', t, row]); return b; },
  update(row) { write = true; window.__calls.push(['update', t, row]); return b; },
  delete() { write = true; window.__calls.push(['delete', t]); return b; },
  then(ok, bad) {
    const rows = (window.__db[t] || []).filter(r => where.every(([k, v]) => r[k] === v));
    return Promise.resolve(write ? { data: null, error: window.__writeError || null } : { data: one ? (rows[0] ? { ...rows[0] } : null) : rows.map(r => ({ ...r })), error: null }).then(ok, bad);
  } }; return b; };
window.__supabaseForTest = {
  auth: { getSession: async () => ({ data: { session: window.__session || null } }),
    signInAnonymously: async () => { window.__session = { user: { id: 'u1' } }; return { data: window.__session, error: null }; },
    signOut: async () => ({ error: null }) },
  from: query,
  rpc: async (name, args) => { window.__calls.push(['rpc', name, args]); return window.__rpc[name] ? window.__rpc[name](args) : { data: [], error: null }; },
  functions: { invoke: async (name, opts) => { window.__calls.push(['fn', name, opts.body]); return window.__fn(name, opts.body); } },
};`;
const ME = { id: 'u1', display_name: 'Lan', level: 'B1', role: 'student', age_group: null, verification_status: 'unverified' };
const LOC_ROWS = [{ id: 'han-market', name_vi: 'Chợ Hàn', name_en: 'Han Market', approved: true }, { id: 'hoi-an-ancient-town', name_vi: 'Phố cổ Hội An', name_en: 'Hoi An Ancient Town', approved: true }];
async function server(db) {
  const a = cloudApp(ON);
  a.run(FAKE);
  a.run(`rerender = () => {}; toast = m => { window.__toast = m; }; window.__db = ${JSON.stringify({ locations: LOC_ROWS, ...db })};`);
  await a.run('loadConnect()');
  return a;
}
const calls = (a, kind) => json(a, `window.__calls.filter(c => c[0] === '${kind}')`);

test('signed out or offline: Connect explains it needs an account and a network, with no local data', async () => {
  const out = runtime(undefined, { user: null });
  await out.run('loadConnect()');
  assert.equal(out.run('S.connect.status'), 'signed-out');
  const local = runtime();
  await local.run('loadConnect()');
  assert.equal(local.run('S.connect.status'), 'signed-out'); // cloud off: never fake data
  local.run("S.lang = 'en'");
  for (const v of ['connect', 'discover', 'connections']) assert.match(local.run(`VIEWS.${v}.render()`), /needs a synced EchoLạc account/);
  assert.equal(local.storage.has('lt:connect'), false);
  const a = cloudApp(ON);
  a.run(FAKE); a.run('navigator.onLine = false');
  await a.run('loadConnect()');
  assert.equal(a.run('S.connect.status'), 'offline');
});

test('student actions call the server', async () => {
  const a = await server({ profiles: [ME], connection_requests: [{ id: 'r1', tourist_id: 't9', student_id: 'u1', location_id: 'han-market', mode: 'one-to-one', status: 'pending', created_at: '2026-11-26' }] });
  a.run("S.lang = 'en'");
  assert.equal(a.run('S.connect.status + connectRole()'), 'readystudent');
  const html = a.run('VIEWS.connect.render()');
  assert.match(html, /Not yet eligible/);
  assert.match(html, /Wait for an EchoLạc admin to verify/);
  assert.doesNotMatch(html, /school|invite code|teacher/i);
  assert.equal((await a.run("toggleAvailability('han-market', 'sat-am')")).ok, true);
  assert.equal((await a.run("toggleAvailability('not-approved', 'sat-am')")).why, 'denied');
  assert.deepEqual(calls(a, 'insert'), [['insert', 'availability', { location_id: 'han-market', slot: 'sat-am' }]]);
  assert.equal((await a.run("respondConnect('r1', 'accepted')")).ok, true);
  a.run("window.__fn = () => ({ data: { ok: false, reasons: ['student-not-eligible'] }, error: null })");
  assert.deepEqual(JSON.parse(JSON.stringify((await a.run("respondConnect('r1', 'accepted')")).reasons)), ['student-not-eligible']);
  assert.deepEqual(calls(a, 'fn')[0], ['fn', 'connect-respond', { request_id: 'r1', decision: 'accepted' }]);
  // supabase-js returns data: null and FunctionsHttpError on a 4xx; the reasons are in error.context.
  a.run("window.__fn = () => ({ data: null, error: { context: { json: async () => ({ ok: false, reasons: ['not-pending'] }) } } })");
  assert.deepEqual(JSON.parse(JSON.stringify((await a.run("respondConnect('r1', 'cancelled')")).reasons)), ['not-pending']);
  assert.match(a.run("cLabel(REASON_TEXT, 'not-pending')"), /no longer open/);
  a.run("window.__db.connection_requests[0].status = 'accepted'");
  await a.run('loadConnect(true)');
  assert.match(a.run('VIEWS.connect.render()'), /answerConnect\(this,'cancelled'\)">Cancel connection/);
  assert.equal((await a.run("chooseRole('tourist')")).ok, true);
  assert.deepEqual(calls(a, 'update'), [['update', 'profiles', { role: 'tourist' }]]);
});

test('the last server role picks the tabs while offline, without granting anything', async () => {
  const a = await server({ profiles: [{ ...ME, role: 'tourist' }] });
  assert.equal(a.run("store.get('connect-role', null)"), 'tourist');
  a.run('navigator.onLine = false');
  await a.run('loadConnect(true)');
  assert.equal(a.run('S.connect.status + (S.connect.me === null)'), 'offlinetrue');
  assert.equal(a.run('connectRole()'), 'tourist');
  assert.equal(a.run("roleView('home')"), 'discover');
  const fresh = runtime();
  assert.equal(fresh.run("roleView('discover') + roleView('connect')"), 'discoverconnect'); // unknown role: no redirect
});

test('no local flag grants eligibility; a verified account cannot pick a role', async () => {
  const a = await server({ profiles: [{ ...ME, verification_status: 'verified', age_group: 'minor' }] });
  a.run("S.lang = 'en'");
  assert.equal(a.run('accountEligibility(serverAccount(S.connect.me)).status'), 'awaiting-approval');
  const html = a.run('VIEWS.connect.render()');
  assert.match(html, /Verified by an admin/);
  assert.match(html, /You are under 18/);
  assert.equal((await a.run("chooseRole('tourist')")).why, 'denied');
  assert.equal(a.run("store.get('connect', 'none')"), 'none');
  a.run("S.connect.me.age_group = 'adult'");
  await a.run('loadConnect(true)'); // a fresh server read replaces anything edited in memory
  assert.equal(a.run('S.connect.me.age_group'), 'minor');
});

test('tourist: approved places only, connecting is not open, block and report reach the server', async () => {
  const a = await server({ profiles: [{ ...ME, role: 'tourist' }] });
  a.run("S.lang = 'en'");
  assert.equal(a.run('connectRole()'), 'tourist');
  assert.equal(a.run("roleView('home')"), 'discover');
  assert.equal(a.run("roleView('school')"), 'discover');
  assert.match(a.run('VIEWS.discover.render()'), /Han Market/);
  const spot = a.run("VIEWS.spot.render('han-market')");
  assert.match(spot, /Connecting with tourists: Not open yet/);
  assert.match(spot, /identity verification/);
  assert.match(a.run("VIEWS.spot.render('dragon-bridge')"), /not on the approved list/);
  assert.equal((await a.run("blockPerson('s9')")).ok, true);
  assert.equal((await a.run("reportPerson('s9', 'r1', 'spam')")).ok, true);
  assert.deepEqual(calls(a, 'insert'), [['insert', 'blocks', { blocked_id: 's9' }], ['insert', 'reports', { reported_id: 's9', request_id: 'r1', reason: 'spam' }]]);
});

test('the public app has no school, teacher or admin screens or RPCs', async () => {
  const a = await server({ profiles: [{ ...ME, role: 'student', verification_status: 'verified', age_group: 'adult' }] });
  assert.equal(a.run("Object.hasOwn(VIEWS, 'school') || typeof isStaff + typeof joinSchool + typeof createSession !== 'undefinedundefinedundefined'"), false);
  assert.equal(a.run('JSON.stringify(ROLE_TABS)').includes('school'), false);
  assert.deepEqual(calls(a, 'rpc').map(c => c[1]).filter(n => /school|admin/.test(n)), []);
});
