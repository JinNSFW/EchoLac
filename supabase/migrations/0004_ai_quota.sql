-- EchoLạc: per-user daily AI request count for the converse Edge Function (PRD §8.4 cost control).
-- Users may read only their own rows; nobody but the service role (the Edge Function) writes.
-- The day is the UTC date, matching Workers AI's 00:00 UTC reset.
begin;

create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  requests int not null default 0 check (requests >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;
revoke all privileges on table public.ai_usage from public, anon, authenticated;
grant select on table public.ai_usage to authenticated;
create policy ai_usage_read_own on public.ai_usage for select to authenticated
  using (user_id = (select auth.uid()));

-- Atomic take: returns the new count, or null when the user already reached p_limit today.
create function public.ai_quota_take(p_user uuid, p_limit int) returns int
language sql security definer set search_path = '' as $$
  insert into public.ai_usage as u (user_id, day, requests)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set requests = u.requests + 1
    where u.requests < p_limit
  returning u.requests;
$$;
revoke execute on function public.ai_quota_take(uuid, int) from public, anon, authenticated;
grant execute on function public.ai_quota_take(uuid, int) to service_role;

commit;
