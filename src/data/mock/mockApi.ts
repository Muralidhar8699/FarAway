// Dummy-data version of the API. Data is kept in the browser (localStorage)
// so changes survive a page refresh. "Reset demo data" brings back the seed.

import { ApiError, type DataApi } from "@/data/api";
import { canApproveTeam, getRegistrationState, normalizeName } from "@/lib/registration";
import type { Team, Tournament } from "@/types/db";
import { createSeedData, DEMO_USER_ID, type MockDb } from "./seed";

const STORAGE_KEY = "tourneyhub-mock-db-v5";
/** Same data saved under the app's old name; moved over on first load. */
const OLD_STORAGE_KEY = "crictourney-mock-db-v5";

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(OLD_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    // storage unavailable or corrupt: fall back to fresh seed data
  }
  return createSeedData();
}

let db: MockDb = load();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    localStorage.removeItem(OLD_STORAGE_KEY);
  } catch {
    // ignore: data still lives in memory for this session
  }
}

// Small delay so loading states behave like a real network call.
const delay = <T,>(value: T, ms = 150) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export const mockApi: DataApi = {
  async getCurrentUserId() {
    return DEMO_USER_ID;
  },

  async listTournaments() {
    const list = [...db.tournaments].sort((a, b) => a.start_date.localeCompare(b.start_date));
    return delay(list);
  },

  async getTournament(id) {
    return delay(db.tournaments.find((t) => t.id === id) ?? null);
  },

  async getTournamentByInviteCode(code) {
    const wanted = code.trim().toUpperCase();
    return delay(db.tournaments.find((t) => t.invite_code === wanted) ?? null);
  },

  async createTournament(input, options) {
    const tournament: Tournament = {
      ...input,
      id: makeId("tour"),
      invite_code: makeInviteCode(),
      created_by: DEMO_USER_ID,
      created_at: new Date().toISOString(),
      status: options?.openRegistration ? "registration" : "draft",
    };
    db.tournaments.push(tournament);
    db.tournament_members.push({
      tournament_id: tournament.id,
      user_id: DEMO_USER_ID,
      role: "organizer",
    });
    save();
    return delay(tournament);
  },

  async updateTournament(id, changes) {
    const index = db.tournaments.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Tournament not found");
    db.tournaments[index] = { ...db.tournaments[index], ...changes, id };
    save();
    return delay(db.tournaments[index]);
  },

  async listTeams(tournamentId) {
    return delay(db.teams.filter((t) => t.tournament_id === tournamentId));
  },

  async getTeam(id) {
    return delay(db.teams.find((t) => t.id === id) ?? null);
  },

  async listSquad(teamId) {
    const squad = db.squad_members
      .filter((s) => s.team_id === teamId)
      .map((s) => ({ ...s, player: db.players.find((p) => p.id === s.player_id)! }))
      .filter((s) => s.player);
    return delay(squad);
  },

  async listMatches(tournamentId) {
    const list = db.matches
      .filter((m) => m.tournament_id === tournamentId)
      .sort((a, b) => a.match_number - b.match_number);
    return delay(list);
  },

  async createTeam(tournamentId, input) {
    const tournament = db.tournaments.find((t) => t.id === tournamentId);
    if (!tournament) throw new ApiError("Tournament not found.");
    const state = getRegistrationState(tournament, db.teams);
    if (!state.open) throw new ApiError(state.message);

    const others = db.teams.filter((t) => t.tournament_id === tournamentId && t.status !== "rejected");
    if (others.some((t) => normalizeName(t.name) === normalizeName(input.name))) {
      throw new ApiError(`A team called "${input.name.trim()}" is already registered.`);
    }
    const shortName = input.short_name.trim().toUpperCase();
    if (others.some((t) => t.short_name === shortName)) {
      throw new ApiError(`The short name "${shortName}" is already taken.`);
    }

    const team: Team = {
      id: makeId("team"),
      tournament_id: tournamentId,
      name: input.name.trim().replace(/\s+/g, " "),
      short_name: shortName,
      logo_url: input.logo_url,
      primary_color: input.primary_color,
      home_ground: input.home_ground?.trim() || null,
      owner_id: DEMO_USER_ID,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    db.teams.push(team);
    save();
    return delay(team);
  },

  async setTeamStatus(teamId, status) {
    const team = db.teams.find((t) => t.id === teamId);
    if (!team) throw new ApiError("Team not found.");
    const tournament = db.tournaments.find((t) => t.id === team.tournament_id);
    if (!tournament || tournament.created_by !== DEMO_USER_ID) {
      throw new ApiError("Only the organizer can approve or reject teams.");
    }
    if (status === "approved" && team.status !== "approved" && !canApproveTeam(tournament, db.teams)) {
      throw new ApiError(`Can't approve: the tournament already has ${tournament.max_teams} approved teams.`);
    }
    team.status = status;
    save();
    return delay(team);
  },

  async resetDemoData() {
    db = createSeedData();
    save();
    return delay(undefined);
  },
};
