import type { TournamentFormat } from "@/types/db";

export const MIN_TEAMS = 2;
export const MAX_TEAMS = 32;
/** League formats send the top 4 to the playoffs / semi-finals. */
export const LEAGUE_MIN_TEAMS = 4;

export interface Stage {
  name: string;
  matches: number;
  note?: string;
}

export interface FormatPlan {
  stages: Stage[];
  totalMatches: number;
  /** Most matches one team can play (league games + every knockout game to the final). */
  maxMatchesPerTeam: number;
}

export function isLeagueFormat(format: TournamentFormat) {
  return format !== "knockout";
}

export function minTeamsFor(format: TournamentFormat) {
  return isLeagueFormat(format) ? LEAGUE_MIN_TEAMS : MIN_TEAMS;
}

const KNOCKOUT_ROUND_NAMES = ["Final", "Semi-finals", "Quarter-finals", "Round of 16", "Round of 32"];

/** Works out the stages and match counts for a format. Assumes a valid team count. */
export function planFormat(format: TournamentFormat, teams: number, leagueRounds: 1 | 2): FormatPlan {
  if (format === "knockout") {
    const rounds = Math.ceil(Math.log2(teams));
    const bracket = 2 ** rounds;
    const byes = bracket - teams;
    const stages: Stage[] = [];
    for (let r = rounds - 1; r >= 0; r--) {
      const matchesInRound = 2 ** r;
      const isFirst = r === rounds - 1;
      stages.push({
        name: KNOCKOUT_ROUND_NAMES[r] ?? `Round of ${2 ** (r + 1)}`,
        // In the first round, teams with a bye don't play.
        matches: isFirst ? matchesInRound - byes : matchesInRound,
        note: isFirst && byes > 0 ? `${byes} ${byes > 1 ? "teams get byes" : "team gets a bye"} to the next round` : undefined,
      });
    }
    return {
      stages: stages.filter((s) => s.matches > 0),
      totalMatches: teams - 1,
      maxMatchesPerTeam: rounds,
    };
  }

  const leagueMatches = ((teams * (teams - 1)) / 2) * leagueRounds;
  const leagueGamesPerTeam = (teams - 1) * leagueRounds;
  const league: Stage = {
    name: "League",
    matches: leagueMatches,
    note: `Each team plays ${leagueGamesPerTeam} match${leagueGamesPerTeam > 1 ? "es" : ""}${
      leagueRounds === 2 ? " (every team twice)" : ""
    }`,
  };

  if (format === "league_playoffs") {
    return {
      stages: [
        league,
        { name: "Qualifier 1", matches: 1, note: "1st vs 2nd: winner goes to the final" },
        { name: "Eliminator", matches: 1, note: "3rd vs 4th: loser is out" },
        { name: "Qualifier 2", matches: 1, note: "Loser of Q1 vs winner of Eliminator" },
        { name: "Final", matches: 1 },
      ],
      totalMatches: leagueMatches + 4,
      maxMatchesPerTeam: leagueGamesPerTeam + 3,
    };
  }

  return {
    stages: [
      league,
      { name: "Semi-finals", matches: 2, note: "1st vs 4th, 2nd vs 3rd" },
      { name: "Final", matches: 1 },
    ],
    totalMatches: leagueMatches + 3,
    maxMatchesPerTeam: leagueGamesPerTeam + 2,
  };
}
