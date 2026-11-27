// Handlers for the connect-request and connect-respond Edge Functions (PRD R-16, R-17, §9; connect-plan §2).
// Plain TypeScript with injected fetch and zod, so Node 24 tests can run them with mocks (tests/connect-server.test.cjs).
// Every response is JSON { ok, reasons, request }. Rows are read and written with the service role over PostgREST;
// RLS gives clients no write on connection_requests, and the DB guard trigger re-checks every insert and accept.
import { canConnect, type ConnectInput, type Profile } from './connect-policy.ts';

export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
// deno-lint-ignore no-explicit-any
export type Deps = { url: string; key: string; fetch: Fetch; z: any; now?: () => number; pilotOpen?: boolean };
export type Row = { id: string; tourist_id: string; student_id: string | null; location_id: string; mode: string; session_id: string | null; status: string; created_at: string };

// Attempts per user per rolling hour, both functions together, counted from audit_log.
export const CONNECT_LIMITS = { perHour: 20 };
const ACTIONS = ['connect_request', 'connect_respond'];
// Reason codes the guard trigger raises as its message (migrations 0005, 0008).
const DB_REASONS = ['location-not-approved', 'tourist-not-eligible', 'student-not-eligible', 'blocked', 'minor-one-to-one-blocked',
  'session-invalid', 'student-awaiting-approval', 'session-full'];
// A tourist learns nothing about a student: student-side reasons are reported as session-invalid,
// and an ineligible tourist hears only that. audit_log keeps the full list.
const STUDENT_SIDE = ['student-not-eligible', 'student-awaiting-approval', 'blocked', 'level-below-minimum'];
export const touristView = (reasons: string[]) => reasons.includes('tourist-not-eligible') ? ['tourist-not-eligible']
  : [...new Set(reasons.map(r => STUDENT_SIDE.includes(r) ? 'session-invalid' : r))];
const statusOf = (reasons: string[]) => ({ 'not-found': 404, 'not-pending': 409, 'duplicate-request': 409, unverifiable: 503 } as Record<string, number>)[reasons[0]] || 403;
const ROW = 'id,tourist_id,student_id,location_id,mode,session_id,status,created_at';

