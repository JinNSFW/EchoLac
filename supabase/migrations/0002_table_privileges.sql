-- RLS does not govern TRUNCATE or REFERENCES. Remove inherited default grants
-- from older Supabase projects, then expose only the four RLS-controlled operations.
-- Existing projects that ran 0001 must apply this migration once; it changes no rows.
begin;
do $$
declare t text;
begin
  foreach t in array array['profiles', 'unit_progress', 'attempts', 'error_items', 'srs_cards'] loop
    execute format('revoke all privileges on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
  end loop;
end
$$;
commit;
