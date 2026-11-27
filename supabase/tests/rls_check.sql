-- RLS check after migrations 0001 through 0008. Run on a disposable local database (it inserts test rows into auth.users and auth.sessions).
-- Everything happens in one transaction that is rolled back: no test rows stay behind.
-- Pass = the result row "RLS check passed". Any failure raises an exception naming the step.
-- The quota test temporarily sets today's shared counter to exercise both limits.
begin;

-- Check effective privileges, including grants inherited from PUBLIC or older project defaults.
do $$
declare t text; p text;
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and cmd in ('ALL', 'DELETE')
             and qual is distinct from 'false') then
    raise exception 'FAIL: client profile DELETE policy remains (apply migration 0006)';
  end if;
  foreach t in array array['profiles', 'unit_progress', 'attempts', 'error_items', 'srs_cards'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass) then
      raise exception 'FAIL: RLS disabled on %', t;
    end if;
    foreach p in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
      -- 0003 removes client DELETE on profiles (accounts are deleted by the server).
      if has_table_privilege('authenticated', 'public.' || t, p) is distinct from (t <> 'profiles' or p <> 'DELETE') then
        raise exception 'FAIL: wrong % privilege for authenticated on %', p, t;
      end if;
      if has_table_privilege('anon', 'public.' || t, p) then
        raise exception 'FAIL: anon has % on %', p, t;
      end if;
    end loop;
    foreach p in array array['TRUNCATE', 'REFERENCES', 'TRIGGER'] loop
      if has_table_privilege('authenticated', 'public.' || t, p) or has_table_privilege('anon', 'public.' || t, p) then
        raise exception 'FAIL: excess % privilege on % (apply migration 0002)', p, t;
      end if;
    end loop;
  end loop;
end $$;

insert into auth.users (id, aud, role, is_anonymous) values
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', true),
  ('00000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated', true);

-- Act as user A (anonymous, role authenticated)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","is_anonymous":true}', true);
insert into public.profiles (id, display_name) values ('00000000-0000-0000-0000-0000000000a1', 'A');
insert into public.error_items (id, category, source) values ('e1', 'th_sound', 'pron');
insert into public.unit_progress (unit_id) values ('U01');
insert into public.attempts (item_id, engine) values ('item-1', 'none');
insert into public.srs_cards (item_id) values ('item-1');

-- Positive owner reads/updates, and attempts to transfer ownership, on all five tables.
do $$
declare t text; k text; n int;
begin
  foreach t in array array['profiles', 'unit_progress', 'attempts', 'error_items', 'srs_cards'] loop
    k := case t when 'profiles' then 'id' else 'user_id' end;
    execute format('select count(*) from public.%I', t) into n;
    if n <> 1 then raise exception 'FAIL: A cannot read own row on %', t; end if;
    execute format('update public.%I set %I = auth.uid()', t, k);
    get diagnostics n = row_count;
    if n <> 1 then raise exception 'FAIL: A cannot update own row on %', t; end if;
    begin
      execute format('update public.%I set %I = %L::uuid', t, k, '00000000-0000-0000-0000-0000000000b2');
      raise exception 'FAIL: A transferred ownership on %', t;
    exception when insufficient_privilege then null; end;
  end loop;
end $$;

do $$ begin
  -- A cannot write a row owned by B
  begin
    insert into public.error_items (id, user_id, category, source) values ('e2', '00000000-0000-0000-0000-0000000000b2', 'x', 'pron');
    raise exception 'FAIL: A inserted a row for B';
  exception when insufficient_privilege then null; end;
end $$;

-- Act as user B: sees nothing of A, cannot change A's rows
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated","is_anonymous":true}', true);
do $$
declare n int; t text;
begin
  foreach t in array array['profiles', 'unit_progress', 'attempts', 'error_items', 'srs_cards'] loop
    execute format('select count(*) from public.%I', t) into n;
    if n <> 0 then raise exception 'FAIL: B sees A rows on %', t; end if;
    execute format('update public.%I set %I = %I', t,
      case t when 'profiles' then 'id' else 'user_id' end,
      case t when 'profiles' then 'id' else 'user_id' end);
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: B updated A rows on %', t; end if;
    continue when t = 'profiles'; -- no client DELETE on profiles since 0003, checked below
    execute format('delete from public.%I', t);
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: B deleted A rows on %', t; end if;
  end loop;
  select count(*) into n from public.profiles; if n <> 0 then raise exception 'FAIL: B sees % profile rows', n; end if;
  select count(*) into n from public.error_items; if n <> 0 then raise exception 'FAIL: B sees % error rows', n; end if;
  update public.error_items set best = 99 where id = 'e1'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B updated A''s row'; end if;
  begin
    delete from public.profiles;
    raise exception 'FAIL: B deleted a profile';
  exception when insufficient_privilege then null; end;
end $$;

-- B can create and remove their own row on every table without affecting A (profiles: create only).
insert into public.profiles (display_name) values ('B');
insert into public.error_items (id, category, source) values ('e1', 'th_sound', 'pron');
insert into public.unit_progress (unit_id) values ('U01');
insert into public.attempts (item_id, engine) values ('item-1', 'none');
insert into public.srs_cards (item_id) values ('item-1');
do $$
declare t text; n int;
begin
  foreach t in array array['profiles', 'unit_progress', 'attempts', 'error_items', 'srs_cards'] loop
    execute format('select count(*) from public.%I', t) into n;
    if n <> 1 then raise exception 'FAIL: B cannot read own row on %', t; end if;
    continue when t = 'profiles';
    execute format('delete from public.%I', t);
    get diagnostics n = row_count;
    if n <> 1 then raise exception 'FAIL: B cannot delete own row on %', t; end if;
  end loop;
