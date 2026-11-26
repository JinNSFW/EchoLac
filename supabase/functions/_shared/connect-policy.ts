// Server copy of lib/connect/policy.js canConnect, on database rows (docs/connect-plan.md §2, PRD R-16, R-17).
// Same reason codes in the same order; tests/connect-server.test.cjs runs one case table against both.
// Plain TypeScript (no enums/namespaces) so Node 24 can import it with type stripping.
// The DB trigger private.connection_requests_guard re-checks on insert and accept (migration 0003).

export const CONNECT_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const CONNECT_MIN_LEVEL = 'A2';
export const CONNECT_MODES = ['one-to-one', 'supervised-group'];

export type Profile = { id: string; role: string; age_group: string | null; verification_status: string; school_id: string | null; level?: string | null };
export type Location = { id: string; approved: boolean };
export type Session = { id: string; school_id: string; location_id: string; created_by: string; status: string; ends_at: string; capacity: number };
export type Approval = { student_id: string; school_id: string; school_approved_at: string | null; guardian_consent_at: string | null; revoked_at: string | null };
export type Block = { blocker_id: string; blocked_id: string };
export type Availability = { location_id: string; slot: string };
export type ConnectInput = {
  tourist: Profile | null;
  studentId?: string | null; // null: the request is for the whole session (allowed by the DB trigger)
  student?: Profile | null;
  locationId: string;
  location: Location | null;
  mode: string;
  sessionId?: string | null;
  session?: Session | null;
  teacher?: Profile | null; // profile of session.created_by
  taken?: number; // seats held: distinct other tourists already accepted in the session (server only)
  approvals?: Approval[];
  availability?: Availability[];
  blocks: Block[];
  now?: number;
};

// Same statuses as accountEligibility in policy.js; missing or unverifiable data falls to the stricter one.
export function studentStatus(s: Profile | null | undefined, approvals: Approval[] = []): string {
  if (!s || s.role !== 'student' || s.verification_status !== 'verified') return 'not-eligible';
  if (s.age_group === 'adult') return 'eligible';
  if (s.age_group !== 'minor') return 'not-eligible';
  const live = approvals.some(a => a && a.student_id === s.id && a.school_id === s.school_id && !a.revoked_at
    && !!a.school_approved_at && !!a.guardian_consent_at);
  return live ? 'supervised-only' : 'awaiting-approval';
}

export function canConnect(input: ConnectInput): { ok: boolean; reasons: string[] } {
  try {
    const { tourist, student, locationId, location, mode, sessionId, session, teacher, blocks } = input;
    if (!Array.isArray(blocks)) throw new Error('blocks must be a list');
    const hasStudent = input.studentId != null;
    const reasons: string[] = [];
    const add = (r: string) => { if (!reasons.includes(r)) reasons.push(r); };
    if (!location || location.id !== locationId || location.approved !== true) add('location-not-approved');
    if (!tourist || tourist.role !== 'tourist' || tourist.age_group !== 'adult' || tourist.verification_status !== 'verified') add('tourist-not-eligible');
    const status = hasStudent && student?.id === input.studentId ? studentStatus(student, input.approvals) : hasStudent ? 'not-eligible' : 'none';
    if (status === 'not-eligible') add('student-not-eligible');
    if (status === 'awaiting-approval') add('student-awaiting-approval');
    if (!CONNECT_MODES.includes(mode)) add('session-invalid');
    if (mode === 'one-to-one') {
      add('one-to-one-disabled'); // pilot v1: supervised school groups only (owner rule 26/11/2026)
      if (student?.age_group !== 'adult') add('minor-one-to-one-blocked');
      if (!(input.availability || []).some(a => a && a.location_id === locationId)) add('not-available');
    }
    if (mode === 'supervised-group') {
      const g = session;
      const supervised = !!g && !!teacher && teacher.id === g.created_by && teacher.role === 'teacher'
        && teacher.verification_status === 'verified' && teacher.school_id === g.school_id;
      if (!g || !sessionId || g.id !== sessionId || g.status !== 'scheduled' || g.location_id !== locationId
          || !(Date.parse(g.ends_at) > (input.now ?? Date.now())) || !supervised
          || (hasStudent && (!student?.school_id || student.school_id !== g.school_id))) add('session-invalid');
      if (g && !((input.taken ?? 0) < g.capacity)) add('session-full'); // server only: the client cannot see seats
    }
    if (hasStudent && tourist && blocks.some(b => b && ((b.blocker_id === tourist.id && b.blocked_id === input.studentId)
        || (b.blocker_id === input.studentId && b.blocked_id === tourist.id)))) add('blocked');
    if (hasStudent && CONNECT_LEVELS.indexOf(student?.level ?? '') < CONNECT_LEVELS.indexOf(CONNECT_MIN_LEVEL)) add('level-below-minimum');
    return { ok: reasons.length === 0, reasons };
  } catch {
    return { ok: false, reasons: ['unverifiable'] };
  }
}
