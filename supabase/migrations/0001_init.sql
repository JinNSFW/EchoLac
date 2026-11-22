-- EchoLạc: tables for local-first progress sync (Supabase, Postgres 15+). PRD §8, §9.
-- Every signed-in user sees and writes only their own rows. Anonymous users sign in with role
-- `authenticated` (JWT claim is_anonymous = true) and are allowed. Role `anon` (no session) gets nothing.
-- No audio is stored: there is no audio column and no storage bucket (PRD §9).
-- Run once on a new project: SQL Editor, or `supabase db push`. Steps: docs/supabase-setup.md.

-- Keep updated_at when the client sends a new one (lib/cloud/sync.js merges by the device's stamp);
-- otherwise stamp server time.
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.updated_at is not distinct from old.updated_at then
    new.updated_at := now();
  end if;
  return new;
end
$$;

-- Length and size caps limit what one anonymous session can write per row.
create table public.profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  -- The bound only rises over time, so rows that pass today keep passing.
  birth_year int check (birth_year between 1920 and extract(year from current_date)),
  guardian_consent boolean not null default false,
  level text check (level in ('A1', 'A2', 'B1', 'B2', 'C1')),
  accent text not null default 'en-US' check (accent in ('en-US', 'en-GB')),
  voice_upload_consent_at timestamptz,
  place_id text check (char_length(place_id) <= 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.unit_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  unit_id text not null check (char_length(unit_id) <= 128),
  status text not null default 'open' check (status in ('open', 'tried', 'passed')),
  perception_best real check (perception_best between 0 and 100),
  items_passed int not null default 0 check (items_passed >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, unit_id)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(), -- the client sends its own id so a retried upsert is a no-op
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id text not null check (char_length(item_id) <= 128),
  unit_id text check (char_length(unit_id) <= 128),
  score int check (score between 0 and 100),
  reference_score int check (reference_score between 0 and 100),
  engine text not null check (engine in ('local', 'remote', 'none')),
  categories text[] not null default '{}' check (cardinality(categories) <= 20),
  created_at timestamptz not null default now()
);

create table public.error_items (
  id text not null check (char_length(id) <= 128),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id text check (char_length(item_id) <= 128),
  category text not null check (char_length(category) <= 64),
  word text check (char_length(word) <= 300),
  best int check (best between 0 and 100),
  attempts int not null default 0 check (attempts >= 0),
  days date[] not null default '{}' check (cardinality(days) <= 1000),
  status text not null default 'open' check (status in ('open', 'mastered')),
  source text not null check (source in ('pron', 'roleplay', 'seed')),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.srs_cards (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id text not null check (char_length(item_id) <= 128),
  fsrs_state jsonb not null default '{}' check (octet_length(fsrs_state::text) <= 4096),
  due timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index unit_progress_user_updated on public.unit_progress (user_id, updated_at);
create index attempts_user_created on public.attempts (user_id, created_at);
create index error_items_user_updated on public.error_items (user_id, updated_at);
create index srs_cards_user_updated on public.srs_cards (user_id, updated_at);

-- Same rule on every table: owner column = (select auth.uid()), for role authenticated only.
-- `(select auth.uid())` is evaluated once per statement instead of once per row (Supabase RLS guide).
-- Explicit grants: new Supabase projects no longer expose public tables to the Data API by default,
-- and older projects granted anon by default, so both are set here.
do $$
declare
  t text;
  k text;
begin
  foreach t in array array['profiles', 'unit_progress', 'attempts', 'error_items', 'srs_cards'] loop
    k := case t when 'profiles' then 'id' else 'user_id' end;
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy own_select on public.%I for select to authenticated using (%I = (select auth.uid()))', t, k);
    execute format('create policy own_insert on public.%I for insert to authenticated with check (%I = (select auth.uid()))', t, k);
    execute format('create policy own_update on public.%I for update to authenticated using (%2$I = (select auth.uid())) with check (%2$I = (select auth.uid()))', t, k);
    execute format('create policy own_delete on public.%I for delete to authenticated using (%I = (select auth.uid()))', t, k);
    if t <> 'attempts' then
      execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
    end if;
  end loop;
end
$$;
