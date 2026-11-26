-- EchoLạc: fixes from the 26/11/2026 security audit (PRD §8.4 cost control, §9 privacy, R-17). Run after 0005 and 0006_ai_privacy (which owns the AI quota changes).
-- No DROP statements (the Supabase connector refuses them). Re-runnable: IF NOT EXISTS, OR REPLACE and guarded ALTERs.
begin;

-- 1. profiles_guard from 0005, plus: display_name is locked once verified (R-17), so a verified student
-- cannot rename to contact details. Ignored rather than refused, like level: sync sends it on every save.
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
  if old.verification_status <> 'unverified' then
    new.level := old.level;
    new.display_name := old.display_name;
  end if;
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

-- 2. display_name cannot carry contact details: 6+ digits in total (phone numbers, also with spaces or dots),
-- '@' (email, handle) or a link. NOT VALID first; validated only when every existing row passes.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_display_name_safe'
                 and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_display_name_safe check (
      display_name is null or (
        char_length(regexp_replace(display_name, '[^0-9]', '', 'g')) < 6
        and position('@' in display_name) = 0
        and display_name !~* '(://|www\.|\.(com|net|org|vn|io|me|ly|co|app|gg|tv|xyz|info|link)(\M|/))'
      )) not valid;
  end if;
  if not exists (select 1 from public.profiles p where not (
        p.display_name is null or (
          char_length(regexp_replace(p.display_name, '[^0-9]', '', 'g')) < 6
          and position('@' in p.display_name) = 0
          and p.display_name !~* '(://|www\.|\.(com|net|org|vn|io|me|ly|co|app|gg|tv|xyz|info|link)(\M|/))'))) then
    alter table public.profiles validate constraint profiles_display_name_safe;
  end if;
end $$;

-- 3. A leftover profiles.own_delete policy (0001) would allow deletes again if DELETE were ever re-granted.
-- 0003 drops it; where it survived, make it match nothing.
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'own_delete') then
    alter policy own_delete on public.profiles using (false);
  end if;
end $$;

commit;
