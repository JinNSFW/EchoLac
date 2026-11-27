// Connect on the server: one case table run against lib/connect/policy.js (client hints) and
// supabase/functions/_shared/connect-policy.ts (server), plus the Edge Function handlers with mocked fetch. No network.
const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime } = require('./helpers/runtime.cjs');

const load = () => Promise.all([import('../supabase/functions/_shared/connect-policy.ts'), import('../supabase/functions/_shared/connect.ts')]);
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const [T, S, ADMIN, SESSION, REQ] = [1, 2, 3, 4, 7].map(id);
const NOW = Date.parse('2026-11-26T00:00:00Z');

// One abstract case, two shapes. The base tourist is verified, which v1 cannot produce yet (no tourist verification),
// so in production every tourist gets 'tourist-not-eligible'; the base case shows the rule once verification exists.
const base = () => ({
  tourist: { role: 'tourist', age: 'adult', verified: true },
  student: { role: 'student', age: 'adult', verified: true, level: 'B1' },
  place: 'dragon-bridge', mode: 'supervised-group', sessionId: SESSION, slots: false, block: null, brokenBlocks: false,
  session: { at: 'dragon-bridge', admin: true, status: 'scheduled', past: false },
});
const minor = () => ({ student: { ...base().student, age: 'minor' } });
const CASES = [
  ['adult student, supervised group', {}, []],
  ['minor student (no approval path in the adults-only pilot)', minor(), ['student-awaiting-approval']],
  ['unverified student', { student: { ...base().student, verified: false } }, ['student-not-eligible']],
  ['student account is a tourist', { student: { ...base().student, role: 'tourist' } }, ['student-not-eligible']],
  ['student without age group', { student: { ...base().student, age: null } }, ['student-not-eligible']],
  ['unverified tourist (every tourist in v1)', { tourist: { role: 'tourist', age: 'adult', verified: false } }, ['tourist-not-eligible']],
  ['minor tourist', { tourist: { role: 'tourist', age: 'minor', verified: true } }, ['tourist-not-eligible']],
  ['tourist account is a student', { tourist: { role: 'student', age: 'adult', verified: true } }, ['tourist-not-eligible']],
  ['place not approved', { place: 'fake-place' }, ['location-not-approved', 'session-invalid']],
  ['session at another place', { place: 'han-market' }, ['session-invalid']],
  ['session supervisor is not an admin', { session: { ...base().session, admin: false } }, ['session-invalid']],
  ['session cancelled', { session: { ...base().session, status: 'cancelled' } }, ['session-invalid']],
  ['session already over', { session: { ...base().session, past: true } }, ['session-invalid']],
  ['unknown session id', { sessionId: id(99) }, ['session-invalid']],
  ['no session', { session: null, sessionId: null }, ['session-invalid']],
  ['unknown mode', { mode: 'walk' }, ['session-invalid']],
  ['one-to-one, adult with free slots', { mode: 'one-to-one', sessionId: null, slots: true }, ['one-to-one-disabled']],
  ['one-to-one, minor', { ...minor(), mode: 'one-to-one', sessionId: null }, ['student-awaiting-approval', 'one-to-one-disabled', 'minor-one-to-one-blocked', 'not-available']],
  ['tourist blocked the student', { block: 'by-tourist' }, ['blocked']],
  ['student blocked the tourist', { block: 'by-student' }, ['blocked']],
  ['level A1', { student: { ...base().student, level: 'A1' } }, ['level-below-minimum']],
  ['no level', { student: { ...base().student, level: null } }, ['level-below-minimum']],
  ['several at once', { tourist: { role: 'tourist', age: 'adult', verified: false }, ...minor(), block: 'by-student' },
    ['tourist-not-eligible', 'student-awaiting-approval', 'blocked']],
  ['blocks unreadable', { brokenBlocks: true }, ['unverifiable']],
];

// The client hint sees only the student's own account.
const toClient = c => ({ id: S, role: c.student.role, ageGroup: c.student.age ?? undefined, verified: c.student.verified, level: c.student.level ?? undefined });

