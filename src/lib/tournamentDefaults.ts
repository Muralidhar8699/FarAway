import type { NewTournament } from "@/data/api";
import type { TournamentMode } from "@/types/db";

/** The match rules a mode preset fills in. */
export type MatchRules = Pick<
  NewTournament,
  | "overs_per_innings"
  | "players_per_side"
  | "powerplay_overs"
  | "max_overs_per_bowler"
  | "wide_runs"
  | "no_ball_runs"
  | "free_hit_on_no_ball"
  | "last_man_stands"
  | "super_over_on_tie"
>;

export const MATCH_RULE_KEYS = [
  "overs_per_innings",
  "players_per_side",
  "powerplay_overs",
  "max_overs_per_bowler",
  "wide_runs",
  "no_ball_runs",
  "free_hit_on_no_ball",
  "last_man_stands",
  "super_over_on_tie",
] as const satisfies readonly (keyof MatchRules)[];

/** Picking a mode fills in these rules. The organizer can still change any of them. */
export const RULE_PRESETS: Record<TournamentMode, MatchRules> = {
  gully: {
    overs_per_innings: 6,
    players_per_side: 8,
    powerplay_overs: 2,
    max_overs_per_bowler: 2,
    wide_runs: 1,
    no_ball_runs: 1,
    free_hit_on_no_ball: false,
    last_man_stands: true,
    super_over_on_tie: true,
  },
  professional: {
    overs_per_innings: 20,
    players_per_side: 11,
    powerplay_overs: 6,
    max_overs_per_bowler: 4,
    wide_runs: 1,
    no_ball_runs: 1,
    free_hit_on_no_ball: true,
    last_man_stands: false,
    super_over_on_tie: true,
  },
};

export const DEFAULT_MODE: TournamentMode = "gully";

/** Everything except the details step, for a new tournament. */
export const DEFAULT_TOURNAMENT_RULES: Omit<
  NewTournament,
  "name" | "season" | "logo_url" | "start_date" | "end_date" | "venues"
> = {
  mode: DEFAULT_MODE,
  ...RULE_PRESETS[DEFAULT_MODE],
  format: "league_playoffs",
  league_rounds: 1,
  max_teams: 8,
  points_win: 2,
  points_tie: 1,
  points_no_result: 1,
  tie_breakers: ["wins", "nrr", "head_to_head"],
  min_squad_size: 11,
  max_squad_size: 15,
  registration_deadline: null,
};