end $$;

-- No session (role anon) gets nothing at all
reset role;
set local role anon;
do $$ begin
  begin
    perform 1 from public.profiles;
    raise exception 'FAIL: anon can read profiles';
  exception when insufficient_privilege then null; end;
end $$;

-- ===== Local Guide Connect and admins (0003, 0005, 0008; PRD R-14 to R-18) =====
reset role;
-- act: switch role and JWT claims (extra adds claims such as aal, session_id, app_metadata). deny: the statement
-- must fail with that SQLSTATE (42501 = no privilege / RLS / guard, 23514 = check). expect: the query returns that many rows.
create function pg_temp.act(r text, sub text default null, extra jsonb default '{}') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', (jsonb_build_object('sub', sub, 'role', r) || extra)::text, true);
  perform set_config('role', r, true);
end $$;
-- admin: a JWT that claims admin; private.is_admin() decides from auth.users and auth.sessions whether it is one.
create function pg_temp.admin(sub text, sess text, aal text default 'aal2') returns void language plpgsql as $$
begin
  perform pg_temp.act('authenticated', sub, jsonb_build_object('aal', aal, 'session_id', sess, 'app_metadata', jsonb_build_object('role', 'admin')));
end $$;
create function pg_temp.deny(q text, label text, state text default '42501', msg text default null) returns void language plpgsql as $$
begin
  begin
    execute q;
  exception when others then
    if sqlstate = state and (msg is null or sqlerrm = msg) then return; end if;
    raise exception 'FAIL: % (got % %)', label, sqlstate, sqlerrm;
  end;
  raise exception 'FAIL: %', label;
end $$;
create function pg_temp.expect(q text, want int, label text) returns void language plpgsql as $$
declare got int;
begin
  execute 'select count(*) from (' || q || ') x' into got;
  if got <> want then raise exception 'FAIL: % (got % rows, want %)', label, got, want; end if;
end $$;
-- not_admin: the current identity reads no one else's connect rows, no session and no audit row, and every admin
-- RPC and audit write fails. anon is refused by privilege, signed-in non-admins by RLS and the RPC checks.
create function pg_temp.not_admin(who text) returns void language plpgsql as $$
declare q text;
begin
  foreach q in array array[
      'select 1 from public.profiles where id is distinct from auth.uid()',
      'select 1 from public.group_sessions',
      'select 1 from public.connection_requests where tourist_id is distinct from auth.uid() and student_id is distinct from auth.uid()',
      'select 1 from public.reports where reporter_id is distinct from auth.uid()',
      'select 1 from public.blocks where blocker_id is distinct from auth.uid()',
      'select 1 from public.admin_audit_log'] loop
    if current_user = 'anon' then perform pg_temp.deny(q, who || ': ' || q);
    else perform pg_temp.expect(q, 0, who || ': ' || q); end if;
  end loop;
  foreach q in array array[
      $q$select public.admin_set_learner('00000000-0000-0000-0000-0000000000d3', 'verified', 'C1', 'adult')$q$,
      $q$select public.admin_create_session('dragon-bridge', now() + interval '3 days', now() + interval '3 days 2 hours', 5)$q$,
      format('select public.admin_close_session(%L)', current_setting('test.s2')),
      $q$select public.admin_resolve_report('00000000-0000-0000-0000-0000000000b9', 'closed')$q$,
      $q$insert into public.admin_audit_log (actor_id, action) values (gen_random_uuid(), 'forged')$q$,
      $q$update public.admin_audit_log set action = 'rewritten'$q$,
      $q$delete from public.admin_audit_log$q$] loop
    perform pg_temp.deny(q, who || ': ' || q);
  end loop;
end $$;

select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000a1');
-- display_name carries no contact details (0006_audit_fixes CHECK), checked on unverified user A.
select pg_temp.deny($q$update public.profiles set display_name = 'Lan 0901 234 567'$q$, 'phone number in display_name', '23514');
select pg_temp.deny($q$update public.profiles set display_name = '090.123.4'$q$, 'six digits with dots in display_name', '23514');
select pg_temp.deny($q$update public.profiles set display_name = 'lan@mail'$q$, 'at sign in display_name', '23514');
select pg_temp.deny($q$update public.profiles set display_name = 'https://x.y/lan'$q$, 'link in display_name', '23514');
select pg_temp.deny($q$update public.profiles set display_name = 'fb.com/lan'$q$, 'bare domain in display_name', '23514');
update public.profiles set display_name = 'Lan Nguyen 2009';
select pg_temp.expect($q$select 1 from public.profiles where display_name = 'Lan Nguyen 2009'$q$, 1, 'ordinary name with a year saves');
update public.profiles set display_name = 'A';
select pg_temp.expect($q$select 1 from pg_constraint where conname = 'profiles_display_name_safe' and convalidated$q$, 1, 'display_name CHECK validated');
select pg_temp.expect($q$select 1 from pg_constraint where conname = 'profiles_role_learner' and convalidated$q$, 1, 'learner-only role CHECK validated');
select pg_temp.expect($q$select 1 from pg_policies where tablename = 'profiles' and policyname = 'own_delete' and qual is distinct from 'false'$q$, 0, 'own_delete neutralised');
reset role;

