-- EchoLạc: global admins replace schools and teachers (owner decision 27/11/2026; PRD R-14 to R-18, §9). Run after 0001 to 0007.
-- Admin = auth.users.raw_app_meta_data.role = 'admin' (set by the owner in SQL, never by a client) AND an MFA (aal2) session.
-- Admins work only from the local admin page (admin/, never deployed); their power comes from the policies and RPCs below.
-- No DROP statements (the Supabase connector refuses them). The only DROP keyword is the column clause
-- `alter column school_id drop not null` in section 2, which removes a constraint, not an object.
-- Re-runnable: IF NOT EXISTS, OR REPLACE, ALTER POLICY and guarded DO blocks.
begin;

-- 1. Who is an admin. Definer so it can re-read auth.users and auth.sessions: a demoted admin, a signed-out
-- session or a downgraded MFA level stops working at once, not when the old JWT expires.
create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin'
      and (select auth.jwt()) ->> 'aal' = 'aal2', false)
    and exists (select 1 from auth.users u join auth.sessions s on s.user_id = u.id
      where u.id = (select auth.uid())
        and u.raw_app_meta_data ->> 'role' = 'admin' and s.aal = 'aal2'
        and s.id = ((select auth.jwt()) ->> 'session_id')::uuid
        and (s.not_after is null or s.not_after > now()));
$$;
revoke all on function private.is_admin() from public, anon, authenticated, service_role;
grant execute on function private.is_admin() to authenticated;

-- Supervisor check for the connection guard and the connect Edge Functions (service role only).
create or replace function public.is_admin_account(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users u where u.id = p_user and u.raw_app_meta_data ->> 'role' = 'admin');
$$;
revoke all on function public.is_admin_account(uuid) from public, anon, authenticated, service_role;
grant execute on function public.is_admin_account(uuid) to service_role;

-- 2. Schools are retired. Their tables stay (no DROP) but nobody reaches them through the API.
do $$
declare t text;
begin
  foreach t in array array['schools', 'minor_approvals'] loop
    execute format('revoke all privileges on table public.%I from public, anon, authenticated, service_role', t);
  end loop;
end $$;
alter policy member_select on public.schools using (false);
alter policy own_or_admin_select on public.minor_approvals using (false);
do $$
declare f text;
begin
  foreach f in array array['public.join_school(text)', 'public.school_rotate_invite_code(uuid)', 'public.school_members(uuid)',
      'public.school_set_member(uuid, text, text, text)', 'public.school_set_minor_approval(uuid, boolean)',
      'private.has_school_role(uuid, text[])', 'private.new_invite_code(uuid)'] loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f);
  end loop;
end $$;
-- Sessions belong to no school; the creating admin is the supervisor (R-17).
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'group_sessions'
             and column_name = 'school_id' and is_nullable = 'NO') then
    alter table public.group_sessions alter column school_id drop not null;
  end if;
end $$;
-- Learner roles only; teacher and school_admin are gone. NOT VALID first, validated once no old row is left.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_learner' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_role_learner check (role in ('student', 'tourist')) not valid;
  end if;
  if not exists (select 1 from public.profiles where role not in ('student', 'tourist')) then
    alter table public.profiles validate constraint profiles_role_learner;
  end if;
end $$;

-- 3. profiles_guard from 0006_audit_fixes without schools: clients never set verification, school columns or a
-- non-learner role; age group, level and name are locked once verified. Admin RPCs run as the owner and pass.
create or replace function private.profiles_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated', 'anon') then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then raise exception 'profiles: accounts are deleted by the server' using errcode = '42501'; end if;
  if tg_op = 'INSERT' then
    if new.role not in ('student', 'tourist') or new.verification_status <> 'unverified'
       or new.school_id is not null or new.school_joined_at is not null then
      raise exception 'profiles: privileged columns are set by an admin or the server' using errcode = '42501';
    end if;
    return new;
  end if;
  if old.verification_status <> 'unverified' then
    new.level := old.level;
    new.display_name := old.display_name;
  end if;
  if new.verification_status is distinct from old.verification_status
     or new.school_id is distinct from old.school_id
     or new.school_joined_at is distinct from old.school_joined_at
     or (new.role is distinct from old.role and (new.role not in ('student', 'tourist')
         or old.role not in ('student', 'tourist') or old.verification_status <> 'unverified'))
     or (new.age_group is distinct from old.age_group and old.verification_status <> 'unverified') then
    raise exception 'profiles: privileged columns are set by an admin or the server' using errcode = '42501';
  end if;
  return new;
