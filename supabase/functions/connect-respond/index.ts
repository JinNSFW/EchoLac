// connect-respond: the student party accepts or declines a pending request; the tourist may cancel it (PRD R-16, R-17).
// Logic and contract: ../_shared/connect.ts. Owner steps: docs/supabase-setup.md.
import { z } from 'npm:zod@3.23.8';
import { connectRespond } from '../_shared/connect.ts';

const deps = { url: Deno.env.get('SUPABASE_URL') || '', key: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '', fetch, z,
  pilotOpen: Deno.env.get('ECHOLAC_CONNECT_PILOT_OPEN') === 'true' };
Deno.serve(req => connectRespond(req, deps));
