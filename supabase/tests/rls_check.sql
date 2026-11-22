-- RLS check after migrations 0001 + 0002. Paste into the SQL Editor and run.
-- Everything happens in one transaction that is rolled back: no test rows stay behind.
-- Pass = the result row "RLS check passed". Any failure raises an exception naming the step.
begin;

-- Check effective privileges, including grants inherited from PUBLIC or older project defaults.
do $$
declare t text; p text;
begin
  foreach t in array array['profiles', 'unit_progress', 'attempts', 'error_items', 'srs_cards'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass) then
      raise exception 'FAIL: RLS disabled on %', t;
    end if;
    foreach p in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
      if not has_table_privilege('authenticated', 'public.' || t, p) then
        raise exception 'FAIL: authenticated lacks % on %', p, t;
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
    execute format('delete from public.%I', t);
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: B deleted A rows on %', t; end if;
  end loop;
  select count(*) into n from public.profiles; if n <> 0 then raise exception 'FAIL: B sees % profile rows', n; end if;
  select count(*) into n from public.error_items; if n <> 0 then raise exception 'FAIL: B sees % error rows', n; end if;
  update public.error_items set best = 99 where id = 'e1'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B updated A''s row'; end if;
  delete from public.profiles; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B deleted A''s profile'; end if;
end $$;

-- B can create and remove their own row on every table without affecting A.
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

reset role;
rollback;
-- Reached only if nothing above raised.
select 'RLS check passed' as result;
