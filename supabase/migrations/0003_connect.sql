-- EchoLạc: Local Guide Connect on the server (PRD §5.9 R-14 to R-18, §9). Run after 0001 and 0002.
-- Safety rules live here (RLS, grants, triggers); lib/connect/policy.js only mirrors them for hints.
-- Real product: the only seed data is the place list. No people, schools or sessions are created.
-- Re-runnable: tables/columns use IF NOT EXISTS, functions CREATE OR REPLACE, policies and triggers
-- are dropped and recreated, the place seed upserts names and keeps `approved`.
-- Clients never write privileged data directly. Privileged writes go through the SECURITY DEFINER
-- functions below (owner postgres) or the service role (Edge Functions, phase 2).
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- 1. Profiles: role, age group, verification, school (R-14, R-17)
alter table public.profiles
  add column if not exists role text not null default 'student'
    check (role in ('student', 'tourist', 'teacher', 'school_admin')),
  add column if not exists age_group text check (age_group in ('adult', 'minor')),
  add column if not exists verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified', 'rejected')),
  add column if not exists school_id uuid,
  add column if not exists school_joined_at timestamptz;
create index if not exists profiles_school on public.profiles (school_id);

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  -- sha256 of a generated invite code (private.new_invite_code); the code itself is never stored.
  invite_code_hash text unique check (invite_code_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
do $$ begin
  alter table public.profiles add constraint profiles_school_fk
    foreign key (school_id) references public.schools (id) on delete set null;
exception when duplicate_object then null; end $$;

-- Clients (roles authenticated/anon) may not grant themselves anything (R-16: missing or
-- unverifiable data counts as not allowed). Service role and the definer functions run as other roles.
create or replace function private.profiles_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated', 'anon') then return coalesce(new, old); end if;
  -- No client delete: delete + re-insert would reset the locks below. Accounts are deleted by the
  -- service role (auth.users), whose cascade also clears the connect rows.
  if tg_op = 'DELETE' then raise exception 'profiles: accounts are deleted by the server' using errcode = '42501'; end if;
  if tg_op = 'INSERT' then
    if new.role not in ('student', 'tourist') or new.verification_status <> 'unverified'
       or new.school_id is not null or new.school_joined_at is not null then
      raise exception 'profiles: privileged columns are set by the school or the server' using errcode = '42501';
    end if;
    return new;
  end if;
  if new.verification_status is distinct from old.verification_status
     or new.school_id is distinct from old.school_id
     or new.school_joined_at is distinct from old.school_joined_at
     -- Self role switch only between student and tourist, before any school or verification.
     or (new.role is distinct from old.role and (new.role not in ('student', 'tourist')
         or old.role not in ('student', 'tourist') or old.verification_status <> 'unverified'
         or old.school_id is not null))
     -- Age group is self-declared until verified, then locked (R-17).
     or (new.age_group is distinct from old.age_group and old.verification_status <> 'unverified') then
    raise exception 'profiles: privileged columns are set by the school or the server' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before insert or update or delete on public.profiles
  for each row execute function private.profiles_guard();
-- lib/cloud never deletes profiles. The trigger still blocks it if 0002 is re-run and grants DELETE.
drop policy if exists own_delete on public.profiles;
revoke delete on public.profiles from authenticated;

-- 2. Places (R-16). Seed = every id in assets/data/locations.js + locations-danang.js; connect-plan §1
-- makes that list the approved set. Re-runs refresh names but keep an `approved` the owner changed.
create table if not exists public.locations (
  id text primary key check (char_length(id) <= 128),
  name_vi text not null check (char_length(name_vi) <= 200),
  name_en text not null check (char_length(name_en) <= 200),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
insert into public.locations (id, name_vi, name_en, approved) values
  ('dragon-bridge', 'Cầu Rồng', 'Dragon Bridge', true),
  ('covered-bridge', 'Chùa Cầu', 'Japanese Covered Bridge', true),
  ('hoi-an-ancient-town', 'Phố cổ Hội An', 'Hoi An Ancient Town', true),
  ('marble-mountains', 'Ngũ Hành Sơn', 'Marble Mountains', true),
  ('han-market', 'Chợ Hàn', 'Han Market', true),
  ('han-river-bridge', 'Cầu Sông Hàn', 'Han River Swing Bridge', true),
  ('apec-park', 'Công viên APEC', 'APEC Park', true),
  ('linh-ung-lady-buddha', 'Tượng Quan Âm - Chùa Linh Ứng', 'Lady Buddha, Linh Ung Pagoda', true),
  ('dragon-carp', 'Tượng Cá chép hoá Rồng', 'Dragon Carp statue', true)
on conflict (id) do update set name_vi = excluded.name_vi, name_en = excluded.name_en;

-- 3. Connect tables. User ids reference auth.users so a deleted account cascades its connect rows.
create table if not exists public.availability (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  location_id text not null references public.locations (id) on delete cascade,
  slot text not null check (slot in ('sat-am', 'sat-pm', 'sun-am', 'sun-pm', 'weekday-pm')),
  created_at timestamptz not null default now(),
  primary key (user_id, location_id, slot)
);

-- The creating teacher is the named supervisor (R-17).
create table if not exists public.group_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  location_id text not null references public.locations (id),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null default 10 check (capacity between 1 and 50),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists group_sessions_school on public.group_sessions (school_id);

-- Written only by school_set_minor_approval() and the service role (guardian consent, phase 3, no email flow yet).
create table if not exists public.minor_approvals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  school_approved_by uuid references auth.users (id) on delete set null,
  school_approved_at timestamptz,
  guardian_consent_at timestamptz,
  guardian_consent_version text check (char_length(guardian_consent_version) <= 32),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists minor_approvals_active on public.minor_approvals (student_id) where revoked_at is null;

create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  tourist_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid references auth.users (id) on delete cascade,
  location_id text not null references public.locations (id),
  mode text not null check (mode in ('one-to-one', 'supervised-group')),
  session_id uuid references public.group_sessions (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled', 'blocked')),
  created_at timestamptz not null default now(),
  check ((mode = 'one-to-one' and student_id is not null and session_id is null)
      or (mode = 'supervised-group' and session_id is not null))
);
create index if not exists connection_requests_tourist on public.connection_requests (tourist_id);
create index if not exists connection_requests_student on public.connection_requests (student_id);
create index if not exists connection_requests_session on public.connection_requests (session_id);

create table if not exists public.blocks (
  blocker_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- reported_id survives the reported account's deletion so moderation evidence stays.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reported_id uuid references auth.users (id) on delete set null,
  request_id uuid references public.connection_requests (id) on delete set null,
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);
create index if not exists reports_reporter on public.reports (reporter_id);

-- No foreign keys: an entry must outlive the account it mentions.
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null check (char_length(action) <= 64),
  target_id text check (char_length(target_id) <= 128),
  details jsonb not null default '{}' check (octet_length(details::text) <= 4096),
  created_at timestamptz not null default now()
);
create index if not exists audit_log_actor on public.audit_log (actor_id, action, created_at);

-- 4. Triggers. They fire for every role, the service role included. The table owner (or a superuser)
-- can still drop or disable a trigger; SQL cannot stop that.
-- audit_log: no role is granted UPDATE/DELETE/TRUNCATE, and these triggers refuse them as well.
create or replace function private.audit_log_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_log is append-only' using errcode = '42501';
end $$;
drop trigger if exists audit_log_immutable on public.audit_log;
create trigger audit_log_immutable before update or delete on public.audit_log
  for each row execute function private.audit_log_immutable();
drop trigger if exists audit_log_no_truncate on public.audit_log;
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function private.audit_log_immutable();

-- Defence in depth under the phase-2 Edge Function (R-16, R-17). Fails closed: every party must be a
-- verified profile with the right role; a minor needs a supervised group session of their own school
-- and a live approval (school approved, guardian consent, not revoked). Declining or cancelling always works.
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
  end if;
  if new.mode = 'one-to-one' then
    if s.age_group is distinct from 'adult' then
      raise exception 'minor-one-to-one-blocked' using errcode = '23514';
    end if;
    return new;
  end if;
  select * into g from public.group_sessions where id = new.session_id;
  if g.id is null or g.status is distinct from 'scheduled' or g.location_id is distinct from new.location_id
     or (new.student_id is not null and s.school_id is distinct from g.school_id)
     or not exists (select 1 from public.profiles t where t.id = g.created_by and t.role = 'teacher'
                    and t.verification_status = 'verified' and t.school_id = g.school_id) then
    raise exception 'session-invalid' using errcode = '23514';
  end if;
  if s.age_group = 'minor' and not exists (select 1 from public.minor_approvals a
      where a.student_id = s.id and a.school_id = s.school_id and a.revoked_at is null
        and a.school_approved_at is not null
        and a.guardian_consent_at is not null) then
    raise exception 'student-awaiting-approval' using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists connection_requests_guard on public.connection_requests;
create trigger connection_requests_guard before insert or update on public.connection_requests
  for each row execute function private.connection_requests_guard();

-- 5. Helpers and functions
-- True when the caller is a verified member of p_school with one of p_roles. Definer, so policies can
-- call it without recursing into the RLS of profiles.
create or replace function private.has_school_role(p_school uuid, p_roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.school_id = p_school
    and p.role = any (p_roles) and p.verification_status = 'verified');
$$;

create or replace function private.invite_code_hash(p_code text) returns text
language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(lower(btrim(p_code)), 'UTF8')), 'hex');
$$;

