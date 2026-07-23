-- Schema Muscu App v2 — User isolation
-- Idempotent: works on fresh DB and existing DB
-- Run this in Supabase SQL Editor

-- Profiles (1:1 with auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_rest_s int not null default 90,
  created_at timestamptz not null default now()
);

-- Sessions
create table if not exists sessions (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text
);

-- Exercises
create table if not exists exercises (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text,
  default_rest_s int not null default 90,
  created_at timestamptz not null default now()
);

-- Exercise sets
create table if not exists exercise_sets (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete cascade,
  session_id bigint not null references sessions(id) on delete cascade,
  exercise_id bigint not null references exercises(id) on delete cascade,
  set_number int not null,
  weight_kg real not null,
  reps int not null,
  rest_s int,
  notes text,
  completed_at timestamptz not null default now()
);

-- Add user_id columns if missing (for existing DBs)
alter table sessions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table exercises add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table exercise_sets add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Indexes
create index if not exists idx_sessions_user on sessions(user_id);
create index if not exists idx_exercises_user on exercises(user_id);
create index if not exists idx_sets_user on exercise_sets(user_id);
create index if not exists idx_sets_session on exercise_sets(session_id);
create index if not exists idx_sets_completed on exercise_sets(completed_at desc);

-- Enable RLS
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table exercises enable row level security;
alter table exercise_sets enable row level security;

-- Drop old wide-open policies
drop policy if exists "Public access" on sessions;
drop policy if exists "Public access" on exercises;
drop policy if exists "Public access" on exercise_sets;

-- RLS policies — user-scoped
drop policy if exists "Users own their profile" on profiles;
create policy "Users own their profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users own their sessions" on sessions;
create policy "Users own their sessions" on sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their exercises" on exercises;
create policy "Users own their exercises" on exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users own their sets" on exercise_sets;
create policy "Users own their sets" on exercise_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
