// Dummy-data version of the API. Data is kept in the browser (localStorage)
// so changes survive a page refresh. "Reset demo data" brings back the seed.

import { ApiError, type DataApi, type SquadPlayerInput } from "@/data/api";
import { canApproveTeam, getRegistrationState, normalizeName } from "@/lib/registration";
import { assignSquadRole, getSquadAccess, MAX_JERSEY_NUMBER } from "@/lib/squad";
import { buildFixtures, scheduleFixtures } from "@/lib/fixtures";
import { minTeamsFor } from "@/lib/format";
import type { Match, Player, SquadMember, SquadPlayer, Team, Tournament } from "@/types/db";
import { createSeedData, DEMO_USER_ID, type MockDb } from "./seed";

const STORAGE_KEY = "tourneyhub-mock-db-v5";
/** Same data saved under the app's old name; moved over on first load. */
const OLD_STORAGE_KEY = "crictourney-mock-db-v5";

/** Fills in fields added after the data was saved, so older saved data keeps working. */
function upgrade(saved: MockDb): MockDb {
  saved.matches = saved.matches.map((m) => ({ ...m, team_a_from: m.team_a_from ?? null, team_b_from: m.team_b_from ?? null }));
  return saved;
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(OLD_STORAGE_KEY);
    if (raw) return upgrade(JSON.parse(raw) as MockDb);
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

/** Loads a team and checks the demo user may change its squad. */
function editableSquad(teamId: string) {
  const team = db.teams.find((t) => t.id === teamId);
  if (!team) throw new ApiError("Team not found.");
  const tournament = db.tournaments.find((t) => t.id === team.tournament_id);
  if (!tournament) throw new ApiError("Tournament not found.");
  const access = getSquadAccess(tournament, team, DEMO_USER_ID);
  if (!access.canEdit) throw new ApiError(access.reason);
  return { team, tournament, squad: db.squad_members.filter((m) => m.team_id === teamId) };
}

function checkPlayerInput(input: SquadPlayerInput, squad: SquadMember[], exceptPlayerId?: string) {
  if (input.full_name.trim().length < 2) throw new ApiError("Player name must be at least 2 characters.");
  const n = input.jersey_number;
  if (n !== null) {
    if (!Number.isInteger(n) || n < 0 || n > MAX_JERSEY_NUMBER) {
      throw new ApiError(`Jersey number must be 0–${MAX_JERSEY_NUMBER}.`);
    }
    if (squad.some((m) => m.jersey_number === n && m.player_id !== exceptPlayerId)) {
      throw new ApiError(`Jersey number ${n} is already taken in this squad.`);
    }
  }
}

function toSquadPlayer(member: SquadMember): SquadPlayer {
  return { ...member, player: db.players.find((p) => p.id === member.player_id)! };
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

  async generateFixtures(tournamentId, schedule) {
    const t = db.tournaments.find((x) => x.id === tournamentId);
    if (!t) throw new ApiError("Tournament not found.");
    if (t.created_by !== DEMO_USER_ID) throw new ApiError("Only the organizer can create fixtures.");
    const existing = db.matches.filter((m) => m.tournament_id === tournamentId);
    if (existing.some((m) => m.status !== "scheduled")) {
      throw new ApiError("Matches have already started, so fixtures can't be redone.");
    }
    const teamIds = db.teams.filter((x) => x.tournament_id === tournamentId && x.status === "approved").map((x) => x.id);
    const min = minTeamsFor(t.format);
    if (teamIds.length < min) {
      throw new ApiError(`You need at least ${min} approved teams (you have ${teamIds.length}).`);
    }
    if (schedule.matchesPerDay < 1 || schedule.minutesBetween < 1) throw new ApiError("Check the schedule settings.");

    const { matches: scheduled } = scheduleFixtures(buildFixtures(t, teamIds), schedule);
    const created: Match[] = scheduled.map((d) => ({
      ...d,
      id: makeId("match"),
      tournament_id: tournamentId,
      status: "scheduled",
      toss_winner_id: null,
      toss_decision: null,
      winner_id: null,
      result_text: null,
      player_of_match_id: null,
    }));
    db.matches = [...db.matches.filter((m) => m.tournament_id !== tournamentId), ...created];
    t.status = "ongoing"; // registration closes; squads lock (organizer can still edit)
    save();
    return delay(created);
  },

  async rescheduleMatch(matchId, changes) {
    const m = db.matches.find((x) => x.id === matchId);
    if (!m) throw new ApiError("Match not found.");
    const t = db.tournaments.find((x) => x.id === m.tournament_id);
    if (!t || t.created_by !== DEMO_USER_ID) throw new ApiError("Only the organizer can reschedule matches.");
    if (m.status !== "scheduled") throw new ApiError("This match has already started.");
    if (Number.isNaN(new Date(changes.scheduled_at).getTime())) throw new ApiError("Pick a valid date and time.");
    m.scheduled_at = changes.scheduled_at;
    m.venue = changes.venue?.trim() || null;
    save();
    return delay(m);
  },

  async addSquadPlayer(teamId, input) {
    const { tournament, squad } = editableSquad(teamId);
    if (squad.length >= tournament.max_squad_size) {
      throw new ApiError(`The squad is full (${tournament.max_squad_size} players).`);
    }
    checkPlayerInput(input, squad);
    const player: Player = {
      id: makeId("player"),
      full_name: input.full_name.trim().replace(/\s+/g, " "),
      photo_url: input.photo_url,
      role: input.role,
      batting_style: input.batting_style,
      bowling_style: input.bowling_style,
      created_by: DEMO_USER_ID,
    };
    const member: SquadMember = {
      team_id: teamId,
      player_id: player.id,
      jersey_number: input.jersey_number,
      is_captain: false,
      is_vice_captain: false,
      is_wicket_keeper: false,
    };
    db.players.push(player);
    db.squad_members.push(member);
    save();
    return delay(toSquadPlayer(member));
  },

  async updateSquadPlayer(teamId, playerId, input) {
    const { squad } = editableSquad(teamId);
    const member = squad.find((m) => m.player_id === playerId);
    const player = db.players.find((p) => p.id === playerId);
    if (!member || !player) throw new ApiError("Player not found in this squad.");
    checkPlayerInput(input, squad, playerId);
    Object.assign(player, {
      full_name: input.full_name.trim().replace(/\s+/g, " "),
      photo_url: input.photo_url,
      role: input.role,
      batting_style: input.batting_style,
      bowling_style: input.bowling_style,
    });
    member.jersey_number = input.jersey_number;
    save();
    return delay(toSquadPlayer(member));
  },

  async removeSquadPlayer(teamId, playerId) {
    const { squad } = editableSquad(teamId);
    if (!squad.some((m) => m.player_id === playerId)) throw new ApiError("Player not found in this squad.");
    db.squad_members = db.squad_members.filter((m) => !(m.team_id === teamId && m.player_id === playerId));
    // The profile goes too, unless the player is also in another squad.
    if (!db.squad_members.some((m) => m.player_id === playerId)) {
      db.players = db.players.filter((p) => p.id !== playerId);
    }
    save();
    return delay(undefined);
  },

  async setSquadRole(teamId, playerId, role) {
    const { squad } = editableSquad(teamId);
    if (!squad.some((m) => m.player_id === playerId)) throw new ApiError("Player not found in this squad.");
    const updated = assignSquadRole(squad, playerId, role);
    db.squad_members = db.squad_members.map((m) =>
      m.team_id === teamId ? updated.find((u) => u.player_id === m.player_id)! : m
    );
    save();
    return delay(undefined);
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
