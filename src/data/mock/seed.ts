// Dummy data used until the real Supabase project is connected.
// All names are made up.

import type {
  Match,
  Player,
  PlayerRole,
  Profile,
  SquadMember,
  Team,
  Tournament,
  TournamentMember,
} from "@/types/db";

export interface MockDb {
  profiles: Profile[];
  tournaments: Tournament[];
  tournament_members: TournamentMember[];
  teams: Team[];
  players: Player[];
  squad_members: SquadMember[];
  matches: Match[];
}

/** The pretend logged-in user (until Phase 1 adds real login). */
export const DEMO_USER_ID = "user-demo";

const CREATED_AT = "2026-11-01T10:00:00.000Z";

// Small seeded random generator so the dummy data is the same on every load.
function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "Arjun", "Rohan", "Vikram", "Karthik", "Sai", "Rahul", "Aditya", "Nikhil", "Pranav", "Harsha",
  "Manoj", "Suresh", "Kiran", "Ravi", "Tarun", "Varun", "Ajay", "Deepak", "Gopal", "Imran",
  "Javed", "Lokesh", "Mahesh", "Naveen", "Prakash", "Rajesh", "Sandeep", "Teja", "Uday", "Yash",
  "Abhishek", "Bharath", "Chaitanya", "Dinesh", "Faizan", "Ganesh", "Hemanth", "Jagadeesh", "Kunal", "Mohit",
];
const LAST_NAMES = [
  "Reddy", "Sharma", "Rao", "Kumar", "Naidu", "Verma", "Patel", "Iyer", "Singh", "Varma",
  "Khan", "Chowdary", "Goud", "Nair", "Yadav", "Joshi", "Shetty", "Menon", "Desai", "Pillai",
];

const BOWLING_STYLES = ["Right-arm fast", "Right-arm medium", "Left-arm fast", "Off spin", "Leg spin", "Left-arm spin"];

// Roles by squad position: 1 keeper, 5 batters, 3 all-rounders, then bowlers.
function roleForSlot(slot: number): PlayerRole {
  if (slot === 0) return "wicket_keeper";
  if (slot <= 5) return "batter";
  if (slot <= 8) return "all_rounder";
  return "bowler";
}

const rand = seededRandom(2026);
const namePairs: string[] = [];
for (const first of FIRST_NAMES) for (const last of LAST_NAMES) namePairs.push(`${first} ${last}`);
for (let i = namePairs.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [namePairs[i], namePairs[j]] = [namePairs[j], namePairs[i]];
}
let nextName = 0;

interface TeamSeed {
  name: string;
  short: string;
  color: string;
  ground: string;
  status?: Team["status"];
}

function buildTeams(tournamentId: string, seeds: TeamSeed[], squadSize: number) {
  const teams: Team[] = [];
  const players: Player[] = [];
  const squad: SquadMember[] = [];

  seeds.forEach((s, ti) => {
    const teamId = `${tournamentId}-team-${ti + 1}`;
    teams.push({
      id: teamId,
      tournament_id: tournamentId,
      name: s.name,
      short_name: s.short,
      logo_url: null,
      primary_color: s.color,
      home_ground: s.ground,
      owner_id: ti === 0 ? DEMO_USER_ID : `owner-${teamId}`,
      status: s.status ?? "approved",
      created_at: CREATED_AT,
    });

    for (let slot = 0; slot < squadSize; slot++) {
      const role = roleForSlot(slot);
      const playerId = `${teamId}-p${slot + 1}`;
      players.push({
        id: playerId,
        full_name: namePairs[nextName++],
        photo_url: null,
        role,
        batting_style: rand() < 0.3 ? "left" : "right",
        bowling_style:
          role === "bowler" || role === "all_rounder"
            ? BOWLING_STYLES[Math.floor(rand() * BOWLING_STYLES.length)]
            : null,
        created_by: DEMO_USER_ID,
      });
      squad.push({
        team_id: teamId,
        player_id: playerId,
        jersey_number: slot === 0 ? 7 : slot * 3 + ti + 1,
        is_captain: slot === 1,
        is_vice_captain: slot === 6,
        is_wicket_keeper: slot === 0,
      });
    }
  });

  return { teams, players, squad };
}

function baseTournament(t: Partial<Tournament> & Pick<Tournament, "id" | "name">): Tournament {
  return {
    season: "2026",
    logo_url: null,
    mode: "professional",
    format: "league_playoffs",
    start_date: "2026-12-05",
    end_date: "2026-12-28",
    venues: [],
    overs_per_innings: 20,
    players_per_side: 11,
    powerplay_overs: 6,
    max_overs_per_bowler: 4,
    wide_runs: 1,
    no_ball_runs: 1,
    free_hit_on_no_ball: true,
    last_man_stands: false,
    super_over_on_tie: true,
    points_win: 2,
    points_tie: 1,
    points_no_result: 1,
    max_teams: 8,
    min_squad_size: 11,
    max_squad_size: 15,
    invite_code: "DEMO00",
    registration_deadline: null,
    status: "draft",
    created_by: DEMO_USER_ID,
    created_at: CREATED_AT,
    ...t,
  };
}

