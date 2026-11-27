import type { SquadMember, Team, Tournament } from "@/types/db";

export const BOWLING_STYLES = [
  "Right-arm fast",
  "Right-arm medium",
  "Left-arm fast",
  "Left-arm medium",
  "Off spin",
  "Leg spin",
  "Left-arm spin",
  "Left-arm wrist spin",
] as const;

export const MAX_JERSEY_NUMBER = 999;

/**
 * Squads lock when the registration deadline passes or the tournament starts.
 * After that only the organizer can change a squad (e.g. injury replacements).
 */
export function isSquadLocked(t: Tournament, now = Date.now()) {
  if (t.status === "ongoing" || t.status === "completed") return true;
  return !!t.registration_deadline && new Date(t.registration_deadline).getTime() <= now;
}

export type SquadAccess =
  | { canEdit: true; asOrganizer: boolean }
  | { canEdit: false; reason: string };

/** Who may change this team's squad right now. */
export function getSquadAccess(t: Tournament, team: Team, userId: string | null, now = Date.now()): SquadAccess {
  const isOrganizer = !!userId && userId === t.created_by;
  const isOwner = !!userId && userId === team.owner_id;
  if (!isOrganizer && !isOwner) {
    return { canEdit: false, reason: "Only the team's captain/owner or the organizer can change this squad." };
  }
  if (team.status === "rejected") {
    return { canEdit: false, reason: "This team was rejected, so its squad can't be changed." };
  }
  if (isSquadLocked(t, now) && !isOrganizer) {
    return { canEdit: false, reason: "Squads are locked. Ask the organizer if you need a replacement." };
  }
  return { canEdit: true, asOrganizer: isOrganizer };
}

export type SquadRole = "captain" | "vice_captain" | "wicket_keeper";

export const SQUAD_ROLE_FIELD: Record<SquadRole, "is_captain" | "is_vice_captain" | "is_wicket_keeper"> = {
  captain: "is_captain",
  vice_captain: "is_vice_captain",
  wicket_keeper: "is_wicket_keeper",
};

/**
 * Gives one player a squad role, taking it from whoever had it.
 * Captain and vice-captain can't be the same player: the player loses the other one.
 */
export function assignSquadRole<T extends SquadMember>(squad: T[], playerId: string, role: SquadRole): T[] {
  const field = SQUAD_ROLE_FIELD[role];
  return squad.map((m) => {
    const isTarget = m.player_id === playerId;
    const next = { ...m, [field]: isTarget };
    if (isTarget && role === "captain") next.is_vice_captain = false;
    if (isTarget && role === "vice_captain") next.is_captain = false;
    return next;
  });
}