// Auth is a bearer token, not a cookie, so any origin may call; the token decides who the caller is.
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, ok: boolean, reasons: string[], request: Row | null = null) =>
  new Response(JSON.stringify({ ok, reasons, request }), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// deno-lint-ignore no-explicit-any
export function requestSchema(z: any) {
  return z.object({
    location_id: z.string().regex(/^[a-z0-9-]{1,128}$/),
    session_id: z.string().uuid(),
    student_id: z.string().uuid().optional(),
  }).strict();
}

// deno-lint-ignore no-explicit-any
export function respondSchema(z: any) {
  return z.object({ request_id: z.string().uuid(), decision: z.enum(['accepted', 'declined', 'cancelled']) }).strict();
}

class DbError extends Error { code = ''; }

// PostgREST as the service role. Throws on any failure, so callers fail closed.
function rest(d: Deps) {
  const f = d.fetch;
  // deno-lint-ignore no-explicit-any
  return async (path: string, init: RequestInit = {}): Promise<any> => {
    const res = await f(`${d.url}/rest/v1/${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${d.key}`, apikey: d.key, 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const e = new DbError(typeof body?.message === 'string' ? body.message : 'db');
      e.code = typeof body?.code === 'string' ? body.code : '';
      throw e;
    }
    return body;
  };
}
type Db = ReturnType<typeof rest>;

// Verifies the JWT with Supabase Auth (signature, expiry, revocation) and returns the user id.
async function userId(req: Request, d: Deps): Promise<string | null> {
  const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token || !d.url || !d.key) return null;
  const f = d.fetch;
  const res = await f(`${d.url}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: d.key } });
  if (!res.ok) return null;
  const user = await res.json().catch(() => null);
  return typeof user?.id === 'string' ? user.id : null;
}

// shortcut: count-then-act is not atomic, so parallel calls can pass the cap by a few; move into an RPC if abused.
async function limited(db: Db, uid: string, now: number): Promise<boolean> {
  const since = new Date(now - 3600_000).toISOString();
  const rows = await db(`audit_log?select=id&actor_id=eq.${uid}&action=in.(${ACTIONS.join(',')})&created_at=gt.${since}&limit=${CONNECT_LIMITS.perHour}`);
  return !Array.isArray(rows) || rows.length >= CONNECT_LIMITS.perHour;
}

// Written before the action, so a failed audit write blocks it (and every attempt counts for the limit).
const audit = (db: Db, uid: string, action: string, target: string, details: Record<string, unknown>) =>
  db('audit_log', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ actor_id: uid, action, target_id: target, details }) });

const one = <T>(rows: unknown): T | null => (Array.isArray(rows) && rows.length ? rows[0] as T : null);

// Loads every row canConnect needs, fresh from the database.
async function facts(db: Db, a: { touristId: string; studentId: string | null; locationId: string; mode: string; sessionId: string | null }, now: number): Promise<ConnectInput> {
  const { touristId: t, studentId: s } = a;
  const [locs, sessions, seats, blocks] = await Promise.all([
    db(`locations?select=id,approved&id=eq.${a.locationId}`),
    a.sessionId ? db(`group_sessions?select=id,location_id,created_by,status,ends_at,capacity&id=eq.${a.sessionId}`) : [],
    a.sessionId ? db(`connection_requests?select=tourist_id&session_id=eq.${a.sessionId}&status=eq.accepted`) : [],
    s ? db(`blocks?select=blocker_id,blocked_id&or=(and(blocker_id.eq.${t},blocked_id.eq.${s}),and(blocker_id.eq.${s},blocked_id.eq.${t}))`) : [],
  ]);
  const session = one<NonNullable<ConnectInput['session']>>(sessions);
  const ids = [t, s].filter(Boolean);
  const [profiles, supervisor]: [Profile[], unknown] = await Promise.all([
    db(`profiles?select=id,role,age_group,verification_status,level&id=in.(${ids.join(',')})`),
    // The supervisor is the admin who created the session; admin status lives in auth.users (0008).
    session ? db('rpc/is_admin_account', { method: 'POST', body: JSON.stringify({ p_user: session.created_by }) }) : false,
  ]);
  const byId = (id?: string | null) => (id && Array.isArray(profiles) && profiles.find(p => p.id === id)) || null;
  return {
    tourist: byId(t), studentId: s, student: byId(s), locationId: a.locationId, location: one(locs),
    mode: a.mode, sessionId: a.sessionId, session, supervisorIsAdmin: supervisor === true, blocks, now,
    taken: new Set((seats as { tourist_id: string }[]).map(x => x.tourist_id).filter(x => x !== t)).size,
  };
}

// The guard trigger's message is a reason code; 23505 is the open-request unique index (0005); else unverifiable.
const dbReason = (e: unknown) => !(e instanceof DbError) ? 'unverifiable'
  : e.code === '23505' ? 'duplicate-request' : DB_REASONS.includes(e.message) ? e.message : 'unverifiable';

// Shared entry: method, JWT, zod body, rate limit; then the action. Any database failure fails closed.
// deno-lint-ignore no-explicit-any
async function handle<Body>(req: Request, d: Deps, schema: unknown, needsOpenPilot: (body: Body) => boolean,
  act: (db: Db, uid: string, body: Body, now: number) => Promise<Response>, view = (r: string[]) => r) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return reply(405, false, ['method']);
  const uid = await userId(req, d).catch(() => null);
  if (!uid) return reply(401, false, ['auth']);
  // deno-lint-ignore no-explicit-any
  const parsed = (schema as any).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return reply(400, false, ['request']);
  if (d.pilotOpen !== true && needsOpenPilot(parsed.data)) return reply(403, false, ['pilot-closed']);
  const db = rest(d), now = (d.now || Date.now)();
  try {
    if (await limited(db, uid, now)) return reply(429, false, ['rate-limited']);
    return await act(db, uid, parsed.data, now);
  } catch (e) {
    const r = view([dbReason(e)]);
    return reply(statusOf(r), false, r);
  }
}

// connect-request: the caller (a tourist) asks to join a supervised group session, optionally with one student.
type RequestBody = { student_id?: string; location_id: string; session_id: string };
export const connectRequest = (req: Request, d: Deps) => handle<RequestBody>(req, d, requestSchema(d.z), () => true, async (db, uid, body, now) => {
  const studentId: string | null = body.student_id ?? null;
  const input = await facts(db, { touristId: uid, studentId, locationId: body.location_id, mode: 'supervised-group', sessionId: body.session_id }, now);
  const open = await db(`connection_requests?select=id&tourist_id=eq.${uid}&session_id=eq.${body.session_id}`
    + `&student_id=${studentId ? `eq.${studentId}` : 'is.null'}&status=in.(pending,accepted)&limit=1`);
  const verdict = Array.isArray(open) && open.length ? { ok: false, reasons: ['duplicate-request'] } : canConnect(input);
  await audit(db, uid, 'connect_request', body.session_id, { location_id: body.location_id, student_id: studentId, ok: verdict.ok, reasons: verdict.reasons });
  if (!verdict.ok) { const r = touristView(verdict.reasons); return reply(statusOf(r), false, r); }
  // A parallel duplicate fails on the unique index (23505) and is reported as duplicate-request.
  const rows = await db(`connection_requests?select=${ROW}`, {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ tourist_id: uid, student_id: studentId, location_id: body.location_id, mode: 'supervised-group', session_id: body.session_id, status: 'pending' }),
  });
  return reply(200, true, [], one<Row>(rows));
}, touristView);

// connect-respond: the student accepts or declines a pending request. The tourist cancels a pending or
// accepted request; the student cancels an accepted one (declining is how a student ends a pending one).
// Accepting re-runs canConnect on fresh rows. The update only applies if the status is still the one read.
type ResponseBody = { request_id: string; decision: 'accepted' | 'declined' | 'cancelled' };
export const connectRespond = (req: Request, d: Deps) => handle<ResponseBody>(req, d, respondSchema(d.z), body => body.decision === 'accepted', async (db, uid, body, now) => {
  const r = one<Row>(await db(`connection_requests?select=${ROW}&id=eq.${body.request_id}`));
  const cancel = body.decision === 'cancelled';
  const isTourist = !!r && r.tourist_id === uid, isStudent = !!r?.student_id && r.student_id === uid;
  const no = (reason: string) => ({ ok: false, reasons: [reason] });
  let verdict = !r ? no('not-found')
    : !(cancel ? isTourist || (isStudent && r.status === 'accepted') : isStudent) ? no('wrong-party')
    : !(r.status === 'pending' || (cancel && r.status === 'accepted')) ? no('not-pending')
    : { ok: true, reasons: [] as string[] };
  if (verdict.ok && r && body.decision === 'accepted') {
    verdict = canConnect(await facts(db, { touristId: r.tourist_id, studentId: r.student_id, locationId: r.location_id, mode: r.mode, sessionId: r.session_id }, now));
  }
  await audit(db, uid, 'connect_respond', body.request_id, { decision: body.decision, ok: verdict.ok, reasons: verdict.reasons });
  if (!verdict.ok || !r) return reply(statusOf(verdict.reasons), false, verdict.reasons);
  const rows = await db(`connection_requests?id=eq.${body.request_id}&status=eq.${r.status}&select=${ROW}`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status: body.decision }),
  });
  const updated = one<Row>(rows);
  return updated ? reply(200, true, [], updated) : reply(409, false, ['not-pending']); // changed by a parallel call
});
