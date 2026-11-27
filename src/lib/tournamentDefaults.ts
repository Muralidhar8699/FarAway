import type { NewTournament } from "@/data/api";

/**
 * Rules used for a new tournament until the organizer changes them.
 * Phase 2.2–2.6 add the screens to edit these; for now every new
 * tournament starts with standard T20 rules.
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
  super_over_on_tie: true,
  points_win: 2,
  points_tie: 1,
  points_no_result: 1,
  max_teams: 8,
  min_squad_size: 11,
  max_squad_size: 15,
  registration_deadline: null,
};