end $$;

-- 4. connection_requests_guard from 0005 without schools: a group session needs an admin supervisor, and a
-- student under 18 waits (no approval path exists: adults-only pilot, 0007; guardian consent is not built).
create or replace function private.connection_requests_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  s public.profiles;
  g public.group_sessions;
begin
  if tg_op = 'UPDATE' and new.status <> 'accepted' then return new; end if;
  if not exists (select 1 from public.locations where id = new.location_id and approved) then
    raise exception 'location-not-approved' using errcode = '23514';
  end if;
  if not exists (select 1 from public.profiles where id = new.tourist_id and role = 'tourist'
      and age_group = 'adult'
      and verification_status = 'verified') then
    raise exception 'tourist-not-eligible' using errcode = '23514';
  end if;
  if new.student_id is not null then
    select * into s from public.profiles where id = new.student_id;
    if s.id is null or s.role is distinct from 'student' or s.age_group is null
       or s.verification_status is distinct from 'verified' then
      raise exception 'student-not-eligible' using errcode = '23514';
    end if;
    if exists (select 1 from public.blocks b where (b.blocker_id = new.tourist_id and b.blocked_id = new.student_id)
        or (b.blocker_id = new.student_id and b.blocked_id = new.tourist_id)) then
      raise exception 'blocked' using errcode = '23514';
    end if;
  end if;
  if new.mode = 'one-to-one' then
    if s.age_group is distinct from 'adult' then
      raise exception 'minor-one-to-one-blocked' using errcode = '23514';
    end if;
    return new;
  end if;
  -- Row lock: parallel accepts for one session wait here, so the seat count below is exact.
  select * into g from public.group_sessions where id = new.session_id for update;
  if g.id is null or g.status is distinct from 'scheduled' or g.location_id is distinct from new.location_id
     or not public.is_admin_account(g.created_by) then
    raise exception 'session-invalid' using errcode = '23514';
  end if;
  if s.age_group = 'minor' then raise exception 'student-awaiting-approval' using errcode = '23514'; end if;
  if new.status = 'accepted' and (select count(distinct r.tourist_id) from public.connection_requests r
      where r.session_id = g.id and r.status = 'accepted' and r.id <> new.id and r.tourist_id <> new.tourist_id) >= g.capacity then
    raise exception 'session-full' using errcode = '23514';
  end if;
  return new;
end $$;

-- 5. Append-only admin audit trail. Only the admin RPCs (definer, owner) write it; no role may update or delete,
-- and the triggers refuse even the owner (an owner could still disable a trigger; SQL cannot stop that).
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  action text not null check (char_length(action) <= 64),
  target_table text check (char_length(target_table) <= 64),
  target_id text check (char_length(target_id) <= 128),
  details jsonb not null default '{}' check (octet_length(details::text) <= 4096),
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;
revoke all privileges on table public.admin_audit_log from public, anon, authenticated, service_role;
grant select on table public.admin_audit_log to authenticated;
create or replace trigger admin_audit_log_immutable before update or delete on public.admin_audit_log
  for each row execute function private.audit_log_immutable();
create or replace trigger admin_audit_log_no_truncate before truncate on public.admin_audit_log
  for each statement execute function private.audit_log_immutable();

-- 6. Admin reads. Writes go only through the RPCs below; sessions are no longer written by clients.
revoke insert, update, delete on public.group_sessions from authenticated;
alter policy member_select on public.group_sessions using (false);
alter policy teacher_insert on public.group_sessions with check (false);
alter policy teacher_update on public.group_sessions using (false) with check (false);
-- audit_log and private.ai_project_usage keep no client grant; their policy only matters if one is ever added.
do $$
declare t text;
begin
  foreach t in array array['public.profiles', 'public.group_sessions', 'public.connection_requests', 'public.reports',
                           'public.blocks', 'public.admin_audit_log', 'public.audit_log', 'private.ai_project_usage'] loop
    if not exists (select 1 from pg_policies where schemaname || '.' || tablename = t and policyname = 'admin_select') then
      execute format('create policy admin_select on %s for select to authenticated using ((select private.is_admin()))', t);
    end if;
  end loop;
