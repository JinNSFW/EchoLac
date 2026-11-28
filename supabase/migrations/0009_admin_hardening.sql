-- EchoLạc: review fixes for 0008 (27/11/2026 Sonnet review). No DROP statements; re-runnable (OR REPLACE).
-- 1. An admin session counts only for 12 hours after sign-in, so a tab left open does not stay admin until expiry.
-- 2. admin_set_learner and admin_create_session reject bad values with 22023 instead of raw constraint errors,
--    and sessions cannot be scheduled more than a year ahead.

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin'
      and (select auth.jwt()) ->> 'aal' = 'aal2', false)
    and exists (select 1 from auth.users u join auth.sessions s on s.user_id = u.id
      where u.id = (select auth.uid())
        and u.raw_app_meta_data ->> 'role' = 'admin' and s.aal = 'aal2'
        and s.id = ((select auth.jwt()) ->> 'session_id')::uuid
        and s.created_at > now() - interval '12 hours'
        and (s.not_after is null or s.not_after > now()));
$$;

create or replace function public.admin_set_learner(p_user uuid, p_verification text, p_level text, p_age_group text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_old public.profiles;
begin
  if not private.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  if p_verification is null or p_verification not in ('unverified', 'verified', 'rejected')
     or (p_verification = 'verified' and p_age_group is null)
     or (p_level is not null and p_level not in ('A1', 'A2', 'B1', 'B2', 'C1'))
     or (p_age_group is not null and p_age_group not in ('adult', 'minor')) then
    raise exception 'admin_set_learner: invalid values' using errcode = '22023';
  end if;
  select * into v_old from public.profiles where id = p_user and role in ('student', 'tourist') for update;
  if v_old.id is null then raise exception 'admin_set_learner: no such learner' using errcode = 'P0002'; end if;
  update public.profiles set verification_status = p_verification, level = p_level, age_group = p_age_group where id = p_user;
  insert into public.admin_audit_log (actor_id, action, target_table, target_id, details) values (auth.uid(), 'admin_set_learner',
    'profiles', p_user::text, jsonb_build_object('verification_status', p_verification, 'level', p_level, 'age_group', p_age_group,
      'before', jsonb_build_object('verification_status', v_old.verification_status, 'level', v_old.level, 'age_group', v_old.age_group)));
end $$;

create or replace function public.admin_create_session(p_location text, p_starts timestamptz, p_ends timestamptz, p_capacity int)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not private.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  if not exists (select 1 from public.locations where id = p_location and approved) then
    raise exception 'location-not-approved' using errcode = '23514';
  end if;
  if p_starts is null or p_ends is null or p_ends <= p_starts or p_ends <= now()
     or p_starts > now() + interval '1 year' or coalesce(p_capacity, 10) not between 1 and 50 then
    raise exception 'admin_create_session: invalid times or capacity' using errcode = '22023';
  end if;
  insert into public.group_sessions (location_id, created_by, starts_at, ends_at, capacity)
    values (p_location, auth.uid(), p_starts, p_ends, coalesce(p_capacity, 10)) returning id into v_id;
  insert into public.admin_audit_log (actor_id, action, target_table, target_id, details) values (auth.uid(), 'admin_create_session',
    'group_sessions', v_id::text, jsonb_build_object('location_id', p_location, 'starts_at', p_starts, 'ends_at', p_ends, 'capacity', p_capacity));
  return v_id;
end $$;
