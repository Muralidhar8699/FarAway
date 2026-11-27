// The only way pages read or write data.
// Today it is backed by dummy data (mock/mockApi.ts). When Supabase is ready,
// add supabaseApi.ts with the same functions and switch the export below.

import type { Match, Player, SquadPlayer, Team, Tournament } from "@/types/db";
import type { ScheduleOptions } from "@/lib/fixtures";
import type { SquadRole } from "@/lib/squad";
import { mockApi } from "./mock/mockApi";

export type NewTournament = Omit<
  Tournament,
  "id" | "invite_code" | "created_by" | "created_at" | "status"
>;

/** A player's profile plus their shirt number in this squad. */
export type SquadPlayerInput = Pick<Player, "full_name" | "photo_url" | "role" | "batting_style" | "bowling_style"> & {
  jersey_number: number | null;
};

export type NewTeam = Pick<Team, "name" | "short_name" | "logo_url" | "primary_color" | "home_ground">;

/** An error with a message that is safe to show to the user. */
export class ApiError extends Error {}

export interface DataApi {
  /** The logged-in user's id, or null. Dummy data: always the demo organizer. */
  getCurrentUserId(): Promise<string | null>;

  listTournaments(): Promise<Tournament[]>;
  getTournament(id: string): Promise<Tournament | null>;
  getTournamentByInviteCode(code: string): Promise<Tournament | null>;
  /** Saves as a draft, or opens team registration straight away. */
  createTournament(input: NewTournament, options?: { openRegistration?: boolean }): Promise<Tournament>;
  updateTournament(id: string, changes: Partial<Tournament>): Promise<Tournament>;

  listTeams(tournamentId: string): Promise<Team[]>;
  getTeam(id: string): Promise<Team | null>;
  listSquad(teamId: string): Promise<SquadPlayer[]>;
  /** Registers a team as "pending". Fails if registration is closed/full or the name is taken. */
  createTeam(tournamentId: string, input: NewTeam): Promise<Team>;
  /** Team owner or organizer. Fails if the squad is full or locked, or the jersey number is taken. */
  addSquadPlayer(teamId: string, input: SquadPlayerInput): Promise<SquadPlayer>;
  updateSquadPlayer(teamId: string, playerId: string, input: SquadPlayerInput): Promise<SquadPlayer>;
  removeSquadPlayer(teamId: string, playerId: string): Promise<void>;
  /** Makes this player captain / vice-captain / wicketkeeper, taking the role from anyone else. */
  setSquadRole(teamId: string, playerId: string, role: SquadRole): Promise<void>;
  /** Organizer only: approve or reject a team. */
  setTeamStatus(teamId: string, status: "approved" | "rejected"): Promise<Team>;

  listMatches(tournamentId: string): Promise<Match[]>;
  /**
   * Organizer only. Replaces all fixtures with new ones for the approved teams and
   * closes registration. Not allowed once any match has started.
   */
  generateFixtures(tournamentId: string, schedule: ScheduleOptions): Promise<Match[]>;
  /** Organizer only, for matches that haven't started: change date/time and venue. */
  rescheduleMatch(matchId: string, changes: { scheduled_at: string; venue: string | null }): Promise<Match>;

  /** Dummy-data only: put the demo data back to how it started. */
  resetDemoData(): Promise<void>;
}

export const api: DataApi = mockApi;

/** True while the app runs on dummy data instead of Supabase. */
export const USING_MOCK_DATA = true;
