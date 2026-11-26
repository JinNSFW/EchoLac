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
  assert.equal(status({ ...adult, ageGroup: 'minor', approvals: { school: true, guardian: true } }), 'supervised-only');
  assert.equal(status({ ...adult, ageGroup: 'minor', approvals: { school: true } }), 'awaiting-approval');
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
const ME = { id: 'u1', display_name: 'Lan', level: 'B1', role: 'student', age_group: null, verification_status: 'unverified', school_id: null };
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
  for (const v of ['connect', 'discover', 'connections', 'school']) assert.match(local.run(`VIEWS.${v}.render()`), /needs a synced EchoLạc account/);
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
  assert.match(html, /Join your school/);
  assert.match(html, /Not yet eligible/);
  a.run("window.__rpc.join_school = () => ({ data: null, error: null })");
  assert.equal((await a.run("joinSchool('WRONG')")).why, 'wrong-code');
  a.run("window.__rpc.join_school = () => ({ data: null, error: { message: 'join_school: too many wrong codes, try again later' } })");
  assert.equal((await a.run("joinSchool('X')")).why, 'locked');
  a.run("window.__rpc.join_school = () => ({ data: 'sch1', error: null })");
  assert.equal((await a.run("joinSchool(' GOOD ')")).ok, true);
  assert.deepEqual(calls(a, 'rpc').filter(c => c[1] === 'join_school').map(c => c[2].p_code), ['WRONG', 'X', 'GOOD']);
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

test('no local flag grants eligibility; a verified or school member cannot pick a role', async () => {
  const a = await server({ profiles: [{ ...ME, school_id: 'sch1', verification_status: 'verified', age_group: 'minor' }], schools: [{ id: 'sch1', name: 'THPT A' }],
    minor_approvals: [{ student_id: 'u1', school_approved_at: '2026-11-20', guardian_consent_at: null, revoked_at: null }] });
  a.run("S.lang = 'en'");
  assert.equal(a.run('accountEligibility(serverAccount(S.connect.me)).status'), 'awaiting-approval');
  const html = a.run('VIEWS.connect.render()');
  assert.match(html, /THPT A/);
  assert.match(html, /Guardian consent: <b>Not open yet/);
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

test('school admin and teacher pages use the RPCs and RLS inserts', async () => {
  const admin = { ...ME, role: 'school_admin', verification_status: 'verified', age_group: 'adult', school_id: 'sch1' };
  const members = [{ id: 'm1', display_name: 'Minh', role: 'student', age_group: 'minor', verification_status: 'verified' }];
  const a = await server({ profiles: [admin], schools: [{ id: 'sch1', name: 'THPT A' }], minor_approvals: [] });
  a.run(`window.__rpc.school_members = () => ({ data: ${JSON.stringify(members)}, error: null }); window.__rpc.school_rotate_invite_code = () => ({ data: 'K7Q2-9XPA', error: null });`);
  await a.run('loadConnect(true)');
  a.run("S.lang = 'en'");
  assert.equal(a.run('connectRole()'), 'staff');
  const html = a.run('VIEWS.school.render()');
  assert.match(html, /Minh/);
  assert.match(html, /Approve minor/);
  assert.match(html, /Guardian consent: Not open yet/);
  assert.equal((await a.run("setMember('m1', 'student', 'verified', 'minor')")).ok, true);
  assert.equal((await a.run("setMinorApproval('m1', true)")).ok, true);
  assert.equal((await a.run('rotateInvite()')).data, 'K7Q2-9XPA');
  assert.deepEqual(calls(a, 'rpc').filter(c => c[1].startsWith('school_set')).map(c => [c[1], c[2]]), [
    ['school_set_member', { p_user: 'm1', p_role: 'student', p_verification: 'verified', p_age_group: 'minor' }],
    ['school_set_minor_approval', { p_student: 'm1', p_approved: true }]]);

  const t = await server({ profiles: [{ ...admin, role: 'teacher' }], schools: [{ id: 'sch1', name: 'THPT A' }] });
  t.run("S.lang = 'en'");
  assert.match(t.run('VIEWS.school.render()'), /Create session/);
  assert.equal((await t.run("createSession({ location_id: 'han-market', starts_at: '2026-12-01T01:00:00Z', ends_at: '2026-12-01T03:00:00Z', capacity: 8 })")).ok, true);
  assert.deepEqual(calls(t, 'insert'), [['insert', 'group_sessions', { school_id: 'sch1', location_id: 'han-market', starts_at: '2026-12-01T01:00:00Z', ends_at: '2026-12-01T03:00:00Z', capacity: 8 }]]);

  const s = await server({ profiles: [ME] });
  s.run("S.lang = 'en'");
  assert.match(s.run('VIEWS.school.render()'), /only for verified teachers/);
});
