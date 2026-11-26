-- RLS check after migrations 0001 through 0006. Run on a disposable local database.
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

-- ===== Local Guide Connect (0003, PRD R-14 to R-18) =====
reset role;
-- act: switch role and JWT subject. deny: the statement must fail with that SQLSTATE
-- (42501 = no privilege / RLS / guard, 23514 = check). expect: the query returns that many rows.
create function pg_temp.act(r text, sub text default null) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', sub, 'role', r)::text, true);
  perform set_config('role', r, true);
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
select pg_temp.expect($q$select 1 from pg_policies where tablename = 'profiles' and policyname = 'own_delete' and qual is distinct from 'false'$q$, 0, 'own_delete neutralised');
reset role;

-- Privileges: anon gets nothing; clients cannot write server-owned tables; no TRUNCATE anywhere.
do $$
declare t text; p text; f text;
begin
  foreach t in array array['schools', 'locations', 'availability', 'group_sessions', 'minor_approvals',
                           'connection_requests', 'blocks', 'reports', 'audit_log'] loop
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
  foreach t in array array['schools', 'locations', 'minor_approvals', 'connection_requests', 'audit_log'] loop
    foreach p in array array['INSERT', 'UPDATE', 'DELETE'] loop
      if has_table_privilege('authenticated', 'public.' || t, p) then
        raise exception 'FAIL: clients can % on %', p, t;
      end if;
    end loop;
  end loop;
  if has_table_privilege('authenticated', 'public.audit_log', 'SELECT')
     or has_column_privilege('authenticated', 'public.schools', 'invite_code_hash', 'SELECT') then
    raise exception 'FAIL: clients can read audit_log or invite_code_hash';
  end if;
  if has_column_privilege('service_role', 'public.schools', 'invite_code_hash', 'UPDATE')
     or has_column_privilege('service_role', 'public.schools', 'invite_code_hash', 'INSERT') then
    raise exception 'FAIL: service role can write a raw invite_code_hash';
  end if;
  if has_table_privilege('service_role', 'public.audit_log', 'UPDATE') or has_table_privilege('service_role', 'public.audit_log', 'DELETE')
     or has_table_privilege('service_role', 'public.minor_approvals', 'DELETE') then
    raise exception 'FAIL: service role can rewrite audit_log or delete consent evidence';
  end if;
  foreach f in array array['public.join_school(text)', 'public.school_rotate_invite_code(uuid)',
      'public.school_members(uuid)', 'public.school_set_member(uuid, text, text, text)',
      'public.school_set_minor_approval(uuid, boolean)', 'public.safe_profiles(uuid[])'] loop
    if has_function_privilege('anon', f, 'EXECUTE') then raise exception 'FAIL: anon can execute %', f; end if;
  end loop;
  if has_function_privilege('authenticated', 'private.blocks_end_requests()', 'EXECUTE') then
    raise exception 'FAIL: clients can execute blocks_end_requests';
  end if;
  if has_function_privilege('authenticated', 'private.new_invite_code(uuid)', 'EXECUTE') then
    raise exception 'FAIL: clients can issue invite codes';
  end if;
end $$;

-- Identities (rolled back): tourists T and T2, minor student M, adult student S, school admin A,
-- teacher R, and U, a minor student of another school. Codes are issued by private.new_invite_code.
insert into auth.users (id, aud, role) values
  ('00000000-0000-0000-0000-0000000000c1', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c2', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d1', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d2', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d3', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000e1', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000e2', 'authenticated', 'authenticated');
insert into public.schools (id, name) values
  ('00000000-0000-0000-0000-0000000000f1', 'Test school'),
  ('00000000-0000-0000-0000-0000000000f2', 'Other school');
select set_config('test.code1', private.new_invite_code('00000000-0000-0000-0000-0000000000f1'), true);
select set_config('test.code2', private.new_invite_code('00000000-0000-0000-0000-0000000000f2'), true);
select pg_temp.expect($q$select 1 where current_setting('test.code1') ~ '^[0-9a-f]{32}$'$q$, 1, 'issued code is 32 hex chars');
update public.locations set approved = true where id = 'dragon-bridge';
update public.locations set approved = false where id = 'han-market';

