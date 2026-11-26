-- PRD §8.4 / §9: per-project AI budget and neutral public names for guests.
begin;

-- Some installations of 0003 kept the original policy and only revoked DELETE; 0006_audit_fixes neutralises it
-- with ALTER POLICY (the Supabase connector refuses DROP).
-- The account deletion path still uses the auth.users foreign-key cascade.
revoke delete on table public.profiles from public, anon, authenticated;

create or replace function public.safe_profiles(p_ids uuid[])
returns table (id uuid, display_name text, level text, role text)
language sql stable security definer set search_path = '' as $$
  select p.id, case when p.role = 'tourist' then null else p.display_name end, p.level, p.role
  from public.profiles p
  where (select auth.uid()) is not null and cardinality(p_ids) <= 100 and p.id = any (p_ids)
    and p.age_group = 'adult' and p.verification_status = 'verified';
$$;
revoke execute on function public.safe_profiles(uuid[]) from public, anon;
grant execute on function public.safe_profiles(uuid[]) to authenticated;

create table if not exists private.ai_project_usage (
  day date primary key,
  requests integer not null check (requests >= 0)
);
alter table private.ai_project_usage enable row level security;
revoke all privileges on table private.ai_project_usage from public, anon, authenticated, service_role;
revoke all privileges on table public.ai_usage from service_role;
grant select, insert, update on table private.ai_project_usage, public.ai_usage to service_role;

-- Include the current UTC day's existing usage when upgrading from 0004.
lock table public.ai_usage in share row exclusive mode;
insert into private.ai_project_usage (day, requests)
select day, least(sum(requests), 100)::integer from public.ai_usage
where day = (now() at time zone 'utc')::date
group by day
on conflict (day) do nothing;

create or replace function public.ai_project_quota_take(p_user uuid, p_limit integer) returns integer
language plpgsql security invoker set search_path = '' as $$
declare
  quota_day date := (now() at time zone 'utc')::date;
  account_count integer;
  project_ceiling constant integer := 100;
begin
  if p_user is null or p_limit is null or p_limit < 1 then return null; end if;

  -- Acquire the account row first. A refused project reservation undoes the account write.
  begin
    insert into public.ai_usage as u (user_id, day, requests)
    values (p_user, quota_day, 1)
    on conflict (user_id, day) do update set requests = u.requests + 1
      where u.requests < least(p_limit, 40)
    returning u.requests into account_count;
    if not found then return null; end if;

    insert into private.ai_project_usage as p (day, requests)
    values (quota_day, 1)
    on conflict (day) do update set requests = p.requests + 1
      where p.requests < project_ceiling;
    if not found then raise sqlstate 'PT429'; end if;
  exception when sqlstate 'PT429' then
    return null;
  end;

  return account_count;
end;
$$;
revoke execute on function public.ai_project_quota_take(uuid, integer) from public, anon, authenticated;
grant execute on function public.ai_project_quota_take(uuid, integer) to service_role;

-- Block the old Edge Function during cutover; it does not enforce the new age and text checks.
create or replace function public.ai_quota_take(p_user uuid, p_limit integer) returns integer
language sql security invoker set search_path = '' as $$
  select null::integer;
$$;
revoke execute on function public.ai_quota_take(uuid, integer) from public, anon, authenticated;
grant execute on function public.ai_quota_take(uuid, integer) to service_role;

commit;
