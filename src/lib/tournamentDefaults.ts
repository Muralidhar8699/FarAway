import type { NewTournament } from "@/data/api";

/**
 * Rules used for a new tournament until the organizer changes them.
 * The organizer edits these in the Create Tournament steps.
 */
export const DEFAULT_TOURNAMENT_RULES: Omit<
  NewTournament,
  "name" | "season" | "logo_url" | "start_date" | "end_date" | "venues"
> = {
  mode: "professional",
  format: "league_playoffs",
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
  registration_deadline: null,
};