-- Nobody self-grants role, verification or school, at insert or update (R-14, R-16).
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c1');
select pg_temp.deny($q$insert into public.profiles (display_name, role) values ('T', 'school_admin')$q$, 'self-insert as school_admin');
select pg_temp.deny($q$insert into public.profiles (display_name, role, verification_status) values ('T', 'tourist', 'verified')$q$, 'self-insert verified');
select pg_temp.deny($q$insert into public.profiles (display_name, school_id) values ('T', '00000000-0000-0000-0000-0000000000f1')$q$, 'self-insert into a school');
insert into public.profiles (display_name, role, age_group) values ('T', 'tourist', 'adult');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c2');
insert into public.profiles (display_name, role, age_group) values ('T2', 'tourist', 'adult');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d2');
insert into public.profiles (display_name, age_group, level) values ('S', 'adult', 'B1');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000e2');
insert into public.profiles (display_name, age_group) values ('R', 'adult');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000e1');
insert into public.profiles (display_name, age_group) values ('A', 'adult');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d1');
insert into public.profiles (display_name, age_group) values ('M', 'minor');
select pg_temp.deny($q$update public.profiles set verification_status = 'verified'$q$, 'self-grant verification_status');
select pg_temp.deny($q$update public.profiles set role = 'teacher'$q$, 'self-grant teacher');
select pg_temp.deny($q$update public.profiles set role = 'school_admin'$q$, 'self-grant school_admin');
select pg_temp.deny($q$update public.profiles set school_id = '00000000-0000-0000-0000-0000000000f1'$q$, 'self-set school_id');
-- Allowed before verification: self-declared age group, and switching student <-> tourist.
update public.profiles set age_group = 'adult';
update public.profiles set age_group = 'minor', role = 'tourist';
update public.profiles set role = 'student', level = 'A2';
select pg_temp.expect($q$select 1 from public.profiles where role = 'student' and age_group = 'minor' and verification_status = 'unverified' and level = 'A2'$q$, 1, 'M can edit own unprivileged columns');

-- join_school: only students; a wrong code returns null and is logged; codes ignore case and spaces.
select pg_temp.expect($q$select 1 where public.join_school('wrong-code') is null$q$, 1, 'wrong code returns null');
select public.join_school(' ' || upper(current_setting('test.code1')) || ' ');
select pg_temp.expect($q$select 1 from public.profiles where school_id = '00000000-0000-0000-0000-0000000000f1' and school_joined_at is not null$q$, 1, 'M joined the school');
select pg_temp.expect($q$select id, name from public.schools$q$, 1, 'member reads own school name');
select pg_temp.deny($q$select invite_code_hash from public.schools$q$, 'member reads invite_code_hash');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c1');
select pg_temp.deny($q$select public.join_school(current_setting('test.code1'))$q$, 'tourist joins a school');
select pg_temp.expect($q$select 1 from public.schools$q$, 0, 'non-member reads a school');
do $$
declare uid text;
begin
  foreach uid in array array['00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000e2',
                             '00000000-0000-0000-0000-0000000000e1'] loop
    perform pg_temp.act('authenticated', uid);
    perform public.join_school(current_setting('test.code1'));
  end loop;
end $$;
select pg_temp.deny($q$update public.profiles set role = 'school_admin'$q$, 'member self-promotes');
select pg_temp.deny($q$select public.school_set_member('00000000-0000-0000-0000-0000000000e1', 'school_admin', 'verified', 'adult')$q$, 'non-admin calls school_set_member');

-- U joins the other school, then hits the cap: 5 wrong codes in an hour lock join_school.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d3');
insert into public.profiles (display_name, age_group) values ('U', 'minor');
select public.join_school(current_setting('test.code2'));
do $$ begin for i in 1..5 loop perform public.join_school('guess-' || i); end loop; end $$;
select pg_temp.deny($q$select public.join_school(current_setting('test.code2'))$q$, 'join_school after 5 wrong codes');

-- Only the service role makes the first school_admin.
select pg_temp.act('service_role');
update public.profiles set role = 'school_admin', verification_status = 'verified' where id = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.expect($q$select 1 from public.profiles where role = 'school_admin' and id = '00000000-0000-0000-0000-0000000000e1'$q$, 1, 'service role promotes admin');

