// Row types: these match the tables in supabase/schema.sql one to one.

export type TournamentMode = "gully" | "professional";
export type TournamentFormat = "league_playoffs" | "league_semis" | "knockout";
export type TournamentStatus = "draft" | "registration" | "ongoing" | "completed";
export type MemberRole = "organizer" | "team_owner" | "scorer";
export type TeamStatus = "pending" | "approved" | "rejected";
export type PlayerRole = "batter" | "bowler" | "all_rounder" | "wicket_keeper";
export type BattingStyle = "right" | "left";
export type MatchStage =
  | "league"
  | "qualifier_1"
  | "eliminator"
  | "qualifier_2"
  | "quarter_final"
  | "semi_final"
  | "final";
export type MatchStatus = "scheduled" | "live" | "completed" | "abandoned";
/** How teams level on points are separated, in the organizer's chosen order. */
export type TieBreaker = "wins" | "nrr" | "head_to_head";
export type ExtraType = "wide" | "no_ball" | "bye" | "leg_bye";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
}

export interface Tournament {
  id: string;
  name: string;
  season: string;
  logo_url: string | null;
  mode: TournamentMode;
  format: TournamentFormat;
  league_rounds: 1 | 2; // play each team once or twice in the league stage
  start_date: string; // YYYY-MM-DD
  end_date: string;
  venues: string[];
  overs_per_innings: number;
  players_per_side: number;
  powerplay_overs: number;
  max_overs_per_bowler: number;
  wide_runs: number; // runs given for a wide (ball is re-bowled)
  no_ball_runs: number; // runs given for a no-ball (ball is re-bowled)
  free_hit_on_no_ball: boolean;
  last_man_stands: boolean; // last batter can bat alone (gully rule)
  super_over_on_tie: boolean;
  points_win: number;
  points_tie: number;
  points_no_result: number;
  tie_breakers: TieBreaker[];
  max_teams: number;
  min_squad_size: number;
  max_squad_size: number;
  invite_code: string;
  registration_deadline: string | null; // ISO timestamp
  status: TournamentStatus;
  created_by: string;
  created_at: string;
}

export interface TournamentMember {
  tournament_id: string;
  user_id: string;
  role: MemberRole;
}

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  primary_color: string;
  home_ground: string | null;
  owner_id: string;
  status: TeamStatus;
  created_at: string;
}

export interface Player {
  id: string;
  full_name: string;
  photo_url: string | null;
  role: PlayerRole;
  batting_style: BattingStyle;
  bowling_style: string | null;
  created_by: string;
}

export interface SquadMember {
  team_id: string;
  player_id: string;
  jersey_number: number | null;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_wicket_keeper: boolean;
}

export interface Match {
  id: string;
  tournament_id: string;
  stage: MatchStage;
  match_number: number;
  team_a_id: string | null;
  team_b_id: string | null;
  venue: string | null;
  scheduled_at: string | null;
  status: MatchStatus;
  toss_winner_id: string | null;
  toss_decision: "bat" | "bowl" | null;
  winner_id: string | null;
  result_text: string | null;
  player_of_match_id: string | null;
}

export interface Ball {
  id: number;
  match_id: string;
  innings: 1 | 2 | 3 | 4; // 3 and 4 = super over
  over_number: number;
  ball_in_over: number;
  batter_id: string;
  non_striker_id: string;
  bowler_id: string;
  runs: number;
  extra_type: ExtraType | null;
  extra_runs: number;
  is_wicket: boolean;
  wicket_type: string | null;
  dismissed_player_id: string | null;
  fielder_id: string | null;
  created_at: string;
}

/** A squad member joined with their player profile, for team pages. */
export type SquadPlayer = SquadMember & { player: Player };