-- Privileges: anon gets nothing; clients cannot write server-owned tables; no TRUNCATE anywhere;
-- retired school tables and RPCs are unreachable; admin RPCs are never callable by anon (0008).
do $$
declare t text; p text; f text;
begin
  foreach t in array array['schools', 'locations', 'availability', 'group_sessions', 'minor_approvals',
                           'connection_requests', 'blocks', 'reports', 'audit_log', 'admin_audit_log'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass) then
      raise exception 'FAIL: RLS disabled on %', t;
    end if;
    foreach p in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] loop
      if has_table_privilege('anon', 'public.' || t, p) then raise exception 'FAIL: anon has % on %', p, t; end if;
      if p in ('TRUNCATE', 'REFERENCES', 'TRIGGER') and (has_table_privilege('authenticated', 'public.' || t, p)
          or has_table_privilege('service_role', 'public.' || t, p)) then
        raise exception 'FAIL: excess % privilege on %', p, t;
      end if;
    end loop;
  end loop;
  -- has_any_column_privilege also sees column grants (0003 granted columns of schools).
  foreach t in array array['schools', 'minor_approvals', 'admin_audit_log'] loop
    if has_any_column_privilege('service_role', 'public.' || t, 'SELECT') or has_any_column_privilege('service_role', 'public.' || t, 'INSERT')
       or has_any_column_privilege('service_role', 'public.' || t, 'UPDATE') or has_table_privilege('service_role', 'public.' || t, 'DELETE') then
      raise exception 'FAIL: service role can reach %', t;
    end if;
  end loop;
  foreach t in array array['schools', 'locations', 'group_sessions', 'minor_approvals', 'connection_requests', 'audit_log', 'admin_audit_log'] loop
    if has_any_column_privilege('authenticated', 'public.' || t, 'INSERT') or has_any_column_privilege('authenticated', 'public.' || t, 'UPDATE')
       or has_table_privilege('authenticated', 'public.' || t, 'DELETE') then
      raise exception 'FAIL: clients can write %', t;
    end if;
  end loop;
  foreach t in array array['schools', 'minor_approvals', 'audit_log'] loop
    if has_any_column_privilege('authenticated', 'public.' || t, 'SELECT') then raise exception 'FAIL: clients can read %', t; end if;
  end loop;
  if has_table_privilege('service_role', 'public.audit_log', 'UPDATE') or has_table_privilege('service_role', 'public.audit_log', 'DELETE')
     or has_table_privilege('service_role', 'public.minor_approvals', 'DELETE') then
    raise exception 'FAIL: service role can rewrite audit_log or delete consent evidence';
  end if;
  foreach f in array array['public.join_school(text)', 'public.school_rotate_invite_code(uuid)', 'public.school_members(uuid)',
      'public.school_set_member(uuid, text, text, text)', 'public.school_set_minor_approval(uuid, boolean)',
      'private.has_school_role(uuid, text[])', 'private.new_invite_code(uuid)'] loop
    if has_function_privilege('anon', f, 'EXECUTE') or has_function_privilege('authenticated', f, 'EXECUTE')
       or has_function_privilege('service_role', f, 'EXECUTE') then
      raise exception 'FAIL: retired % is still callable', f;
    end if;
  end loop;
  foreach f in array array['private.is_admin()', 'public.is_admin_account(uuid)', 'public.admin_set_learner(uuid, text, text, text)',
      'public.admin_create_session(text, timestamptz, timestamptz, integer)', 'public.admin_close_session(uuid)',
      'public.admin_resolve_report(uuid, text)', 'public.safe_profiles(uuid[])'] loop
    if has_function_privilege('anon', f, 'EXECUTE') then raise exception 'FAIL: anon can execute %', f; end if;
  end loop;
  if has_function_privilege('authenticated', 'public.is_admin_account(uuid)', 'EXECUTE') then
    raise exception 'FAIL: clients can probe which accounts are admins';
  end if;
  if has_function_privilege('authenticated', 'private.blocks_end_requests()', 'EXECUTE') then
    raise exception 'FAIL: clients can execute blocks_end_requests';
  end if;
  -- Admin identity is app_metadata only: no policy or function reads user_metadata.
  if exists (select 1 from pg_policies where schemaname in ('public', 'private') and (qual ~* 'user_meta' or with_check ~* 'user_meta'))
     or exists (select 1 from pg_proc where pronamespace in ('public'::regnamespace, 'private'::regnamespace) and prosrc ~* 'user_meta') then
    raise exception 'FAIL: user_metadata used for authorization';
  end if;
end $$;

-- Identities (rolled back): tourists T (c1) and T2 (c2), minor student M (d1), adult students S (d2) and U (d3),
-- admins A (e1, MFA session f1 at aal2) and B (e2, password-only session f2 at aal1); c1 also has an aal2 session f3.
-- Admin rights live in raw_app_meta_data, which only the owner sets (docs/supabase-setup.md).
insert into auth.users (id, aud, role, raw_app_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-0000000000c2', 'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-0000000000d1', 'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-0000000000d2', 'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-0000000000d3', 'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-0000000000e1', 'authenticated', 'authenticated', '{"role": "admin"}'),
  ('00000000-0000-0000-0000-0000000000e2', 'authenticated', 'authenticated', '{"role": "admin"}');
insert into auth.sessions (id, user_id, aal) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'aal2'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e2', 'aal1'),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000c1', 'aal2');
update public.locations set approved = true where id = 'dragon-bridge';
update public.locations set approved = false where id = 'han-market';
select set_config('test.s2', '00000000-0000-0000-0000-0000000000a8', true); -- replaced once the admin creates it