-- The admin manages members of the same school only; staff must be verified adults.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000e1');
select public.school_set_member('00000000-0000-0000-0000-0000000000e2', 'teacher', 'verified', 'adult');
select public.school_set_member('00000000-0000-0000-0000-0000000000d1', 'student', 'verified', 'minor');
select public.school_set_member('00000000-0000-0000-0000-0000000000d2', 'student', 'verified', 'adult');
select pg_temp.deny($q$select public.school_set_member('00000000-0000-0000-0000-0000000000c1', 'student', 'verified', 'adult')$q$, 'admin edits a user outside the school');
select pg_temp.deny($q$select public.school_set_member('00000000-0000-0000-0000-0000000000d3', 'student', 'verified', 'minor')$q$, 'admin verifies a student of another school');
select pg_temp.deny($q$select public.school_set_minor_approval('00000000-0000-0000-0000-0000000000d3', true)$q$, 'admin approves a minor of another school');
select pg_temp.deny($q$select public.school_set_member('00000000-0000-0000-0000-0000000000d1', 'teacher', 'verified', 'minor')$q$, 'minor made teacher');
select pg_temp.deny($q$select public.school_set_minor_approval('00000000-0000-0000-0000-0000000000d2', true)$q$, 'minor approval for an adult');
select public.school_set_minor_approval('00000000-0000-0000-0000-0000000000d1', true);
-- Member list only through school_members(): limited fields, own school only; no row policy on profiles.
select pg_temp.expect($q$select 1 from public.profiles$q$, 1, 'admin reads only own profile row');
select pg_temp.expect($q$select * from public.school_members('00000000-0000-0000-0000-0000000000f1') where joined_at is not null$q$, 4, 'admin lists school members');
select pg_temp.expect($q$select * from public.school_members('00000000-0000-0000-0000-0000000000f2')$q$, 0, 'admin lists another school');
select pg_temp.expect($q$select 1 from public.minor_approvals$q$, 1, 'admin reads school approvals');
select pg_temp.deny($q$select public.school_rotate_invite_code('00000000-0000-0000-0000-0000000000f2')$q$, 'admin rotates another school code');
select set_config('test.code3', public.school_rotate_invite_code('00000000-0000-0000-0000-0000000000f1'), true);

-- The verified minor: age group, role and the row itself are now locked; approvals are read-only.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d1');
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
drop policy test_delete on public.profiles;
revoke delete on public.profiles from authenticated;
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d1');
select pg_temp.expect($q$select 1 where public.join_school(current_setting('test.code1')) is null$q$, 1, 'rotated-out code still works');
select pg_temp.expect($q$select 1 where public.join_school(current_setting('test.code3')) = '00000000-0000-0000-0000-0000000000f1'$q$, 1, 'new code works');
select pg_temp.expect($q$select 1 from public.profiles where verification_status = 'verified'$q$, 1, 're-joining the same school keeps verification');
select pg_temp.deny($q$select public.school_rotate_invite_code('00000000-0000-0000-0000-0000000000f1')$q$, 'student rotates the code');
select pg_temp.deny($q$select public.school_set_minor_approval('00000000-0000-0000-0000-0000000000d1', true)$q$, 'minor approves self');
select pg_temp.deny($q$insert into public.minor_approvals (student_id, school_id, guardian_consent_at) values (auth.uid(), '00000000-0000-0000-0000-0000000000f1', now())$q$, 'client inserts an approval');
select pg_temp.deny($q$update public.minor_approvals set guardian_consent_at = now()$q$, 'client writes guardian consent');
select pg_temp.expect($q$select 1 from public.minor_approvals where revoked_at is null$q$, 1, 'minor reads own approval');

-- Group sessions: verified teachers of the school only, approved places only (R-16, R-17).
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000e2');
select pg_temp.deny($q$insert into public.group_sessions (school_id, location_id, starts_at, ends_at) values ('00000000-0000-0000-0000-0000000000f1', 'han-market', now(), now() + interval '2 hours')$q$, 'session at an unapproved place');
insert into public.group_sessions (id, school_id, location_id, starts_at, ends_at) values
  ('00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-0000000000f1', 'dragon-bridge', now(), now() + interval '2 hours');
