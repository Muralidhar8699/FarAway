// The only way pages read or write data.
// Today it is backed by dummy data (mock/mockApi.ts). When Supabase is ready,
// add supabaseApi.ts with the same functions and switch the export below.

import type { Match, SquadPlayer, Team, Tournament } from "@/types/db";
import { mockApi } from "./mock/mockApi";

export type NewTournament = Omit<
  Tournament,
  "id" | "invite_code" | "created_by" | "created_at" | "status"
>;

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

  listMatches(tournamentId: string): Promise<Match[]>;

  /** Dummy-data only: put the demo data back to how it started. */
  resetDemoData(): Promise<void>;
}

export const api: DataApi = mockApi;

/** True while the app runs on dummy data instead of Supabase. */
export const USING_MOCK_DATA = true;
