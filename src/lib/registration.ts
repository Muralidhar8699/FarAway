import type { Team, Tournament } from "@/types/db";

export type RegistrationState =
  | { open: true; spotsLeft: number }
  | { open: false; reason: "draft" | "closed" | "deadline" | "full"; message: string };

/**
 * Whether new teams can register right now.
 * Pending and approved teams both take a spot; rejected teams free theirs.
 */
export function getRegistrationState(t: Tournament, teams: Team[], now = Date.now()): RegistrationState {
  if (t.status === "draft") {
    return { open: false, reason: "draft", message: "Registration hasn't opened yet. Check with the organizer." };
  }
  if (t.status !== "registration") {
    return { open: false, reason: "closed", message: "Registration for this tournament is closed." };
  }
  if (t.registration_deadline && new Date(t.registration_deadline).getTime() <= now) {
    return { open: false, reason: "deadline", message: "The registration deadline has passed." };
  }
  const taken = teams.filter((x) => x.tournament_id === t.id && x.status !== "rejected").length;
  if (taken >= t.max_teams) {
    return { open: false, reason: "full", message: `This tournament is full (${t.max_teams} teams).` };
  }
  return { open: true, spotsLeft: t.max_teams - taken };
}

/** Approved teams can't go over the tournament's team limit. */
export function canApproveTeam(t: Tournament, teams: Team[]) {
  return teams.filter((x) => x.tournament_id === t.id && x.status === "approved").length < t.max_teams;
}

/** Names compare without case or extra spaces, so "Street Kings" = "street  kings". */
export function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export const TEAM_COLORS = [
  "#dc2626", "#ea580c", "#f59e0b", "#ca8a04", "#65a30d", "#16a34a",
  "#0d9488", "#0284c7", "#2563eb", "#4f46e5", "#7c3aed", "#db2777",
] as const;