select pg_temp.deny($q$update public.group_sessions set location_id = 'han-market'$q$, 'session moved to an unapproved place');
do $$
declare uid text;
begin
  foreach uid in array array['00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e1',
                             '00000000-0000-0000-0000-0000000000c1'] loop
    perform pg_temp.act('authenticated', uid);
    perform pg_temp.deny($q$insert into public.group_sessions (school_id, location_id, starts_at, ends_at) values ('00000000-0000-0000-0000-0000000000f1', 'dragon-bridge', now(), now() + interval '2 hours')$q$, 'non-teacher creates a session: ' || uid);
  end loop;
end $$;
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d1');
select pg_temp.expect($q$select 1 from public.group_sessions$q$, 1, 'verified member sees school sessions');

-- Availability: own rows, approved places only.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d2');
insert into public.availability (location_id, slot) values ('dragon-bridge', 'sat-am');
select pg_temp.deny($q$insert into public.availability (location_id, slot) values ('han-market', 'sat-am')$q$, 'availability at an unapproved place');

-- Connection requests: only the service role writes, and the guard fails closed even for it (R-16, R-17).
select pg_temp.act('service_role');
select pg_temp.deny($q$insert into public.connection_requests (tourist_id, student_id, location_id, mode) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d2', 'dragon-bridge', 'one-to-one')$q$, 'unverified (self-declared adult) tourist', '23514');
update public.profiles set verification_status = 'verified' where id in ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2');
select pg_temp.deny($q$insert into public.connection_requests (tourist_id, student_id, location_id, mode) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d3', 'dragon-bridge', 'one-to-one')$q$, 'unverified student', '23514');
update public.profiles set verification_status = 'verified' where id = '00000000-0000-0000-0000-0000000000d3';
-- U is fully approved at the other school, so only the school mismatch can stop U joining session a0.
insert into public.minor_approvals (student_id, school_id, school_approved_at, guardian_consent_at) values
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000f2', now(), now());
do $$
declare
  c text[];
  cases text[][] := array[
    -- tourist, student, place, mode, session, label
    ['c1', 'd1', 'dragon-bridge', 'one-to-one', null, 'one-to-one with a minor'],
    ['c1', 'e2', 'dragon-bridge', 'one-to-one', null, 'student_id is a teacher'],
    ['c1', 'd2', 'han-market', 'one-to-one', null, 'request at an unapproved place'],
    ['e2', 'd2', 'dragon-bridge', 'one-to-one', null, 'teacher as tourist'],
    ['d1', 'd2', 'dragon-bridge', 'one-to-one', null, 'minor as tourist'],
    ['c1', 'd1', 'apec-park', 'supervised-group', 'a0', 'session at another place'],
    ['c1', 'd3', 'dragon-bridge', 'supervised-group', 'a0', 'student of another school in the session'],
    ['c1', 'd1', 'dragon-bridge', 'supervised-group', 'a0', 'minor in a group without guardian consent']];
begin
  foreach c slice 1 in array cases loop
    perform pg_temp.deny(format('insert into public.connection_requests (tourist_id, student_id, location_id, mode, session_id) values (%L, %L, %L, %L, %L)',
      '00000000-0000-0000-0000-0000000000' || c[1], '00000000-0000-0000-0000-0000000000' || c[2], c[3], c[4],
      case when c[5] is null then null else '00000000-0000-0000-0000-0000000000' || c[5] end), c[6], '23514');
  end loop;
end $$;
update public.minor_approvals set guardian_consent_at = now(), guardian_consent_version = 'test'
  where student_id = '00000000-0000-0000-0000-0000000000d1' and revoked_at is null;
insert into public.connection_requests (id, tourist_id, student_id, location_id, mode, session_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1',
   'dragon-bridge', 'supervised-group', '00000000-0000-0000-0000-0000000000a0');
insert into public.connection_requests (tourist_id, student_id, location_id, mode) values
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000d2', 'dragon-bridge', 'one-to-one');

-- The tourist: no minor profile, no other user's requests, no direct writes, no sessions, no audit log.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c1');
select pg_temp.expect($q$select 1 from public.profiles$q$, 1, 'tourist reads only own profile');
select pg_temp.expect($q$select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000d1'$q$, 0, 'tourist reads the minor profile');
select pg_temp.expect($q$select * from public.safe_profiles(array['00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000e2']::uuid[])$q$, 2, 'safe_profiles returns verified adults');
select pg_temp.expect($q$select * from public.safe_profiles(array['00000000-0000-0000-0000-0000000000d1']::uuid[])$q$, 0, 'safe_profiles returns the minor');
-- A verified account's name is locked (0006_audit_fixes): the rename to contact details is ignored.
update public.profiles set display_name = 'guest@example.test / 020 7946 0123';
select pg_temp.expect($q$select 1 from public.profiles where display_name is not null and display_name not like 'guest@%'$q$, 1, 'verified guest keeps the locked name');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d1');
select pg_temp.expect($q$select * from public.safe_profiles(array['00000000-0000-0000-0000-0000000000c1']::uuid[]) where role = 'tourist' and display_name is null$q$, 1, 'public RPC suppresses a guest name containing contact details');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000c1');
select pg_temp.expect($q$select * from public.school_members('00000000-0000-0000-0000-0000000000f1')$q$, 0, 'tourist lists school members');
select pg_temp.expect($q$select 1 from public.connection_requests$q$, 1, 'tourist reads only own requests');
select pg_temp.expect($q$select 1 from public.group_sessions$q$, 0, 'tourist reads session times');
select pg_temp.expect($q$select 1 from public.availability$q$, 0, 'tourist reads availability');
select pg_temp.expect($q$select 1 from public.locations where id in ('dragon-bridge', 'han-market') and approved$q$, 1, 'tourist reads approved places');
select pg_temp.deny($q$insert into public.connection_requests (tourist_id, location_id, mode, session_id) values (auth.uid(), 'dragon-bridge', 'supervised-group', '00000000-0000-0000-0000-0000000000a0')$q$, 'client inserts a connection request');
select pg_temp.deny($q$update public.connection_requests set status = 'accepted'$q$, 'client updates a connection request');
select pg_temp.deny($q$delete from public.connection_requests$q$, 'client deletes a connection request');
select pg_temp.deny($q$update public.locations set approved = true$q$, 'client approves a place');
select pg_temp.deny($q$select 1 from public.audit_log$q$, 'client reads audit_log');
select pg_temp.deny($q$insert into public.audit_log (action) values ('forged')$q$, 'client writes audit_log');
-- Blocks and reports: own rows only; a report starts open.
insert into public.blocks (blocked_id) values ('00000000-0000-0000-0000-0000000000d2');
select pg_temp.deny($q$insert into public.blocks (blocker_id, blocked_id) values ('00000000-0000-0000-0000-0000000000d2', auth.uid())$q$, 'block on behalf of another user');
select pg_temp.deny($q$insert into public.reports (reported_id, reason, status) values ('00000000-0000-0000-0000-0000000000d2', 'spam', 'closed')$q$, 'report created closed');
select pg_temp.deny($q$insert into public.reports (reporter_id, reported_id, reason) values ('00000000-0000-0000-0000-0000000000d2', auth.uid(), 'spam')$q$, 'report forged for another user');
insert into public.reports (reported_id, reason) values ('00000000-0000-0000-0000-0000000000d2', 'spam');

select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d2');
select pg_temp.expect($q$select 1 from public.connection_requests$q$, 1, 'student reads only requests to them');
select pg_temp.expect($q$select 1 from public.blocks union all select 1 from public.reports$q$, 0, 'student sees blocks or reports about them');
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d1');
select pg_temp.expect($q$select 1 from public.connection_requests$q$, 1, 'minor reads only own requests');

-- Revoking the school approval blocks a later accept; declining still works (R-16 re-check).
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000e1');
select public.school_set_minor_approval('00000000-0000-0000-0000-0000000000d1', false);
select pg_temp.expect($q$select 1 from public.minor_approvals where revoked_at is null$q$, 0, 'approval revoked');
select pg_temp.act('service_role');
select pg_temp.deny($q$update public.connection_requests set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b1'$q$, 'accept after approval revoked', '23514');
update public.connection_requests set status = 'declined' where id = '00000000-0000-0000-0000-0000000000b1';

-- 0005: one open request per pair, seats on accept, blocked pairs refused, a block ends open requests.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000e2');
insert into public.group_sessions (id, school_id, location_id, starts_at, ends_at, capacity) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', 'dragon-bridge', now(), now() + interval '2 hours', 1);
select pg_temp.act('service_role');
select pg_temp.deny($q$insert into public.connection_requests (tourist_id, student_id, location_id, mode, session_id) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d2', 'dragon-bridge', 'supervised-group', '00000000-0000-0000-0000-0000000000a1')$q$, 'request between blocked users', '23514', 'blocked');
insert into public.connection_requests (id, tourist_id, student_id, location_id, mode, session_id) values
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000d2', 'dragon-bridge', 'supervised-group', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000c1', null, 'dragon-bridge', 'supervised-group', '00000000-0000-0000-0000-0000000000a1');
select pg_temp.deny($q$insert into public.connection_requests (tourist_id, student_id, location_id, mode, session_id) values ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000d2', 'dragon-bridge', 'supervised-group', '00000000-0000-0000-0000-0000000000a1')$q$, 'second open request for one pair', '23505');
select pg_temp.deny($q$insert into public.connection_requests (tourist_id, location_id, mode, session_id) values ('00000000-0000-0000-0000-0000000000c1', 'dragon-bridge', 'supervised-group', '00000000-0000-0000-0000-0000000000a1')$q$, 'second open whole-session request', '23505');
update public.connection_requests set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b3';
select pg_temp.deny($q$update public.connection_requests set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b4'$q$, 'accept past capacity', '23514', 'session-full');
-- The student blocks the tourist: every open request between them ends, and cannot be accepted again.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d2');
insert into public.blocks (blocked_id) values ('00000000-0000-0000-0000-0000000000c2');
select pg_temp.act('service_role');
select pg_temp.expect($q$select 1 from public.connection_requests where tourist_id = '00000000-0000-0000-0000-0000000000c2' and student_id = '00000000-0000-0000-0000-0000000000d2' and status = 'cancelled'$q$, 2, 'block cancels pending and accepted requests');
select pg_temp.deny($q$update public.connection_requests set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b3'$q$, 'accept after a block', '23514', 'blocked');
update public.connection_requests set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b4'; -- the freed seat
-- Level and display_name are server-owned once verified (0005, 0006_audit_fixes): a client change is ignored, other columns still save.
select pg_temp.act('authenticated', '00000000-0000-0000-0000-0000000000d2');
select set_config('test.name_d2', (select coalesce(display_name, '') from public.profiles), true);
update public.profiles set level = 'A1', display_name = 'S2-renamed', accent = 'en-GB';
select pg_temp.expect($q$select 1 from public.profiles where level = 'B1' and coalesce(display_name, '') = current_setting('test.name_d2') and accent = 'en-GB'$q$, 1, 'verified student keeps the server level and name');
select pg_temp.act('service_role');
update public.profiles set level = 'B2' where id = '00000000-0000-0000-0000-0000000000d2';
select pg_temp.expect($q$select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000d2' and level = 'B2'$q$, 1, 'service role sets level');

-- Audit log: written by the functions. Counts cover only this test's users.
select pg_temp.expect($q$select 1 from public.audit_log where action = 'join_school' and actor_id::text like '00000000-0000-0000-0000-0000000000%'$q$, 5, 'join_school is audited');
select pg_temp.expect($q$select 1 from public.audit_log where action = 'join_school_failed' and actor_id = '00000000-0000-0000-0000-0000000000d3'$q$, 5, 'wrong codes are audited');
select pg_temp.expect($q$select 1 from public.audit_log where action like 'school_%' and actor_id = '00000000-0000-0000-0000-0000000000e1'$q$, 6, 'admin actions are audited');
insert into public.audit_log (action, target_id) values ('test', 'x');
select pg_temp.deny($q$update public.audit_log set action = 'rewritten' where action = 'test'$q$, 'service role updates audit_log');
select pg_temp.deny($q$delete from public.audit_log where action = 'test'$q$, 'service role deletes audit_log');
-- The triggers refuse even the owner role running this test (an owner could still drop the triggers).
reset role;
select pg_temp.deny($q$update public.audit_log set action = 'rewritten' where action = 'test'$q$, 'owner updates audit_log');
select pg_temp.deny($q$delete from public.audit_log where action = 'test'$q$, 'owner deletes audit_log');
select pg_temp.deny($q$truncate public.audit_log$q$, 'owner truncates audit_log');

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
