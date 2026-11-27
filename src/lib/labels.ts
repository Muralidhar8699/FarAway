import type {
  MatchStage,
  MatchStatus,
  PlayerRole,
  TeamStatus,
  TieBreaker,
  TournamentFormat,
  TournamentMode,
  TournamentStatus,
} from "@/types/db";

export const STAGE_LABELS: Record<MatchStage, string> = {
  league: "League",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  qualifier_1: "Qualifier 1",
  eliminator: "Eliminator",
  qualifier_2: "Qualifier 2",
  quarter_final: "Quarter-final",
  semi_final: "Semi-final",
  final: "Final",
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: "Upcoming",
  live: "Live",
  completed: "Completed",
  abandoned: "Abandoned",
};

export const TEAM_STATUS_LABELS: Record<TeamStatus, string> = {
  pending: "Waiting for approval",
  approved: "Approved",
  rejected: "Rejected",
};

export const PLAYER_ROLE_LABELS: Record<PlayerRole, string> = {
  batter: "Batter",
  bowler: "Bowler",
  all_rounder: "All-rounder",
  wicket_keeper: "Wicketkeeper",
};

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const TIE_BREAKER_LABELS: Record<TieBreaker, { title: string; description: string }> = {
  wins: { title: "Most wins", description: "The team with more wins goes higher." },
  nrr: {
    title: "Net run rate (NRR)",
    description: "Runs per over scored minus runs per over conceded, across all matches.",
  },
  head_to_head: { title: "Head-to-head", description: "The winner of the match between the two teams." },
};

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
