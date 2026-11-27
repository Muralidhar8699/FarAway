import type { TournamentFormat, TournamentMode, TournamentStatus } from "@/types/db";

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  league_playoffs: "League + Playoffs (IPL style)",
  league_semis: "League + Semis & Final",
  knockout: "Knockout",
};

export const MODE_LABELS: Record<TournamentMode, string> = {
  gully: "Gully",
  professional: "Professional",
};

export const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: "Draft",
  registration: "Registration open",
  ongoing: "Ongoing",
  completed: "Completed",
};

export function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`;
}
