// converse: authenticated, age-gated AI turns under the shared project budget (PRD §8.4 / §9).
import { z } from 'npm:zod@3.23.8';
import { converse } from '../_shared/converse-handler.ts';
import { LIMITS, requestSchema } from '../_shared/converse.ts';
import SCENARIOS from '../_shared/scenarios.json' with { type: 'json' };

const request = requestSchema(z);
const reply = z.string().trim().min(1).max(LIMITS.turnChars);

Deno.serve(req => converse(req, {
  url: Deno.env.get('SUPABASE_URL') || '',
  key: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  scenarios: SCENARIOS,
  parse(data) {
    const result = request.safeParse(data);
    return result.success ? result.data : null;
  },
  validateReply: text => reply.safeParse(text).success,
  env: {
    GROQ_API_KEY: Deno.env.get('GROQ_API_KEY'),
    CLOUDFLARE_ACCOUNT_ID: Deno.env.get('CLOUDFLARE_ACCOUNT_ID'),
    CLOUDFLARE_AI_TOKEN: Deno.env.get('CLOUDFLARE_AI_TOKEN'),
  },
  fetch,
}));
