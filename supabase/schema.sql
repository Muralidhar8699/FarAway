-- Cricket tournament schema (draft). Run in Supabase: SQL Editor -> New query -> Run.

create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mode text not null default 'gully' check (mode in ('gully', 'professional')),
  format text not null default 'knockout' check (format in ('knockout', 'league_knockout')),
  overs_per_innings int not null default 6,
  players_per_side int not null default 11,
  status text not null default 'setup' check (status in ('setup', 'live', 'completed')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null
);

create table players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  role text  -- batter / bowler / all-rounder / keeper
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round text not null check (round in ('league', 'quarter_final', 'semi_final', 'final')),
  match_no int not null,
  team_a uuid references teams(id),
  team_b uuid references teams(id),
  winner uuid references teams(id),
  next_match_id uuid references matches(id),  -- winner advances here (QF -> SF -> Final)
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'completed')),
  scheduled_at timestamptz
);

-- One row per ball: the scorecard, run rate and points table are calculated from these.
create table balls (
  id bigint generated always as identity primary key,
  match_id uuid not null references matches(id) on delete cascade,
  innings int not null check (innings in (1, 2)),
  over_no int not null,
  ball_no int not null,
  batter_id uuid references players(id),
  bowler_id uuid references players(id),
  runs int not null default 0,
  extra_type text check (extra_type in ('wide', 'no_ball', 'bye', 'leg_bye')),
  extra_runs int not null default 0,
  is_wicket boolean not null default false,
  wicket_type text,
  created_at timestamptz not null default now()
);

-- Security: everyone can watch, only the organizer can change their tournament.
alter table tournaments enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table matches enable row level security;
alter table balls enable row level security;

create policy "public read" on tournaments for select using (true);
create policy "public read" on teams for select using (true);
create policy "public read" on players for select using (true);
create policy "public read" on matches for select using (true);
create policy "public read" on balls for select using (true);

create policy "organizer writes" on tournaments for all
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "organizer writes" on teams for all
  using (exists (select 1 from tournaments t where t.id = tournament_id and t.created_by = auth.uid()));
create policy "organizer writes" on players for all
  using (exists (select 1 from teams tm join tournaments t on t.id = tm.tournament_id
                 where tm.id = team_id and t.created_by = auth.uid()));
create policy "organizer writes" on matches for all
  using (exists (select 1 from tournaments t where t.id = tournament_id and t.created_by = auth.uid()));
create policy "organizer writes" on balls for all
  using (exists (select 1 from matches m join tournaments t on t.id = m.tournament_id
                 where m.id = match_id and t.created_by = auth.uid()));

-- Live score updates pushed to viewers' phones.
alter publication supabase_realtime add table balls, matches;
