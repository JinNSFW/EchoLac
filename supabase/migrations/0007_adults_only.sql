-- EchoLạc's real users are adults (owner decision 26/11/2026; under-18 signups are test accounts only), so every account
-- is marked adult in server-managed app_metadata, which converse and the client AI gate read.
-- shortcut: the age is self-declared at signup; add real age verification if minors are ever admitted.
-- No DROP statements (the Supabase connector refuses them).

create or replace function private.mark_adult() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) || '{"echolac_verified_adult": true}'::jsonb;
  return new;
end $$;
revoke execute on function private.mark_adult() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'echolac_mark_adult' and tgrelid = 'auth.users'::regclass) then
    create trigger echolac_mark_adult before insert on auth.users for each row execute function private.mark_adult();
  end if;
end $$;

update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"echolac_verified_adult": true}'::jsonb
where coalesce(raw_app_meta_data ->> 'echolac_verified_adult', '') <> 'true';