-- Nobody self-grants role, verification or school, at insert or update (R-14, R-16).
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c1');
select pg_temp.deny($q$insert into public.profiles (display_name, role) values ('T', 'school_admin')$q$, 'self-insert as school_admin');
select pg_temp.deny($q$insert into public.profiles (display_name, role) values ('T', 'admin')$q$, 'self-insert as admin');
select pg_temp.deny($q$insert into public.profiles (display_name, role, verification_status) values ('T', 'tourist', 'verified')$q$, 'self-insert verified');
select pg_temp.deny($q$insert into public.profiles (display_name, school_id) values ('T', gen_random_uuid())$q$, 'self-insert into a school');
insert into public.profiles (display_name, role, age_group) values ('T', 'tourist', 'adult');
-- No client path to admin rights: auth.users is not writable, and user_metadata or a stale claim grants nothing.
select pg_temp.deny($q$update auth.users set raw_app_meta_data = '{"role": "admin"}' where id = auth.uid()$q$, 'learner sets own app_metadata');
select pg_temp.deny($q$update auth.users set raw_user_meta_data = '{"role": "admin"}' where id = auth.uid()$q$, 'learner sets own user_metadata');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c1',
  '{"aal": "aal2", "session_id": "00000000-0000-0000-0000-0000000000f3", "user_metadata": {"role": "admin"}}');
select pg_temp.expect($q$select 1 where private.is_admin()$q$, 0, 'user_metadata role admin is not an admin');
select pg_temp.admin('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000f3');
select pg_temp.expect($q$select 1 where private.is_admin()$q$, 0, 'admin claim without the server-side role (stale or forged JWT)');
select pg_temp.deny($q$select public.admin_set_learner(auth.uid(), 'verified', 'B1', 'adult')$q$, 'learner with an admin claim verifies self');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c2');
insert into public.profiles (display_name, role, age_group) values ('T2', 'tourist', 'adult');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d2');
insert into public.profiles (display_name, age_group, level) values ('S', 'adult', 'B1');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d3');
insert into public.profiles (display_name, age_group, level) values ('U', 'adult', 'B1');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d1');
insert into public.profiles (display_name, age_group) values ('M', 'minor');
select pg_temp.deny($q$update public.profiles set verification_status = 'verified'$q$, 'self-grant verification_status');
select pg_temp.deny($q$update public.profiles set role = 'teacher'$q$, 'self-grant teacher');
select pg_temp.deny($q$update public.profiles set role = 'school_admin'$q$, 'self-grant school_admin');
select pg_temp.deny($q$update public.profiles set role = 'admin'$q$, 'self-grant admin');
select pg_temp.deny($q$update public.profiles set school_id = gen_random_uuid()$q$, 'self-set school_id');
select pg_temp.deny($q$select public.join_school('any-code')$q$, 'retired join_school');
select pg_temp.deny($q$insert into public.group_sessions (location_id, starts_at, ends_at) values ('dragon-bridge', now(), now() + interval '2 hours')$q$, 'client creates a session');
-- Allowed before verification: self-declared age group, and switching student <-> tourist.
update public.profiles set age_group = 'adult';
update public.profiles set age_group = 'minor', role = 'tourist';
update public.profiles set role = 'student', level = 'A2';
select pg_temp.expect($q$select 1 from public.profiles where role = 'student' and age_group = 'minor' and verification_status = 'unverified' and level = 'A2'$q$, 1, 'M can edit own unprivileged columns');

-- Admin A (aal2) verifies learners through the RPC (R-14, R-17); bad values are refused.
select pg_temp.admin('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f1');
select pg_temp.expect($q$select 1 where private.is_admin()$q$, 1, 'admin with an aal2 session is an admin');
select pg_temp.expect($q$select 1 from public.profiles where display_name in ('T', 'T2', 'M', 'S', 'U')$q$, 5, 'admin reads every learner');
select public.admin_set_learner('00000000-0000-0000-0000-0000000000c1', 'verified', null, 'adult');
select public.admin_set_learner('00000000-0000-0000-0000-0000000000d1', 'verified', 'A2', 'minor');
select public.admin_set_learner('00000000-0000-0000-0000-0000000000d2', 'verified', 'B1', 'adult');
select pg_temp.deny($q$select public.admin_set_learner('00000000-0000-0000-0000-0000000000d3', 'approved', 'B1', 'adult')$q$, 'unknown verification value', '22023');
select pg_temp.deny($q$select public.admin_set_learner('00000000-0000-0000-0000-0000000000d3', 'verified', 'B1', null)$q$, 'verified without an age group', '22023');
select pg_temp.deny($q$select public.admin_set_learner('00000000-0000-0000-0000-0000000000d3', 'verified', 'Z9', 'adult')$q$, 'invalid level', '23514');
select pg_temp.deny($q$select public.admin_set_learner('00000000-0000-0000-0000-0000000000e2', 'verified', 'B1', 'adult')$q$, 'admin verifies a non-learner', 'P0002');
select pg_temp.expect($q$select 1 from public.profiles where verification_status = 'verified' and display_name in ('T', 'M', 'S')$q$, 3, 'admin verification saved');
-- Sessions: approved places only, future times, capacity 1 to 50; the admin is the supervisor; no school.
select set_config('test.s1', public.admin_create_session('dragon-bridge', now() + interval '1 day', now() + interval '1 day 2 hours', 10)::text, true);
select set_config('test.s2', public.admin_create_session('dragon-bridge', now() + interval '2 days', now() + interval '2 days 2 hours', 1)::text, true);
select pg_temp.deny($q$select public.admin_create_session('han-market', now() + interval '1 day', now() + interval '1 day 2 hours', 5)$q$, 'admin session at an unapproved place', '23514', 'location-not-approved');
select pg_temp.deny($q$select public.admin_create_session('dragon-bridge', now() - interval '3 hours', now() - interval '1 hour', 5)$q$, 'admin session in the past', '22023');
select pg_temp.deny($q$select public.admin_create_session('dragon-bridge', now() + interval '1 day', now() + interval '1 day 2 hours', 99)$q$, 'admin session over capacity', '23514');
select pg_temp.expect($q$select 1 from public.group_sessions where created_by = auth.uid() and school_id is null$q$, 2, 'admin supervises the sessions');
select pg_temp.deny($q$insert into public.group_sessions (location_id, starts_at, ends_at) values ('dragon-bridge', now(), now() + interval '2 hours')$q$, 'admin writes sessions directly');

