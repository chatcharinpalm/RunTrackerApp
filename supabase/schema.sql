-- Run this once in the Supabase project's SQL editor (Phase 3 backend).
-- Mirrors the local SQLite schema in src/db/schema.ts, plus user_id/RLS
-- so each account only ever sees its own rows.

create table if not exists public.activities (
  id text primary key,
  user_id uuid references auth.users (id) not null,
  type text not null,
  start_time bigint not null,
  end_time bigint,
  total_distance double precision not null default 0,
  avg_speed double precision not null default 0,
  max_speed double precision not null default 0,
  calories_burned double precision not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.location_points (
  id bigint generated always as identity primary key,
  activity_id text references public.activities (id) on delete cascade not null,
  user_id uuid references auth.users (id) not null,
  latitude double precision not null,
  longitude double precision not null,
  timestamp bigint not null,
  accuracy double precision
);

create index if not exists idx_location_points_activity on public.location_points (activity_id);

create table if not exists public.profiles (
  id uuid references auth.users (id) primary key,
  weight_kg double precision not null default 65,
  display_name text,
  updated_at timestamptz not null default now()
);

alter table public.activities enable row level security;
alter table public.location_points enable row level security;
alter table public.profiles enable row level security;

create policy "activities: owner rw" on public.activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "location_points: owner rw" on public.location_points
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "profiles: owner rw" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