export function createSeedData(): MockDb {
  nextName = 0;

  // 1. Professional, IPL-style league + playoffs, already under way.
  const hpl = baseTournament({
    id: "hyd-t20",
    name: "Hyderabad T20 Championship",
    mode: "professional",
    format: "league_playoffs",
    start_date: "2026-11-20",
    end_date: "2026-12-20",
    venues: ["Gymkhana Ground", "LB Stadium", "Uppal Practice Ground"],
    invite_code: "HYD26X",
    registration_deadline: "2026-11-15T18:00:00.000Z",
    status: "ongoing",
  });
  const hplTeams = buildTeams(
    hpl.id,
    [
      { name: "Charminar Chargers", short: "CC", color: "#f59e0b", ground: "Gymkhana Ground" },
      { name: "Golconda Gladiators", short: "GG", color: "#2563eb", ground: "LB Stadium" },
      { name: "Hussain Sagar Hawks", short: "HSH", color: "#0d9488", ground: "Uppal Practice Ground" },
      { name: "Secunderabad Strikers", short: "SS", color: "#dc2626", ground: "Gymkhana Ground" },
      { name: "Banjara Blasters", short: "BB", color: "#7c3aed", ground: "LB Stadium" },
      { name: "Kukatpally Kings", short: "KK", color: "#ca8a04", ground: "Uppal Practice Ground" },
      { name: "Madhapur Mavericks", short: "MM", color: "#db2777", ground: "Gymkhana Ground" },
      { name: "Gachibowli Giants", short: "GBG", color: "#16a34a", ground: "LB Stadium" },
    ],
    15
  );

  const t = (n: number) => `${hpl.id}-team-${n}`;
  const hplMatches: Match[] = [
    { n: 1, a: 1, b: 2, at: "2026-11-20T14:00:00.000Z", status: "completed", w: 1, r: "Charminar Chargers won by 18 runs" },
    { n: 2, a: 3, b: 4, at: "2026-11-21T14:00:00.000Z", status: "completed", w: 4, r: "Secunderabad Strikers won by 6 wickets" },
    { n: 3, a: 5, b: 6, at: "2026-11-22T14:00:00.000Z", status: "completed", w: 5, r: "Banjara Blasters won by 4 wickets" },
    { n: 4, a: 7, b: 8, at: "2026-11-23T14:00:00.000Z", status: "completed", w: 8, r: "Gachibowli Giants won by 32 runs" },
    { n: 5, a: 1, b: 3, at: "2026-11-27T14:00:00.000Z", status: "live", w: null, r: null },
    { n: 6, a: 2, b: 4, at: "2026-11-28T14:00:00.000Z", status: "scheduled", w: null, r: null },
    { n: 7, a: 6, b: 8, at: "2026-11-29T14:00:00.000Z", status: "scheduled", w: null, r: null },
    { n: 8, a: 5, b: 7, at: "2026-11-30T14:00:00.000Z", status: "scheduled", w: null, r: null },
  ].map((m) => ({
    id: `${hpl.id}-m${m.n}`,
    tournament_id: hpl.id,
    stage: "league" as const,
    match_number: m.n,
    team_a_id: t(m.a),
    team_b_id: t(m.b),
    venue: hpl.venues[(m.n - 1) % hpl.venues.length],
    scheduled_at: m.at,
    status: m.status as Match["status"],
    toss_winner_id: m.status === "scheduled" ? null : t(m.a),
    toss_decision: m.status === "scheduled" ? null : ("bat" as const),
    winner_id: m.w ? t(m.w) : null,
    result_text: m.r,
    player_of_match_id: m.w ? `${t(m.w)}-p2` : null,
  }));

  // 2. Gully league + semis, teams still registering.
  const gpl = baseTournament({
    id: "gully-pl",
    name: "Gully Premier League",
    mode: "gully",
    format: "league_semis",
    start_date: "2026-12-06",
    end_date: "2026-12-13",
    venues: ["Colony Ground"],
    overs_per_innings: 6,
    players_per_side: 8,
    powerplay_overs: 2,
    max_overs_per_bowler: 2,
    last_man_stands: true,
    super_over_on_tie: true,
    max_teams: 6,
    min_squad_size: 8,
    max_squad_size: 10,
    invite_code: "GULLY6",
    registration_deadline: "2026-12-04T18:00:00.000Z",
    status: "registration",
  });
  const gplTeams = buildTeams(
    gpl.id,
    [
      { name: "Street Smashers", short: "STS", color: "#ea580c", ground: "Colony Ground" },
      { name: "Lane 4 Legends", short: "L4L", color: "#0284c7", ground: "Colony Ground" },
      { name: "Terrace Titans", short: "TT", color: "#9333ea", ground: "Colony Ground" },
      { name: "Bus Stop Bashers", short: "BSB", color: "#65a30d", ground: "Colony Ground", status: "pending" },
    ],
    10
  );

  // 3. A knockout cup still being set up by the organizer.
  const cup = baseTournament({
    id: "sunday-cup",
    name: "Sunday Street Cup",
    season: "2027",
    mode: "gully",
    format: "knockout",
    start_date: "2027-01-10",
    end_date: "2027-01-10",
    venues: ["Temple Ground"],
    overs_per_innings: 5,
    players_per_side: 7,
    powerplay_overs: 1,
    max_overs_per_bowler: 1,
    wide_runs: 1,
    no_ball_runs: 1,
    free_hit_on_no_ball: false,
    last_man_stands: true,
    max_teams: 8,
    min_squad_size: 7,
    max_squad_size: 9,
    invite_code: "SUNCUP",
    status: "draft",
  });

  return {
    profiles: [{ id: DEMO_USER_ID, full_name: "Demo Organizer", avatar_url: null, phone: null }],
    tournaments: [hpl, gpl, cup],
    tournament_members: [hpl, gpl, cup].map((x) => ({
      tournament_id: x.id,
      user_id: DEMO_USER_ID,
      role: "organizer" as const,
    })),
    teams: [...hplTeams.teams, ...gplTeams.teams],
    players: [...hplTeams.players, ...gplTeams.players],
    squad_members: [...hplTeams.squad, ...gplTeams.squad],
    matches: hplMatches,
  };
}