end $$;

-- 7. Admin RPCs. Each checks is_admin() first and writes its audit row in the same transaction.
-- Verify a learner: verification, level and age group (R-14, R-17). A verified account needs an age group.
create or replace function public.admin_set_learner(p_user uuid, p_verification text, p_level text, p_age_group text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_old public.profiles;
begin
  if not private.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  if p_verification is null or p_verification not in ('unverified', 'verified', 'rejected')
     or (p_verification = 'verified' and p_age_group is null) then
    raise exception 'admin_set_learner: invalid values' using errcode = '22023';
  end if;
  select * into v_old from public.profiles where id = p_user and role in ('student', 'tourist') for update;
  if v_old.id is null then raise exception 'admin_set_learner: no such learner' using errcode = 'P0002'; end if;
  update public.profiles set verification_status = p_verification, level = p_level, age_group = p_age_group where id = p_user;
  insert into public.admin_audit_log (actor_id, action, target_table, target_id, details) values (auth.uid(), 'admin_set_learner',
    'profiles', p_user::text, jsonb_build_object('verification_status', p_verification, 'level', p_level, 'age_group', p_age_group,
      'before', jsonb_build_object('verification_status', v_old.verification_status, 'level', v_old.level, 'age_group', v_old.age_group)));
end $$;

-- A supervised group session at an approved place; the calling admin is its supervisor (R-16, R-17).
create or replace function public.admin_create_session(p_location text, p_starts timestamptz, p_ends timestamptz, p_capacity int)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not private.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  if not exists (select 1 from public.locations where id = p_location and approved) then
    raise exception 'location-not-approved' using errcode = '23514';
  end if;
  if p_starts is null or p_ends is null or p_ends <= p_starts or p_ends <= now() then
    raise exception 'admin_create_session: invalid times' using errcode = '22023';
  end if;
  insert into public.group_sessions (location_id, created_by, starts_at, ends_at, capacity)
    values (p_location, auth.uid(), p_starts, p_ends, coalesce(p_capacity, 10)) returning id into v_id;
  insert into public.admin_audit_log (actor_id, action, target_table, target_id, details) values (auth.uid(), 'admin_create_session',
    'group_sessions', v_id::text, jsonb_build_object('location_id', p_location, 'starts_at', p_starts, 'ends_at', p_ends, 'capacity', p_capacity));
  return v_id;
end $$;

-- Close a scheduled session; its open requests end as cancelled.
create or replace function public.admin_close_session(p_session uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not private.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  update public.group_sessions set status = 'cancelled' where id = p_session and status = 'scheduled';
  if not found then raise exception 'admin_close_session: no open session' using errcode = 'P0002'; end if;
  update public.connection_requests set status = 'cancelled' where session_id = p_session and status in ('pending', 'accepted');
  get diagnostics n = row_count;
  insert into public.admin_audit_log (actor_id, action, target_table, target_id, details) values (auth.uid(), 'admin_close_session',
    'group_sessions', p_session::text, jsonb_build_object('requests_cancelled', n));
end $$;

-- Mark a report reviewed or closed.
create or replace function public.admin_resolve_report(p_report uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_old text;
begin
  if not private.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  if p_status is null or p_status not in ('reviewed', 'closed') then
    raise exception 'admin_resolve_report: invalid status' using errcode = '22023';
  end if;
  select status into v_old from public.reports where id = p_report for update;
  if v_old is null then raise exception 'admin_resolve_report: no such report' using errcode = 'P0002'; end if;
  update public.reports set status = p_status where id = p_report;
  insert into public.admin_audit_log (actor_id, action, target_table, target_id, details) values (auth.uid(), 'admin_resolve_report',
    'reports', p_report::text, jsonb_build_object('status', p_status, 'before', v_old));
end $$;

do $$
declare f text;
begin
  foreach f in array array['public.admin_set_learner(uuid, text, text, text)',
      'public.admin_create_session(text, timestamptz, timestamptz, integer)', 'public.admin_close_session(uuid)',
      'public.admin_resolve_report(uuid, text)'] loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

commit;
