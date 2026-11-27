-- CricTourney database schema.
-- Matches src/types/db.ts one to one. Not run yet: the app uses dummy data
-- (src/data/mock) until a Supabase project is connected.
-- To use: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.

-- ---------- Users ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  phone text
);

-- ---------- Tournaments ----------
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season text not null,
  logo_url text,
  mode text not null default 'gully' check (mode in ('gully', 'professional')),
  format text not null default 'league_playoffs'
    check (format in ('league_playoffs', 'league_semis', 'knockout')),
  league_rounds int not null default 1 check (league_rounds in (1, 2)),
  start_date date not null,
  end_date date not null,
  venues text[] not null default '{}',
  overs_per_innings int not null default 20 check (overs_per_innings between 1 and 50),
  players_per_side int not null default 11 check (players_per_side between 2 and 11),
  powerplay_overs int not null default 6,
  max_overs_per_bowler int not null default 4,
  wide_runs int not null default 1 check (wide_runs between 0 and 5),
  no_ball_runs int not null default 1 check (no_ball_runs between 0 and 5),
  free_hit_on_no_ball boolean not null default true,
  last_man_stands boolean not null default false,
  super_over_on_tie boolean not null default true,
  points_win int not null default 2,
  points_tie int not null default 1,
  points_no_result int not null default 1,
  tie_breakers text[] not null default '{wins,nrr,head_to_head}'
    check (tie_breakers <@ array['wins', 'nrr', 'head_to_head']),
  max_teams int not null default 8,
  min_squad_size int not null default 11,
  max_squad_size int not null default 15,
  invite_code text not null unique,
  registration_deadline timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'registration', 'ongoing', 'completed')),
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (max_teams between 2 and 32),
  check (min_squad_size >= players_per_side and max_squad_size between min_squad_size and 30),
  check (points_win >= 1 and points_tie between 0 and points_win
         and points_no_result between 0 and points_win),
  check (format = 'knockout' or max_teams >= 4),
  check (powerplay_overs between 0 and overs_per_innings),
  check (max_overs_per_bowler between 1 and overs_per_innings),
  check (max_overs_per_bowler * players_per_side >= overs_per_innings)
);

create table tournament_members (
  tournament_id uuid not null references tournaments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('organizer', 'team_owner', 'scorer')),
  primary key (tournament_id, user_id, role)
);

-- ---------- Teams & players ----------
create table teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  short_name text not null,
  logo_url text,
  primary_color text not null default '#2563eb',
  home_ground text,
  owner_id uuid not null references auth.users(id) default auth.uid(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (tournament_id, name),
  unique (tournament_id, short_name)
);

-- Players exist on their own so career stats can span tournaments.
create table players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  photo_url text,
  role text not null check (role in ('batter', 'bowler', 'all_rounder', 'wicket_keeper')),
  batting_style text not null default 'right' check (batting_style in ('right', 'left')),
  bowling_style text,
  created_by uuid not null references auth.users(id) default auth.uid()
);

create table squad_members (
  team_id uuid not null references teams(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  jersey_number int,
  is_captain boolean not null default false,
  is_vice_captain boolean not null default false,
  is_wicket_keeper boolean not null default false,
  primary key (team_id, player_id)
);

-- ---------- Matches & scoring ----------
create table matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  stage text not null default 'league' check (stage in (
    'league', 'qualifier_1', 'eliminator', 'qualifier_2', 'quarter_final', 'semi_final', 'final')),
  match_number int not null,
  team_a_id uuid references teams(id),
  team_b_id uuid references teams(id),
  venue text,
  scheduled_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'completed', 'abandoned')),
  toss_winner_id uuid references teams(id),
  toss_decision text check (toss_decision in ('bat', 'bowl')),
  winner_id uuid references teams(id),
  result_text text,
  player_of_match_id uuid references players(id),
  unique (tournament_id, match_number)
);

-- One row per delivery. Scorecards, NRR, points table and stats are all calculated from these.
create table balls (
  id bigint generated always as identity primary key,
  match_id uuid not null references matches(id) on delete cascade,
  innings int not null check (innings between 1 and 4), -- 3 and 4 = super over
  over_number int not null,
  ball_in_over int not null,
  batter_id uuid not null references players(id),
  non_striker_id uuid not null references players(id),
  bowler_id uuid not null references players(id),
  runs int not null default 0,
  extra_type text check (extra_type in ('wide', 'no_ball', 'bye', 'leg_bye')),
  extra_runs int not null default 0,
  is_wicket boolean not null default false,
  wicket_type text,
  dismissed_player_id uuid references players(id),
  fielder_id uuid references players(id),
  created_at timestamptz not null default now()
);

create index on teams (tournament_id);
create index on matches (tournament_id);
create index on balls (match_id, innings, over_number, ball_in_over);

-- ---------- Security (Row Level Security) ----------
-- Everyone can read (viewers need no login). Only the right people can write.

create function is_organizer(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tournament_members
                 where tournament_id = t and user_id = auth.uid() and role = 'organizer');
$$;

create function can_score(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from matches mt join tournament_members tm on tm.tournament_id = mt.tournament_id
                 where mt.id = m and tm.user_id = auth.uid() and tm.role in ('organizer', 'scorer'));
$$;

alter table profiles enable row level security;
alter table tournaments enable row level security;
alter table tournament_members enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table squad_members enable row level security;
alter table matches enable row level security;
alter table balls enable row level security;

create policy "read all" on profiles for select using (true);
create policy "read all" on tournaments for select using (true);
create policy "read all" on tournament_members for select using (true);
create policy "read all" on teams for select using (true);
create policy "read all" on players for select using (true);
create policy "read all" on squad_members for select using (true);
create policy "read all" on matches for select using (true);
create policy "read all" on balls for select using (true);

create policy "own profile" on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

create policy "create tournament" on tournaments for insert
  with check (created_by = auth.uid());
create policy "organizer edits" on tournaments for update using (is_organizer(id));
create policy "organizer deletes" on tournaments for delete using (is_organizer(id));

create policy "organizer manages members" on tournament_members for all
  using (is_organizer(tournament_id)) with check (is_organizer(tournament_id));
create policy "creator becomes organizer" on tournament_members for insert
  with check (user_id = auth.uid() and role = 'organizer'
              and exists (select 1 from tournaments t where t.id = tournament_id and t.created_by = auth.uid()));

create policy "owner registers team" on teams for insert
  with check (owner_id = auth.uid() and status = 'pending');
-- TODO Phase 3: add a trigger so only the organizer can change teams.status.
create policy "owner or organizer edits team" on teams for update
  using (owner_id = auth.uid() or is_organizer(tournament_id));
create policy "organizer deletes team" on teams for delete using (is_organizer(tournament_id));

create policy "create players" on players for insert with check (created_by = auth.uid());
create policy "creator edits player" on players for update using (created_by = auth.uid());

create policy "owner or organizer manages squad" on squad_members for all
  using (exists (select 1 from teams t where t.id = team_id
                 and (t.owner_id = auth.uid() or is_organizer(t.tournament_id))));

create policy "organizer manages matches" on matches for all
  using (is_organizer(tournament_id)) with check (is_organizer(tournament_id));
create policy "scorer updates match" on matches for update using (can_score(id));

create policy "scorer records balls" on balls for all
  using (can_score(match_id)) with check (can_score(match_id));

-- ---------- Realtime (live scores) ----------
alter publication supabase_realtime add table balls, matches;
