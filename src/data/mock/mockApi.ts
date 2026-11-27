// Dummy-data version of the API. Data is kept in the browser (localStorage)
// so changes survive a page refresh. "Reset demo data" brings back the seed.

import type { DataApi } from "@/data/api";
import type { Tournament } from "@/types/db";
import { createSeedData, DEMO_USER_ID, type MockDb } from "./seed";

const STORAGE_KEY = "crictourney-mock-db-v5";

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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

  async resetDemoData() {
    db = createSeedData();
    save();
    return delay(undefined);
  },
};
