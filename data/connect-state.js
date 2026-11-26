'use strict';
// Local Guide Connect, server data only (docs/real-launch-prompt.md "SẢN PHẨM CHÍNH THỨC").
// Role, verification, school and approvals come from Supabase (RLS, RPCs in 0003_connect.sql, Edge Functions).
// Nothing here is saved on the device, and no local value ever grants eligibility.

const CONNECT_VIEWS = ['connect', 'discover', 'spot', 'connections', 'school', 'profile'];
const connectBlank = status => ({ status, me: null, school: null, approval: null, locations: [], availability: [],
  requests: [], blocks: [], sessions: [], people: {}, members: [], approvals: [] });
S.connect = connectBlank('idle'); // idle = loading; then ready | signed-out | offline | error
// Last server role, kept only to pick the tab set while offline or loading. Never used for eligibility.
let connectHint = ['student', 'tourist', 'staff'].includes(store.get('connect-role', null)) ? store.get('connect-role', null) : null;
let connectLoading = null;

const cxRows = r => { if (r?.error) throw r.error; return r?.data ?? null; };
const currentView = () => (location.hash.slice(1) || '').split('/')[0];
const isStaff = (me, roles = ['teacher', 'school_admin']) => !!me?.school_id && roles.includes(me.role) && me.verification_status === 'verified';

async function connectClient() {
  if (!canUseCloud()) return { why: 'signed-out' };
  if (navigator.onLine === false) return { why: 'offline' };
  const user = await ensureSession(), c = user ? await cloudClient() : null;
  if (!user || !c) return { why: navigator.onLine === false ? 'offline' : 'error' };
  return { c, uid: user.id };
}

async function fetchConnect() {
  const { c, uid, why } = await connectClient();
  if (!c) return connectBlank(why);
  const next = connectBlank('ready');
  next.me = cxRows(await c.from('profiles').select('id,display_name,level,role,age_group,verification_status,school_id').eq('id', uid).maybeSingle());
  if (!next.me) return connectBlank('error'); // profile not on the server yet
  const [locs, avail, reqs, blocks] = (await Promise.all([
    c.from('locations').select('id,name_vi,name_en').eq('approved', true),
    c.from('availability').select('location_id,slot').eq('user_id', uid),
    c.from('connection_requests').select('*').order('created_at', { ascending: false }),
    c.from('blocks').select('blocked_id').eq('blocker_id', uid),
  ])).map(cxRows);
  Object.assign(next, { locations: locs || [], availability: avail || [], requests: reqs || [], blocks: (blocks || []).map(b => b.blocked_id) });
  const sid = next.me.school_id;
  if (sid) {
    const [school, sessions, approvals, members] = (await Promise.all([
      c.from('schools').select('id,name').eq('id', sid).maybeSingle(),
      c.from('group_sessions').select('*').eq('school_id', sid).order('starts_at', { ascending: true }),
      c.from('minor_approvals').select('student_id,school_approved_at,guardian_consent_at,revoked_at').is('revoked_at', null),
      isStaff(next.me, ['school_admin']) ? c.rpc('school_members', { p_school: sid }) : { data: [] },
    ])).map(cxRows);
    Object.assign(next, { school, sessions: sessions || [], approvals: approvals || [], members: members || [] });
    next.approval = next.approvals.find(a => a.student_id === uid) || null;
  }
  // safe_profiles returns verified adults only, so minors are never named to anyone.
  const ids = [...new Set([...next.requests.flatMap(r => [r.tourist_id, r.student_id]), ...next.blocks])].filter(id => id && id !== uid);
  if (ids.length) for (const p of cxRows(await c.rpc('safe_profiles', { p_ids: ids })) || []) next.people[p.id] = p;
  return next;
}

// force: start a fresh read even when one is running (after a write).
function loadConnect(force = false) {
  if (connectLoading && !force) return connectLoading;
  const run = (connectLoading || Promise.resolve()).catch(() => {}).then(async () => {
    const role = connectRole();
    try { S.connect = await fetchConnect(); } catch { S.connect = connectBlank(navigator.onLine === false ? 'offline' : 'error'); }
    if (S.connect.me) { connectHint = connectRole(); store.set('connect-role', connectHint); }
    if (S.user && (connectRole() !== role || CONNECT_VIEWS.includes(currentView()))) rerender();
    return S.connect;
  }).finally(() => { if (connectLoading === run) connectLoading = null; });
  return (connectLoading = run);
}
const connectMount = () => { if (S.connect.status === 'idle' && !connectLoading) loadConnect(); };

