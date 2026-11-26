'use strict';
// Local Guide Connect account status (docs/connect-plan.md §2), a display hint only. The connection rule itself
// runs on the server: RLS and supabase/functions/_shared/connect-policy.ts behind connect-request / connect-respond.

const CONNECT_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CONNECT_MIN_LEVEL = 'A2';

// Missing or unverifiable data always falls to the stricter status. A student below A2 is never shown as eligible.
function accountEligibility(user) {
  if (!user || typeof user !== 'object' || user.verified !== true) return { status: 'not-eligible' };
  if (user.role === 'student' && CONNECT_LEVELS.indexOf(user.level) < CONNECT_LEVELS.indexOf(CONNECT_MIN_LEVEL)) return { status: 'not-eligible' };
  if (user.ageGroup === 'adult') return { status: 'eligible' };
  if (user.ageGroup !== 'minor' || user.role !== 'student') return { status: 'not-eligible' }; // tourists under 18 never qualify
  const a = user.approvals || {};
  return { status: a.school === true && a.guardian === true ? 'supervised-only' : 'awaiting-approval' };
}
