import { openChat, type Env, type Fetch } from './ai.ts';
import { buildMessages, findScenario, learnerTexts, LIMITS, quotaGranted, sse, type ConverseRequest, type Scenario } from './converse.ts';
import { safeConversationText } from './converse-safety.ts';

type Deps = {
  url: string;
  key: string;
  scenarios: Record<string, Scenario>;
  parse: (data: unknown) => ConverseRequest | null;
  validateReply: (text: string) => boolean;
  env: Env;
  fetch: Fetch;
};

// Bearer authentication does not depend on cookies or the request origin.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const fail = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

async function authUser(req: Request, d: Deps) {
  const token = req.headers.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token || !d.url || !d.key) return null;
  const res = await d.fetch(`${d.url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: d.key },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const user = await res.json();
  if (typeof user?.id !== 'string' || !user.id) return null;
  // Auth app_metadata is server-managed. Profile age and user_metadata are self-declared.
  return { id: user.id, verifiedAdult: user.app_metadata?.echolac_verified_adult === true };
}

async function takeQuota(id: string, d: Deps) {
  const res = await d.fetch(`${d.url}/rest/v1/rpc/ai_project_quota_take`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${d.key}`, apikey: d.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_user: id, p_limit: LIMITS.dailyRequests }),
    signal: AbortSignal.timeout(5000),
  });
  return res.ok ? res.json() : undefined;
}

export async function converse(req: Request, d: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return fail(405, 'method');
  const user = await authUser(req, d).catch(() => null);
  if (!user) return fail(401, 'auth');
  if (!user.verifiedAdult) return fail(403, 'privacy');

  const body = d.parse(await req.json().catch(() => null));
  if (!body) return fail(400, 'request');
  const scenario = findScenario(d.scenarios, body.scenario);
  if (!scenario) return fail(400, 'scenario');
  const learner = learnerTexts(body);
  if (!learner || !learner.every(safeConversationText)) return fail(400, 'request');

  const count = await takeQuota(user.id, d).catch(() => undefined);
  if (count === null) return fail(429, 'quota');
  if (!quotaGranted(count)) return fail(503, 'busy');

  // Validate the complete provider answer before exposing any text to the browser.
  const answer = await openChat(buildMessages(body, scenario), d.env, d.fetch, LIMITS.maxTokens,
    text => d.validateReply(text) && safeConversationText(text));
  if (!answer) return fail(503, 'busy');
  return new Response(sse({ t: answer.text }) + sse({ done: true, provider: answer.provider }), {
    headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' },
  });
}