function toServer(c) {
  const g = c.session;
  const prof = (uid, p) => ({ id: uid, role: p.role, age_group: p.age, verification_status: p.verified ? 'verified' : 'unverified', level: p.level ?? null });
  return {
    tourist: prof(T, c.tourist), studentId: S, student: prof(S, c.student),
    locationId: c.place, location: c.place === 'fake-place' ? null : { id: c.place, approved: true },
    mode: c.mode, sessionId: c.sessionId,
    session: g && { id: SESSION, location_id: g.at, created_by: ADMIN, status: g.status, ends_at: g.past ? '2026-01-01T00:00:00Z' : '2027-01-01T00:00:00Z', capacity: 10 },
    supervisorIsAdmin: !!g?.admin,
    availability: c.slots ? [{ location_id: c.place, slot: 'sat-am' }] : [],
    blocks: c.brokenBlocks ? null : c.block === 'by-tourist' ? [{ blocker_id: T, blocked_id: S }] : c.block === 'by-student' ? [{ blocker_id: S, blocked_id: T }] : [],
    now: NOW,
  };
}

// The client keeps only the account-status hint (accountEligibility); it must agree with the server's student reasons.
test('server policy verdicts, and the client account hint agrees on every case', async () => {
  const [{ canConnect }] = await load();
  const app = runtime();
  for (const [name, over, expected] of CASES) {
    const c = { ...base(), ...over };
    const server = canConnect(toServer(c));
    assert.deepEqual(server, { ok: expected.length === 0, reasons: expected }, `server: ${name}`);
    if (c.brokenBlocks) continue;
    const st = toClient(c);
    const hint = st.role === 'student' ? app.run(`accountEligibility(${JSON.stringify(st)}).status`) : 'not-eligible';
    const want = expected.includes('student-not-eligible') || expected.includes('level-below-minimum') ? 'not-eligible'
      : expected.includes('student-awaiting-approval') ? 'awaiting-approval' : 'eligible';
    assert.equal(hint, want, `client hint: ${name}`);
  }
});

test('server policy: rows that only exist on the server fail closed', async () => {
  const [{ canConnect }] = await load();
  const s = over => canConnect({ ...toServer(base()), ...over }).reasons;
  assert.deepEqual(s({ location: { id: 'dragon-bridge', approved: false } }), ['location-not-approved']);
  assert.deepEqual(s({ student: null }), ['student-not-eligible', 'level-below-minimum']); // student_id given, row missing
  assert.deepEqual(s({ studentId: null, student: null }), []); // whole-session request: the trigger allows it too
  assert.deepEqual(s({ tourist: null }), ['tourist-not-eligible']);
  assert.deepEqual(s({ supervisorIsAdmin: undefined }), ['session-invalid']); // supervisor unknown = not allowed
  assert.deepEqual(s({ supervisorIsAdmin: 'true' }), ['session-invalid']);
  assert.deepEqual(canConnect(undefined).reasons, ['unverifiable']);
  // Seats: distinct other tourists already accepted; a missing capacity counts as full.
  assert.deepEqual(s({ taken: 9 }), []);
  assert.deepEqual(s({ taken: 10 }), ['session-full']);
  assert.deepEqual(s({ session: { ...toServer(base()).session, capacity: undefined } }), ['session-full']);
});

test('tourist responses hide student-side reasons', async () => {
  const [, { touristView }] = await load();
  assert.deepEqual(touristView(['tourist-not-eligible', 'student-awaiting-approval', 'blocked']), ['tourist-not-eligible']);
  assert.deepEqual(touristView(['student-not-eligible', 'session-invalid', 'level-below-minimum']), ['session-invalid']);
  assert.deepEqual(touristView(['location-not-approved', 'blocked']), ['location-not-approved', 'session-invalid']);
  assert.deepEqual(touristView(['session-full']), ['session-full']);
});

// Minimal stand-in for the zod calls the schemas make; Deno runs them with real zod 3.23.8.
const z = (() => {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const field = check => ({ check, optional: () => field(v => v === undefined || check(v)) });
  const str = (extra = () => true) => ({ ...field(v => typeof v === 'string' && extra(v)), uuid: () => str(v => UUID.test(v)), regex: re => str(v => re.test(v)) });
  return {
    string: () => str(),
    enum: list => field(v => list.includes(v)),
    object: shape => ({ strict: () => ({ safeParse: v => (v && typeof v === 'object' && !Array.isArray(v)
      && Object.keys(v).every(k => Object.hasOwn(shape, k)) && Object.entries(shape).every(([k, f]) => f.check(v[k])))
      ? { success: true, data: v } : { success: false } }) }),
  };
})();

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const TOKENS = { 'tok-tourist': T, 'tok-student': S };