// One server write, then a fresh read. Never touches local state directly.
async function connectAct(task) {
  const { c, uid, why } = await connectClient();
  if (!c) return { ok: false, why };
  try {
    const data = await task(c, uid);
    await loadConnect(true);
    return { ok: true, data };
  } catch (e) { return { ok: false, why: 'error', message: String(e?.message || '') }; }
}

/* ---- Learner ---- */
// The DB guard allows student <-> tourist only while unverified and without a school.
const canChooseRole = me => !!me && ['student', 'tourist'].includes(me.role) && me.verification_status === 'unverified' && !me.school_id;
const chooseRole = role => (['student', 'tourist'].includes(role) && canChooseRole(S.connect.me)
  ? connectAct((c, uid) => c.from('profiles').update({ role }).eq('id', uid).then(cxRows)) : Promise.resolve({ ok: false, why: 'denied' }));

async function joinSchool(code) {
  code = String(code || '').trim();
  if (!code || code.length > 64) return { ok: false, why: 'wrong-code' };
  const r = await connectAct(c => c.rpc('join_school', { p_code: code }).then(cxRows));
  if (r.ok && !r.data) return { ok: false, why: 'wrong-code' };
  if (!r.ok && /too many/i.test(r.message || '')) return { ok: false, why: 'locked' };
  return r;
}

const approvedPlace = id => S.connect.locations.find(l => l.id === id) || null;
const hasSlot = (l, s) => S.connect.availability.some(a => a.location_id === l && a.slot === s);
function toggleAvailability(l, s) {
  if (!approvedPlace(l) || !CONNECT_SLOTS.includes(s)) return Promise.resolve({ ok: false, why: 'denied' });
  return connectAct((c, uid) => (hasSlot(l, s)
    ? c.from('availability').delete().eq('user_id', uid).eq('location_id', l).eq('slot', s)
    : c.from('availability').insert({ location_id: l, slot: s })).then(cxRows));
}

// Edge Function connect-respond re-checks every rule on the server; reasons come back from there.
async function respondConnect(requestId, decision) {
  if (!['accepted', 'declined', 'cancelled'].includes(decision)) return { ok: false, reasons: ['unverifiable'] };
  const r = await connectAct(async c => {
    const { data, error } = await c.functions.invoke('connect-respond', { body: { request_id: requestId, decision } });
    if (data) return data;
    // A 4xx arrives as FunctionsHttpError with data null; the { ok, reasons } body is in error.context.
    const body = await Promise.resolve(error?.context?.json?.()).catch(() => null);
    if (body && typeof body === 'object') return body;
    throw error || new Error('no answer');
  });
  if (!r.ok) loadConnect(true); // the list may be stale; connectAct reloads only after an answer
  const reasons = Array.isArray(r.data?.reasons) ? r.data.reasons.filter(x => typeof x === 'string') : [];
  return r.ok && r.data?.ok === true ? { ok: true, reasons: [] } : { ok: false, reasons: reasons.length ? reasons : ['unverifiable'], why: r.why };
}

const blockPerson = id => connectAct(c => c.from('blocks').insert({ blocked_id: id }).then(cxRows));
const reportPerson = (id, requestId, reason) => connectAct(c => c.from('reports')
  .insert({ reported_id: id || null, request_id: requestId || null, reason: String(reason).slice(0, 500) }).then(cxRows));

/* ---- School (verified school_admin / teacher; the RPCs check the role again) ---- */
const setMember = (id, role, verification, ageGroup) => connectAct(c => c.rpc('school_set_member',
  { p_user: id, p_role: role, p_verification: verification, p_age_group: ageGroup || null }).then(cxRows));
const setMinorApproval = (id, approved) => connectAct(c => c.rpc('school_set_minor_approval', { p_student: id, p_approved: approved === true }).then(cxRows));
const rotateInvite = () => connectAct(c => c.rpc('school_rotate_invite_code', { p_school: S.connect.me.school_id }).then(cxRows));
const createSession = ({ location_id, starts_at, ends_at, capacity }) => connectAct(c => c.from('group_sessions')
  .insert({ school_id: S.connect.me.school_id, location_id, starts_at, ends_at, capacity }).then(cxRows));

setTimeout(() => loadConnect(), 0); // after every deferred script has loaded