-- Availability: own rows, approved places only.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d2');
insert into public.availability (location_id, slot) values ('dragon-bridge', 'sat-am');
select pg_temp.deny($q$insert into public.availability (location_id, slot) values ('han-market', 'sat-am')$q$, 'availability at an unapproved place');

-- Connection requests: only the service role writes, and the guard fails closed even for it (R-16, R-17).
select pg_temp.act('service_role');
insert into public.group_sessions (id, location_id, created_by, starts_at, ends_at) values
  ('00000000-0000-0000-0000-0000000000a9', 'dragon-bridge', '00000000-0000-0000-0000-0000000000c1', now() + interval '1 day', now() + interval '1 day 2 hours');
select pg_temp.deny($q$insert into public.connection_requests (tourist_id, student_id, location_id, mode) values ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000d2', 'dragon-bridge', 'one-to-one')$q$, 'unverified (self-declared adult) tourist', '23514', 'tourist-not-eligible');
do $$
declare
  c text[];
  cases text[][] := array[
    -- tourist, student, place, mode, session, label, reason
    ['c1', 'd1', 'dragon-bridge', 'one-to-one', '', 'one-to-one with a minor', 'minor-one-to-one-blocked'],
    ['c1', 'd3', 'dragon-bridge', 'one-to-one', '', 'unverified student', 'student-not-eligible'],
    ['c1', 'd2', 'han-market', 'one-to-one', '', 'request at an unapproved place', 'location-not-approved'],
    ['d2', 'd1', 'dragon-bridge', 'one-to-one', '', 'student as tourist', 'tourist-not-eligible'],
    ['c1', 'd2', 'apec-park', 'supervised-group', current_setting('test.s1'), 'session at another place', 'session-invalid'],
    ['c1', 'd2', 'dragon-bridge', 'supervised-group', '00000000-0000-0000-0000-0000000000a9', 'session supervised by a non-admin', 'session-invalid'],
    ['c1', 'd1', 'dragon-bridge', 'supervised-group', current_setting('test.s1'), 'minor in a group (no approval path yet)', 'student-awaiting-approval']];
begin
  foreach c slice 1 in array cases loop
    perform pg_temp.deny(format('insert into public.connection_requests (tourist_id, student_id, location_id, mode, session_id) values (%L, %L, %L, %L, %L)',
      '00000000-0000-0000-0000-0000000000' || c[1], '00000000-0000-0000-0000-0000000000' || c[2], c[3], c[4], nullif(c[5], '')), c[6], '23514', c[7]);
  end loop;
end $$;
-- The admin verifies T2 now; the guard reads fresh rows.
select pg_temp.admin('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f1');
select public.admin_set_learner('00000000-0000-0000-0000-0000000000c2', 'verified', null, 'adult');
select pg_temp.act('service_role');
select pg_temp.deny($q$insert into public.connection_requests (tourist_id, student_id, location_id, mode) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2', 'dragon-bridge', 'one-to-one')$q$, 'student_id is a verified tourist', '23514', 'student-not-eligible');
insert into public.connection_requests (id, tourist_id, student_id, location_id, mode) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000d2', 'dragon-bridge', 'one-to-one');
insert into public.connection_requests (id, tourist_id, location_id, mode, session_id) values
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000c1', 'dragon-bridge', 'supervised-group', current_setting('test.s1')::uuid);

-- The tourist: no minor profile, no other user's requests, no direct writes, no sessions, no audit log.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c1');
select pg_temp.expect($q$select 1 from public.profiles$q$, 1, 'tourist reads only own profile');
select pg_temp.expect($q$select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000d1'$q$, 0, 'tourist reads the minor profile');
select pg_temp.expect($q$select * from public.safe_profiles(array['00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d3']::uuid[])$q$, 1, 'safe_profiles returns verified adults only');
select pg_temp.expect($q$select * from public.safe_profiles(array['00000000-0000-0000-0000-0000000000d1']::uuid[])$q$, 0, 'safe_profiles returns the minor');
-- A verified account's name is locked (0006_audit_fixes): the rename to contact details is ignored.
update public.profiles set display_name = 'guest@example.test / 020 7946 0123';
select pg_temp.expect($q$select 1 from public.profiles where display_name is not null and display_name not like 'guest@%'$q$, 1, 'verified guest keeps the locked name');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d1');
select pg_temp.expect($q$select * from public.safe_profiles(array['00000000-0000-0000-0000-0000000000c1']::uuid[]) where role = 'tourist' and display_name is null$q$, 1, 'public RPC suppresses a guest name containing contact details');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c1');
select pg_temp.expect($q$select 1 from public.connection_requests$q$, 1, 'tourist reads only own requests');
select pg_temp.expect($q$select 1 from public.group_sessions$q$, 0, 'tourist reads session times');
select pg_temp.expect($q$select 1 from public.availability$q$, 0, 'tourist reads availability');
select pg_temp.expect($q$select 1 from public.locations where id in ('dragon-bridge', 'han-market') and approved$q$, 1, 'tourist reads approved places');
select pg_temp.deny($q$insert into public.connection_requests (tourist_id, location_id, mode, session_id) values (auth.uid(), 'dragon-bridge', 'supervised-group', current_setting('test.s1')::uuid)$q$, 'client inserts a connection request');
select pg_temp.deny($q$update public.connection_requests set status = 'accepted'$q$, 'client updates a connection request');
select pg_temp.deny($q$delete from public.connection_requests$q$, 'client deletes a connection request');
select pg_temp.deny($q$update public.locations set approved = true$q$, 'client approves a place');
select pg_temp.deny($q$select 1 from public.audit_log$q$, 'client reads audit_log');
select pg_temp.deny($q$insert into public.audit_log (action) values ('forged')$q$, 'client writes audit_log');
select pg_temp.deny($q$select 1 from public.schools$q$, 'client reads retired schools');
select pg_temp.deny($q$select 1 from public.minor_approvals$q$, 'client reads retired minor approvals');
-- Blocks and reports: own rows only; a report starts open.
insert into public.blocks (blocked_id) values ('00000000-0000-0000-0000-0000000000d2');
select pg_temp.deny($q$insert into public.blocks (blocker_id, blocked_id) values ('00000000-0000-0000-0000-0000000000d2', auth.uid())$q$, 'block on behalf of another user');
select pg_temp.deny($q$insert into public.reports (reported_id, reason, status) values ('00000000-0000-0000-0000-0000000000d2', 'spam', 'closed')$q$, 'report created closed');
select pg_temp.deny($q$insert into public.reports (reporter_id, reported_id, reason) values ('00000000-0000-0000-0000-0000000000d2', auth.uid(), 'spam')$q$, 'report forged for another user');
insert into public.reports (id, reported_id, reason) values ('00000000-0000-0000-0000-0000000000b9', '00000000-0000-0000-0000-0000000000d2', 'spam');
select pg_temp.deny($q$update public.reports set status = 'closed'$q$, 'reporter closes own report');

select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d2');
select pg_temp.expect($q$select 1 from public.connection_requests$q$, 1, 'student reads only requests to them');
select pg_temp.expect($q$select 1 from public.blocks union all select 1 from public.reports$q$, 0, 'student sees blocks or reports about them');

-- The verified minor: age group, role and the row itself are now locked.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d1');
select pg_temp.expect($q$select 1 from public.connection_requests$q$, 0, 'minor reads other requests');
select pg_temp.deny($q$update public.profiles set age_group = 'adult'$q$, 'verified minor changes age_group');
select pg_temp.deny($q$update public.profiles set role = 'tourist'$q$, 'verified student switches to tourist');
select pg_temp.deny($q$update public.profiles set verification_status = 'unverified'$q$, 'self-change verification_status');
select pg_temp.deny($q$delete from public.profiles$q$, 'minor deletes own profile to reset locks');
reset role;
-- As if the 0001 grant and delete policy came back; the guard trigger must still refuse. Rolled back.
grant delete on public.profiles to authenticated;
create policy test_delete on public.profiles for delete to authenticated using (id = (select auth.uid()));
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d1');
select pg_temp.deny($q$delete from public.profiles$q$, 'profile delete with DELETE granted');
reset role;
alter policy test_delete on public.profiles using (false);
revoke delete on public.profiles from authenticated;

-- 0005: one open request per pair, seats on accept, blocked pairs refused, a block ends open requests.
select pg_temp.act('service_role');
select pg_temp.deny(format('insert into public.connection_requests (tourist_id, student_id, location_id, mode, session_id) values (%L, %L, %L, %L, %L)', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d2', 'dragon-bridge', 'supervised-group', current_setting('test.s2')), 'request between blocked users', '23514', 'blocked');
insert into public.connection_requests (id, tourist_id, student_id, location_id, mode, session_id) values
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000d2', 'dragon-bridge', 'supervised-group', current_setting('test.s2')::uuid),
  ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000c1', null, 'dragon-bridge', 'supervised-group', current_setting('test.s2')::uuid);
select pg_temp.deny(format('insert into public.connection_requests (tourist_id, student_id, location_id, mode, session_id) values (%L, %L, %L, %L, %L)', '00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000d2', 'dragon-bridge', 'supervised-group', current_setting('test.s2')), 'second open request for one pair', '23505');
select pg_temp.deny(format('insert into public.connection_requests (tourist_id, location_id, mode, session_id) values (%L, %L, %L, %L)', '00000000-0000-0000-0000-0000000000c1', 'dragon-bridge', 'supervised-group', current_setting('test.s2')), 'second open whole-session request', '23505');
update public.connection_requests set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b3';
select pg_temp.deny($q$update public.connection_requests set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b4'$q$, 'accept past capacity', '23514', 'session-full');
-- The student blocks the tourist: every open request between them ends, and cannot be accepted again.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d2');
insert into public.blocks (blocked_id) values ('00000000-0000-0000-0000-0000000000c2');
select pg_temp.act('service_role');
select pg_temp.expect($q$select 1 from public.connection_requests where tourist_id = '00000000-0000-0000-0000-0000000000c2' and student_id = '00000000-0000-0000-0000-0000000000d2' and status = 'cancelled'$q$, 2, 'block cancels pending and accepted requests');
select pg_temp.deny($q$update public.connection_requests set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b3'$q$, 'accept after a block', '23514', 'blocked');
update public.connection_requests set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b4'; -- the freed seat
insert into public.connection_requests (id, tourist_id, location_id, mode, session_id) values
  ('00000000-0000-0000-0000-0000000000b6', '00000000-0000-0000-0000-0000000000c2', 'dragon-bridge', 'supervised-group', current_setting('test.s2')::uuid);
-- Level and display_name are server-owned once verified (0005, 0006_audit_fixes): a client change is ignored, other columns still save.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d2');
select set_config('test.name_d2', (select coalesce(display_name, '') from public.profiles), true);
update public.profiles set level = 'A1', display_name = 'S2-renamed', accent = 'en-GB';
select pg_temp.expect($q$select 1 from public.profiles where level = 'B1' and coalesce(display_name, '') = current_setting('test.name_d2') and accent = 'en-GB'$q$, 1, 'verified student keeps the server level and name');
select pg_temp.act('service_role');
update public.profiles set level = 'B2' where id = '00000000-0000-0000-0000-0000000000d2';
select pg_temp.expect($q$select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000d2' and level = 'B2'$q$, 1, 'service role sets level');

-- Nobody but an admin on a live MFA (aal2) session reaches admin data or RPCs: refused in the database.
select pg_temp.act('anon');
select pg_temp.not_admin('anon');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d1');
select pg_temp.not_admin('learner');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c1');
select pg_temp.not_admin('tourist');
select pg_temp.admin('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000f2', 'aal1');
select pg_temp.not_admin('admin without aal2');
select pg_temp.admin('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000f2');
select pg_temp.not_admin('aal2 claim on an aal1 session');
select pg_temp.admin('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f9');
select pg_temp.not_admin('admin on a signed-out session');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c1',
  '{"aal": "aal2", "session_id": "00000000-0000-0000-0000-0000000000f3", "user_metadata": {"role": "admin"}}');
select pg_temp.not_admin('user_metadata admin');
select pg_temp.admin('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000f3');
select pg_temp.not_admin('stale admin claim');

-- Admin A with aal2: reads every connect table, resolves a report, closes a session; each action is audited.
select pg_temp.admin('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f1');
select pg_temp.expect($q$select 1 from public.connection_requests where id::text like '00000000-0000-0000-0000-0000000000b_'$q$, 5, 'admin reads every request');
select pg_temp.expect($q$select 1 from public.reports where id = '00000000-0000-0000-0000-0000000000b9'$q$, 1, 'admin reads reports');
select pg_temp.expect($q$select 1 from public.blocks where blocker_id in ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d2')$q$, 2, 'admin reads blocks');
select pg_temp.expect($q$select 1 from public.group_sessions where created_by = auth.uid() or id = '00000000-0000-0000-0000-0000000000a9'$q$, 3, 'admin reads sessions');
select pg_temp.deny($q$select public.admin_resolve_report('00000000-0000-0000-0000-0000000000b9', 'open')$q$, 'report reopened as open', '22023');
select public.admin_resolve_report('00000000-0000-0000-0000-0000000000b9', 'closed');
select pg_temp.expect($q$select 1 from public.reports where id = '00000000-0000-0000-0000-0000000000b9' and status = 'closed'$q$, 1, 'report closed');
select public.admin_close_session(current_setting('test.s1')::uuid);
select pg_temp.expect($q$select 1 from public.connection_requests where id = '00000000-0000-0000-0000-0000000000b5' and status = 'cancelled'$q$, 1, 'closing a session cancels its open requests');
select pg_temp.deny(format('select public.admin_close_session(%L)', current_setting('test.s1')), 'close a closed session', 'P0002');
select pg_temp.expect($q$select action from public.admin_audit_log where actor_id = auth.uid() group by action
  having count(*) = case action when 'admin_set_learner' then 4 when 'admin_create_session' then 2 else 1 end$q$, 4, 'every admin action audited once');
select pg_temp.expect($q$select 1 from public.admin_audit_log where actor_id = auth.uid() and target_table is not null and details <> '{}'$q$, 8, 'audit rows name target and details');
select pg_temp.deny($q$update public.admin_audit_log set action = 'rewritten'$q$, 'admin updates the audit log');
select pg_temp.deny($q$delete from public.admin_audit_log$q$, 'admin deletes the audit log');
select pg_temp.deny($q$insert into public.admin_audit_log (actor_id, action) values (auth.uid(), 'forged')$q$, 'admin forges an audit row');
-- Demoting an admin takes effect at once, even with a valid aal2 JWT and session; their sessions lose the supervisor.
reset role;
update auth.users set raw_app_meta_data = raw_app_meta_data - 'role' where id = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.admin('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f1');
select pg_temp.not_admin('demoted admin');
select pg_temp.act('service_role');
select pg_temp.deny($q$update public.connection_requests set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b6'$q$, 'accept in a session of a demoted admin', '23514', 'session-invalid');

-- The Edge Function audit log stays append-only for the service role; both audit logs refuse even the owner.
insert into public.audit_log (action, target_id) values ('test', 'x');
select pg_temp.deny($q$update public.audit_log set action = 'rewritten' where action = 'test'$q$, 'service role updates audit_log');
select pg_temp.deny($q$delete from public.audit_log where action = 'test'$q$, 'service role deletes audit_log');
reset role;
select pg_temp.deny($q$update public.audit_log set action = 'rewritten' where action = 'test'$q$, 'owner updates audit_log');
select pg_temp.deny($q$delete from public.audit_log where action = 'test'$q$, 'owner deletes audit_log');
select pg_temp.deny($q$truncate public.audit_log$q$, 'owner truncates audit_log');
select pg_temp.deny($q$update public.admin_audit_log set action = 'rewritten'$q$, 'owner updates admin_audit_log');
select pg_temp.deny($q$delete from public.admin_audit_log$q$, 'owner deletes admin_audit_log');
select pg_temp.deny($q$truncate public.admin_audit_log$q$, 'owner truncates admin_audit_log');

-- Deleting an account (server side) cascades its connect rows.
delete from auth.users where id = '00000000-0000-0000-0000-0000000000c2';
select pg_temp.expect($q$select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000c2'$q$, 0, 'server account deletion cascades the profile');
select pg_temp.expect($q$select 1 from public.connection_requests where tourist_id = '00000000-0000-0000-0000-0000000000c2'$q$, 0, 'deleted account leaves requests behind');

-- 0006: the legacy Edge release cannot reserve quota. The new RPC enforces both limits atomically.
insert into private.ai_project_usage (day, requests) values ((now() at time zone 'utc')::date, 98)
on conflict (day) do update set requests = excluded.requests;
select pg_temp.act('service_role');
select pg_temp.expect($q$select 1 where public.ai_project_quota_take('00000000-0000-0000-0000-0000000000c1', 1) = 1$q$, 1, 'first account takes quota');
select pg_temp.expect($q$select 1 where public.ai_project_quota_take('00000000-0000-0000-0000-0000000000c1', 1) is null$q$, 1, 'account limit refuses second request');
select pg_temp.expect($q$select 1 where public.ai_quota_take('00000000-0000-0000-0000-0000000000d2', 3) is null$q$, 1, 'legacy Edge cannot reserve even while budget is available');
select pg_temp.expect($q$select 1 where public.ai_project_quota_take('00000000-0000-0000-0000-0000000000d2', 3) = 1$q$, 1, 'other account takes last project turn');
select pg_temp.expect($q$select 1 where public.ai_project_quota_take('00000000-0000-0000-0000-0000000000d2', 3) is null$q$, 1, 'shared limit refuses an existing account below its cap');
select pg_temp.expect($q$select 1 where public.ai_project_quota_take('00000000-0000-0000-0000-0000000000d3', 3) is null$q$, 1, 'shared limit refuses a new account');
select pg_temp.expect($q$select 1 from public.ai_usage where user_id = '00000000-0000-0000-0000-0000000000d2' and requests = 1$q$, 1, 'project denial leaves the account counter unchanged');
select pg_temp.expect($q$select 1 from public.ai_usage where user_id = '00000000-0000-0000-0000-0000000000d3'$q$, 0, 'project denial leaves no new account row');
select pg_temp.expect($q$select 1 from private.ai_project_usage where day = (now() at time zone 'utc')::date and requests = 100$q$, 1, 'shared counter stops at 100');
select pg_temp.deny($q$truncate private.ai_project_usage$q$, 'service role has no shared quota truncate privilege');
select pg_temp.deny($q$delete from public.ai_usage$q$, 'service role has no account quota delete privilege');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c1');
select pg_temp.expect($q$select 1 from public.ai_usage$q$, 1, 'user reads only own ai_usage');
select pg_temp.deny($q$insert into public.ai_usage (user_id, requests) values (auth.uid(), 0)$q$, 'client inserts ai_usage');
select pg_temp.deny($q$update public.ai_usage set requests = 0$q$, 'client resets ai_usage');
select pg_temp.deny($q$delete from public.ai_usage$q$, 'client deletes ai_usage');
select pg_temp.deny($q$select public.ai_quota_take(auth.uid(), 1000)$q$, 'client invokes legacy quota RPC');
select pg_temp.deny($q$select public.ai_project_quota_take(auth.uid(), 1000)$q$, 'client invokes quota RPC');
select pg_temp.deny($q$select 1 from private.ai_project_usage$q$, 'client reads shared quota');
select pg_temp.deny($q$update private.ai_project_usage set requests = 0$q$, 'client resets shared quota');
select pg_temp.act('anon');
select pg_temp.deny($q$select 1 from public.ai_usage$q$, 'anon reads ai_usage');
select pg_temp.deny($q$select public.ai_project_quota_take(auth.uid(), 1000)$q$, 'anon invokes quota RPC');

reset role;
rollback;
-- Reached only if nothing above raised.
select 'RLS check passed' as result;