// A fake PostgREST + Auth: rows in `db`, every call recorded.
function server(over = {}) {
  const c = toServer(base());
  const db = {
    profiles: [c.tourist, c.student], locations: [c.location], group_sessions: [c.session], blocks: [], admins: [ADMIN],
    audit: [], requests: [], open: [], fail: {}, insertError: null, ...over,
  };
  const calls = [];
  const fetch = async (url, init = {}) => {
    const method = init.method || 'GET';
    calls.push({ method, url, body: init.body ? JSON.parse(init.body) : null });
    if (url === 'https://x.supabase.co/auth/v1/user') {
      const uid = TOKENS[init.headers.Authorization.replace('Bearer ', '')];
      return uid ? json(200, { id: uid }) : json(401, { message: 'bad jwt' });
    }
    assert.equal(init.headers.Authorization, 'Bearer service-key');
    const [table, query] = url.replace('https://x.supabase.co/rest/v1/', '').split('?');
    if (db.fail[table]) return json(500, { message: 'down' });
    if (table === 'audit_log') {
      if (method === 'POST') { db.audit.push(JSON.parse(init.body)); return new Response(null, { status: 201 }); }
      return json(200, db.audit.slice(0, 20));
    }
    if (table === 'profiles') return json(200, db.profiles.filter(p => query.includes(p.id)));
    if (table === 'rpc/is_admin_account') return json(200, method === 'POST' && db.admins.includes(JSON.parse(init.body).p_user));
    if (table === 'connection_requests') {
      if (method === 'POST') {
        if (db.insertError) return json(db.insertError === 'dup' ? 409 : 400, db.insertError === 'dup'
          ? { code: '23505', message: 'duplicate key value violates unique constraint "connection_requests_open_unique"' } : { code: '23514', message: db.insertError });
        const row = { id: REQ, ...JSON.parse(init.body), created_at: '2026-11-26T00:00:00Z' };
        db.requests.push(row);
        return json(201, [row]);
      }
      if (method === 'PATCH') {
        const row = db.requests.find(r => query.includes(`id=eq.${r.id}&status=eq.${r.status}&`));
        if (row) Object.assign(row, JSON.parse(init.body));
        return json(200, row ? [row] : []);
      }
      if (query.includes('tourist_id=eq.')) return json(200, db.open);
      if (query.startsWith('select=tourist_id&')) return json(200, db.requests.filter(r => r.status === 'accepted' && query.includes(`session_id=eq.${r.session_id}`)));
      return json(200, db.requests.filter(r => query.includes(`id=eq.${r.id}`)));
    }
    return json(200, db[table] || []);
  };
  return { db, calls, deps: { url: 'https://x.supabase.co', key: 'service-key', fetch, z, now: () => NOW, pilotOpen: true } };
}
const post = (body, token) => new Request('https://fn.local', { method: 'POST', body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
const call = async (fn, body, token, s) => { const res = await fn(post(body, token), s.deps); return { status: res.status, ...(await res.json()) }; };
const ASK = { location_id: 'dragon-bridge', session_id: SESSION, student_id: S };
const pending = over => ({ id: REQ, tourist_id: T, student_id: S, location_id: 'dragon-bridge', mode: 'supervised-group', session_id: SESSION, status: 'pending', created_at: '2026-11-26T00:00:00Z', ...over });

test('handlers: auth, method and body are checked before any database call', async () => {
  const [, { connectRequest, connectRespond }] = await load();
  for (const fn of [connectRequest, connectRespond]) {
    const s = server();
    assert.equal((await fn(new Request('https://fn.local', { method: 'OPTIONS' }), s.deps)).status, 204);
    assert.equal((await fn(new Request('https://fn.local'), s.deps)).status, 405);
    assert.deepEqual(await call(fn, ASK, null, s), { status: 401, ok: false, reasons: ['auth'], request: null });
    assert.deepEqual((await call(fn, ASK, 'forged', s)).reasons, ['auth']);
    assert.ok(s.calls.every(x => x.url.endsWith('/auth/v1/user')));
  }
  const s = server();
  for (const bad of [{}, { ...ASK, session_id: 'x' }, { ...ASK, location_id: 'a&or=(id.neq.0)' }, { ...ASK, tourist_id: S }, { ...ASK, student_id: null }]) {
    assert.deepEqual(await call(connectRequest, bad, 'tok-tourist', s), { status: 400, ok: false, reasons: ['request'], request: null });
  }
  for (const bad of [{ request_id: REQ, decision: 'blocked' }, { request_id: REQ }, { request_id: REQ, decision: 'accepted', status: 'accepted' }]) {
    assert.deepEqual((await call(connectRespond, bad, 'tok-student', s)).reasons, ['request']);
  }
  assert.ok(s.calls.every(x => x.url.endsWith('/auth/v1/user')));
});

test('closed pilot: both handlers refuse after auth and body checks, before any database call', async () => {
  const [, { connectRequest, connectRespond }] = await load();
  for (const [fn, body, tok] of [[connectRequest, ASK, 'tok-tourist'], [connectRespond, { request_id: REQ, decision: 'accepted' }, 'tok-student']]) { // declining or ending stays open so people can always leave
    const s = server(); s.deps.pilotOpen = undefined; // env flag unset in production
    assert.deepEqual(await call(fn, body, tok, s), { status: 403, ok: false, reasons: ['pilot-closed'], request: null });
    assert.ok(s.calls.every(x => x.url.endsWith('/auth/v1/user')));
  }
});

test('connect-request: v1 tourists are refused and audited; nothing is inserted', async () => {
  const [, { connectRequest }] = await load();
  const s = server();
  s.db.profiles[0] = { ...s.db.profiles[0], verification_status: 'unverified' };
  assert.deepEqual(await call(connectRequest, ASK, 'tok-tourist', s), { status: 403, ok: false, reasons: ['tourist-not-eligible'], request: null });
  assert.equal(s.db.requests.length, 0);
  assert.deepEqual(s.db.audit, [{ actor_id: T, action: 'connect_request', target_id: SESSION, details: { location_id: 'dragon-bridge', student_id: S, ok: false, reasons: ['tourist-not-eligible'] } }]);
  // A student calling connect-request is refused the same way.
  assert.deepEqual((await call(connectRequest, { ...ASK, student_id: undefined }, 'tok-student', s)).reasons, ['tourist-not-eligible']);
});

test('connect-request: success, duplicate, trigger refusal, rate limit and database failure', async () => {
  const [, { connectRequest, CONNECT_LIMITS }] = await load();
  const s = server();
  const ok = await call(connectRequest, ASK, 'tok-tourist', s);
  assert.equal(ok.status, 200); assert.equal(ok.ok, true);
  assert.deepEqual(ok.request, pending());
  const insert = s.calls.find(x => x.method === 'POST' && x.url.includes('connection_requests'));
  assert.deepEqual(insert.body, { tourist_id: T, student_id: S, location_id: 'dragon-bridge', mode: 'supervised-group', session_id: SESSION, status: 'pending' });
  assert.ok(s.calls.indexOf(insert) > s.calls.findIndex(x => x.method === 'POST' && x.url.includes('audit_log')), 'audit is written first');

  assert.deepEqual((await call(connectRequest, ASK, 'tok-tourist', server({ open: [{ id: REQ }] }))), { status: 409, ok: false, reasons: ['duplicate-request'], request: null });
  assert.deepEqual((await call(connectRequest, ASK, 'tok-tourist', server({ insertError: 'session-invalid' }))).reasons, ['session-invalid']);
  assert.deepEqual((await call(connectRequest, ASK, 'tok-tourist', server({ insertError: 'permission denied' }))).reasons, ['unverifiable']);
  // A parallel duplicate passes the pre-check and hits the unique index (0005).
  assert.deepEqual(await call(connectRequest, ASK, 'tok-tourist', server({ insertError: 'dup' })), { status: 409, ok: false, reasons: ['duplicate-request'], request: null });
  // Student-side refusals reach the tourist only as session-invalid; audit_log keeps the real reasons.
  assert.deepEqual((await call(connectRequest, ASK, 'tok-tourist', server({ insertError: 'student-awaiting-approval' }))).reasons, ['session-invalid']);
  const hidden = server({ blocks: [{ blocker_id: S, blocked_id: T }] });
  hidden.db.profiles[1] = { ...hidden.db.profiles[1], level: 'A1' };
  assert.deepEqual(await call(connectRequest, ASK, 'tok-tourist', hidden), { status: 403, ok: false, reasons: ['session-invalid'], request: null });
  assert.deepEqual(hidden.db.audit[0].details.reasons, ['blocked', 'level-below-minimum']);
  // A full session: other tourists hold every seat.
  const full = server({ requests: [pending({ id: id(50), tourist_id: id(60), status: 'accepted' })] });
  full.db.group_sessions[0] = { ...full.db.group_sessions[0], capacity: 1 };
  assert.deepEqual((await call(connectRequest, ASK, 'tok-tourist', full)).reasons, ['session-full']);

  const busy = server({ audit: Array.from({ length: CONNECT_LIMITS.perHour }, () => ({ actor_id: T })) });
  assert.deepEqual(await call(connectRequest, ASK, 'tok-tourist', busy), { status: 429, ok: false, reasons: ['rate-limited'], request: null });
  assert.ok(!busy.calls.some(x => x.method === 'POST'));
  const since = busy.calls.find(x => x.url.includes('audit_log')).url;
  assert.match(since, /actor_id=eq\.00000000-0000-4000-8000-000000000001&action=in\.\(connect_request,connect_respond\)&created_at=gt\.2026-11-25T23:00:00\.000Z&limit=20$/);

  // The supervisor must still be an admin; the check is an RPC on auth.users (0008).
  const noAdmin = server({ admins: [] });
  assert.deepEqual(await call(connectRequest, ASK, 'tok-tourist', noAdmin), { status: 403, ok: false, reasons: ['session-invalid'], request: null });
  assert.deepEqual(noAdmin.calls.find(x => x.url.endsWith('/rpc/is_admin_account')).body, { p_user: ADMIN });
  assert.equal(noAdmin.db.requests.length, 0);

  for (const table of ['profiles', 'audit_log', 'rpc/is_admin_account']) {
    const down = server({ fail: { [table]: true } });
    assert.deepEqual(await call(connectRequest, ASK, 'tok-tourist', down), { status: 503, ok: false, reasons: ['unverifiable'], request: null });
    assert.equal(down.db.requests.length, 0);
  }
});

test('connect-respond: the student accepts or declines pending; either party ends an accepted one', async () => {
  const [, { connectRespond }] = await load();
  const ask = (decision, token, over) => { const s = server({ requests: [pending(over)] }); return call(connectRespond, { request_id: REQ, decision }, token, s).then(r => ({ ...r, s })); };
  assert.deepEqual((await ask('accepted', 'tok-tourist')).reasons, ['wrong-party']);
  assert.deepEqual((await ask('declined', 'tok-tourist')).reasons, ['wrong-party']);
  assert.deepEqual((await ask('cancelled', 'tok-student')).reasons, ['wrong-party']);
  assert.deepEqual((await ask('accepted', 'tok-student', { student_id: null })).reasons, ['wrong-party']); // whole-session request
  assert.deepEqual((await ask('declined', 'tok-student', { status: 'accepted' })).reasons, ['not-pending']);
  const missing = await call(connectRespond, { request_id: id(42), decision: 'declined' }, 'tok-student', server());
  assert.deepEqual([missing.status, missing.reasons], [404, ['not-found']]);

  const accepted = await ask('accepted', 'tok-student');
  assert.deepEqual([accepted.status, accepted.ok, accepted.request.status], [200, true, 'accepted']);
  assert.deepEqual(accepted.s.db.audit.map(a => [a.action, a.target_id, a.details.decision]), [['connect_respond', REQ, 'accepted']]);
  assert.equal((await ask('cancelled', 'tok-tourist')).request.status, 'cancelled');
  assert.equal((await ask('cancelled', 'tok-tourist', { status: 'accepted' })).request.status, 'cancelled');
  const ended = await ask('cancelled', 'tok-student', { status: 'accepted' });
  assert.deepEqual([ended.status, ended.request.status], [200, 'cancelled']);
  assert.match(ended.s.calls.find(x => x.method === 'PATCH').url, /id=eq\.[^&]+&status=eq\.accepted&/); // only if still accepted
  assert.deepEqual((await ask('cancelled', 'tok-tourist', { status: 'declined' })).reasons, ['not-pending']);
  // The last seat: another tourist is already accepted in a capacity-1 session.
  const full = server({ requests: [pending(), pending({ id: id(50), tourist_id: id(60), status: 'accepted' })] });
  full.db.group_sessions[0] = { ...full.db.group_sessions[0], capacity: 1 };
  const noSeat = await call(connectRespond, { request_id: REQ, decision: 'accepted' }, 'tok-student', full);
  assert.deepEqual([noSeat.status, noSeat.reasons], [403, ['session-full']]);

  // Accepting re-checks fresh rows: the student lost verification after the request was sent.
  const s = server({ requests: [pending()] });
  s.db.profiles[1] = { ...s.db.profiles[1], verification_status: 'unverified' };
  const refused = await call(connectRespond, { request_id: REQ, decision: 'accepted' }, 'tok-student', s);
  assert.deepEqual([refused.status, refused.reasons], [403, ['student-not-eligible']]);
  assert.equal(s.db.requests[0].status, 'pending');
  assert.ok(!s.calls.some(x => x.method === 'PATCH'));
  // Declining always works.
  assert.equal((await call(connectRespond, { request_id: REQ, decision: 'declined' }, 'tok-student', s)).request.status, 'declined');
});
