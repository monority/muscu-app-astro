-- Schema Muscu App
-- Run this in Supabase SQL Editor

create table if not exists sessions (
  id bigint primary key generated always as identity,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text
);

create table if not exists exercises (
  id bigint primary key generated always as identity,
  name text not null,
  category text,
  default_rest_s int not null default 90,
  created_at timestamptz not null default now()
);

create table if not exists exercise_sets (
  id bigint primary key generated always as identity,
  session_id bigint not null references sessions(id) on delete cascade,
  exercise_id bigint not null references exercises(id) on delete cascade,
  set_number int not null,
  weight_kg real not null,
  reps int not null,
  rest_s int,
  notes text,
  completed_at timestamptz not null default now()
);

create index if not exists idx_sets_session on exercise_sets(session_id);
create index if not exists idx_sets_completed on exercise_sets(completed_at desc);

-- Enable RLS (optional, data is user-specific)
alter table sessions enable row level security;
alter table exercises enable row level security;
alter table exercise_sets enable row level security;

-- Public access for now (no auth)
create policy "Public access" on sessions for all using (true) with check (true);
create policy "Public access" on exercises for all using (true) with check (true);
create policy "Public access" on exercise_sets for all using (true) with check (true);
