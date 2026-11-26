-- EchoLạc: Connect hardening after the phase-2 review (PRD R-16, R-17). Run after 0003 (and 0004).
-- No DROP statements (the Supabase connector refuses them). Re-runnable: IF NOT EXISTS and OR REPLACE only.
begin;

-- 1. One open (pending or accepted) request per tourist, session and student; a missing student counts
-- as one value. Closes the check-then-insert race in the connect-request Edge Function.
create unique index if not exists connection_requests_open_unique on public.connection_requests
  (tourist_id, session_id, coalesce(student_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status in ('pending', 'accepted');

-- 2. profiles_guard from 0003, plus: level is self-declared until verified, then server-owned (minimum A2).
-- lib/cloud/sync.js sends level with every profile save, so a client change is ignored, not refused:
-- refusing would fail the whole row's sync. Only the service role (or a definer function) changes it.
create or replace function private.profiles_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated', 'anon') then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then raise exception 'profiles: accounts are deleted by the server' using errcode = '42501'; end if;
  if tg_op = 'INSERT' then
    if new.role not in ('student', 'tourist') or new.verification_status <> 'unverified'
       or new.school_id is not null or new.school_joined_at is not null then
      raise exception 'profiles: privileged columns are set by the school or the server' using errcode = '42501';
    end if;
    return new;
  end if;
  if old.verification_status <> 'unverified' then new.level := old.level; end if;
  if new.verification_status is distinct from old.verification_status
     or new.school_id is distinct from old.school_id
     or new.school_joined_at is distinct from old.school_joined_at
     or (new.role is distinct from old.role and (new.role not in ('student', 'tourist')
         or old.role not in ('student', 'tourist') or old.verification_status <> 'unverified'
         or old.school_id is not null))
     or (new.age_group is distinct from old.age_group and old.verification_status <> 'unverified') then
    raise exception 'profiles: privileged columns are set by the school or the server' using errcode = '42501';
  end if;
  return new;
end $$;

-- 3. connection_requests_guard from 0003, plus: a block either way stops the pair, and an accept
-- needs a free seat (distinct other tourists already accepted < capacity). Messages are reason codes.
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
  if new.status = 'accepted' and (select count(distinct r.tourist_id) from public.connection_requests r
      where r.session_id = g.id and r.status = 'accepted' and r.id <> new.id and r.tourist_id <> new.tourist_id) >= g.capacity then
    raise exception 'session-full' using errcode = '23514';
  end if;
  return new;
end $$;

-- 4. A new block ends the open requests between the two users. 'cancelled', not 'blocked', so the
-- blocked person is not told about the block.
create or replace function private.blocks_end_requests() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.connection_requests set status = 'cancelled'
    where status in ('pending', 'accepted')
      and ((tourist_id = new.blocker_id and student_id = new.blocked_id)
        or (tourist_id = new.blocked_id and student_id = new.blocker_id));
  return new;
end $$;
create or replace trigger blocks_end_requests after insert on public.blocks
  for each row execute function private.blocks_end_requests();
revoke all on function private.blocks_end_requests() from public, anon, authenticated, service_role;

commit;