-- Codes are generated, never chosen: 32 hex chars from gen_random_uuid() (122 random bits), so
-- guessing stays infeasible even with many anonymous accounts. Returns the code once; stores the hash.
-- Owner in the SQL Editor: select private.new_invite_code('<school id>');
create or replace function private.new_invite_code(p_school uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_code text := replace(gen_random_uuid()::text, '-', '');
begin
  update public.schools set invite_code_hash = private.invite_code_hash(v_code) where id = p_school;
  if not found then raise exception 'new_invite_code: no such school' using errcode = '42501'; end if;
  return v_code;
end $$;

-- A verified school_admin replaces the code of their school; the old code stops working.
create or replace function public.school_rotate_invite_code(p_school uuid) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_school_role(p_school, array['school_admin']) then
    raise exception 'school_rotate_invite_code denied' using errcode = '42501';
  end if;
  insert into public.audit_log (actor_id, action, target_id) values (auth.uid(), 'school_rotate_invite_code', p_school::text);
  return private.new_invite_code(p_school);
end $$;

-- A student joins a school with its invite code. Joining (or switching) resets verification and
-- revokes active minor approvals: the new school verifies and approves again (R-17).
-- A wrong code returns null and is logged; 5 wrong codes per user per hour lock the function.
-- The per-user cap alone does not stop many anonymous accounts; the code entropy does.
create or replace function public.join_school(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_current uuid;
  v_school uuid;
begin
  select role, school_id into v_role, v_current from public.profiles where id = v_uid for update;
  if v_uid is null or v_role is distinct from 'student' then
    raise exception 'join_school denied' using errcode = '42501';
  end if;
  if (select count(*) from public.audit_log where actor_id = v_uid and action = 'join_school_failed'
      and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'join_school: too many wrong codes, try again later' using errcode = '42501';
  end if;
  select id into v_school from public.schools where invite_code_hash = private.invite_code_hash(p_code);
  if v_school is null then
    insert into public.audit_log (actor_id, action) values (v_uid, 'join_school_failed');
    return null;
  end if;
  if v_current is distinct from v_school then
    update public.profiles set school_id = v_school, school_joined_at = now(), verification_status = 'unverified'
      where id = v_uid;
    update public.minor_approvals set revoked_at = now() where student_id = v_uid and revoked_at is null;
    insert into public.audit_log (actor_id, action, target_id) values (v_uid, 'join_school', v_school::text);
  end if;
  return v_school;
end $$;

-- Admin console list: only the fields it needs, for a verified school_admin of that school.
-- No birth_year, place_id, guardian_consent or other profile columns.
create or replace function public.school_members(p_school uuid)
returns table (id uuid, display_name text, role text, age_group text, verification_status text, joined_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id, p.display_name, p.role, p.age_group, p.verification_status, p.school_joined_at
  from public.profiles p
  where p.school_id = p_school and private.has_school_role(p_school, array['school_admin']);
$$;

-- A verified school_admin sets role, verification and age group of a member of the same school.
-- Teachers and admins must be verified adults (R-17 supervisor).
create or replace function public.school_set_member(p_user uuid, p_role text, p_verification text, p_age_group text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_school uuid;
begin
  select school_id into v_school from public.profiles where id = p_user for update;
  if v_school is null or not private.has_school_role(v_school, array['school_admin'])
     or p_role is null or p_role not in ('student', 'teacher', 'school_admin')
     or (p_role <> 'student' and (p_verification is distinct from 'verified' or p_age_group is distinct from 'adult')) then
    raise exception 'school_set_member denied' using errcode = '42501';
  end if;
  update public.profiles set role = p_role, verification_status = p_verification, age_group = p_age_group
    where id = p_user;
  insert into public.audit_log (actor_id, action, target_id, details) values (auth.uid(), 'school_set_member',
    p_user::text, jsonb_build_object('role', p_role, 'verification_status', p_verification, 'age_group', p_age_group));
end $$;

-- A verified school_admin records or revokes the school approval of a minor in the same school.
-- Guardian consent columns are written only by the service role (phase 3, no email flow yet).
create or replace function public.school_set_minor_approval(p_student uuid, p_approved boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_school uuid; v_age text;
begin
  select school_id, age_group into v_school, v_age from public.profiles where id = p_student for update;
  if v_school is null or v_age is distinct from 'minor' or p_approved is null
     or not private.has_school_role(v_school, array['school_admin']) then
    raise exception 'school_set_minor_approval denied' using errcode = '42501';
  end if;
  update public.minor_approvals set revoked_at = now()
    where student_id = p_student and revoked_at is null and (not p_approved or school_id <> v_school);
  if p_approved then
    update public.minor_approvals set school_approved_by = auth.uid(), school_approved_at = now()
      where student_id = p_student and revoked_at is null;
    if not found then
      insert into public.minor_approvals (student_id, school_id, school_approved_by, school_approved_at)
        values (p_student, v_school, auth.uid(), now());
    end if;
  end if;
  insert into public.audit_log (actor_id, action, target_id, details) values (auth.uid(),
    'school_set_minor_approval', p_student::text, jsonb_build_object('approved', p_approved));
end $$;

-- What another user may see of a person: verified adults only, safe fields only. Minors and anyone
-- with an unknown age never appear (R-17). No email, phone, birth year, place or coordinates exist here.
create or replace function public.safe_profiles(p_ids uuid[])
returns table (id uuid, display_name text, level text, role text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.display_name, p.level, p.role from public.profiles p
  where (select auth.uid()) is not null and cardinality(p_ids) <= 100 and p.id = any (p_ids)
    and p.age_group = 'adult' and p.verification_status = 'verified';
$$;

-- 6. Grants (0002 style: revoke everything, grant only what each role needs)
do $$
declare t text;
begin
  foreach t in array array['schools', 'locations', 'availability', 'group_sessions', 'minor_approvals',
                           'connection_requests', 'blocks', 'reports', 'audit_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all privileges on table public.%I from public, anon, authenticated, service_role', t);
    if t <> 'audit_log' then
      execute format('grant select, insert, update, delete on table public.%I to service_role', t);
    end if;
  end loop;
end $$;
-- Phase-2 Edge Functions read profiles as the service role; new projects grant it nothing by default.
revoke all privileges on table public.profiles from service_role;
grant select, insert, update, delete on table public.profiles to service_role;
-- Invite codes are issued only through private.new_invite_code, never written as a raw hash.
revoke insert, update on public.schools from service_role;
grant insert (id, name, created_at), update (name) on public.schools to service_role;
-- Service role keeps consent evidence and the audit trail: no delete, and no update on audit_log.
revoke delete on public.minor_approvals from service_role;
grant select, insert on public.audit_log to service_role;
grant select (id, name, created_at) on public.schools to authenticated; -- never invite_code_hash
grant select on public.locations, public.minor_approvals, public.connection_requests to authenticated;
grant select, insert, delete on public.availability, public.blocks to authenticated;
grant select, insert, update on public.group_sessions to authenticated;
grant select, insert on public.reports to authenticated;

do $$
declare f text;
begin
  foreach f in array array['private.profiles_guard()', 'private.audit_log_immutable()',
      'private.connection_requests_guard()', 'private.invite_code_hash(text)', 'private.new_invite_code(uuid)',
      'private.has_school_role(uuid, text[])', 'public.join_school(text)', 'public.school_rotate_invite_code(uuid)',
      'public.school_members(uuid)', 'public.school_set_member(uuid, text, text, text)',
      'public.school_set_minor_approval(uuid, boolean)', 'public.safe_profiles(uuid[])'] loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f);
  end loop;
end $$;
grant execute on function private.has_school_role(uuid, text[]) to authenticated, service_role;
grant execute on function private.new_invite_code(uuid) to service_role;
grant execute on function public.join_school(text), public.school_rotate_invite_code(uuid),
  public.school_members(uuid), public.school_set_member(uuid, text, text, text),
  public.school_set_minor_approval(uuid, boolean), public.safe_profiles(uuid[]) to authenticated;

-- 7. Policies. `(select auth.uid())` is evaluated once per statement (Supabase RLS guide).
-- School admins read members through school_members(), not through a row policy on profiles.
drop policy if exists school_admin_select on public.profiles;

drop policy if exists member_select on public.schools;
create policy member_select on public.schools for select to authenticated
  using (id = (select p.school_id from public.profiles p where p.id = (select auth.uid())));

drop policy if exists read_all on public.locations;
create policy read_all on public.locations for select to authenticated using (true);

drop policy if exists own_select on public.availability;
drop policy if exists own_insert on public.availability;
drop policy if exists own_delete on public.availability;
create policy own_select on public.availability for select to authenticated using (user_id = (select auth.uid()));
create policy own_insert on public.availability for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.locations l where l.id = location_id and l.approved));
create policy own_delete on public.availability for delete to authenticated using (user_id = (select auth.uid()));

-- Only verified teachers of the school create or edit sessions, only at approved places (R-17, R-16).
-- Session times are visible to verified members of that school, never to tourists.
drop policy if exists member_select on public.group_sessions;
drop policy if exists teacher_insert on public.group_sessions;
drop policy if exists teacher_update on public.group_sessions;
create policy member_select on public.group_sessions for select to authenticated
  using (private.has_school_role(school_id, array['student', 'teacher', 'school_admin']));
create policy teacher_insert on public.group_sessions for insert to authenticated with check (
  created_by = (select auth.uid()) and private.has_school_role(school_id, array['teacher'])
  and exists (select 1 from public.locations l where l.id = location_id and l.approved));
create policy teacher_update on public.group_sessions for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()) and private.has_school_role(school_id, array['teacher'])
    and exists (select 1 from public.locations l where l.id = location_id and l.approved));

drop policy if exists own_or_admin_select on public.minor_approvals;
create policy own_or_admin_select on public.minor_approvals for select to authenticated
  using (student_id = (select auth.uid()) or private.has_school_role(school_id, array['school_admin']));

-- Read only for the two parties; writes only through the service role (phase-2 Edge Functions).
drop policy if exists party_select on public.connection_requests;
create policy party_select on public.connection_requests for select to authenticated
  using (tourist_id = (select auth.uid()) or student_id = (select auth.uid()));

drop policy if exists own_select on public.blocks;
drop policy if exists own_insert on public.blocks;
drop policy if exists own_delete on public.blocks;
create policy own_select on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy own_insert on public.blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy own_delete on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));

drop policy if exists own_select on public.reports;
drop policy if exists own_insert on public.reports;
create policy own_select on public.reports for select to authenticated using (reporter_id = (select auth.uid()));
create policy own_insert on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open');

commit;
