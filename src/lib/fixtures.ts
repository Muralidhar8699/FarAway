import type { Match, MatchStage, Tournament } from "@/types/db";
import { STAGE_LABELS } from "@/lib/labels";

/** A match before it is saved: teams (or where they come from), stage and number. */
export interface FixtureDraft {
  stage: MatchStage;
  match_number: number;
  team_a_id: string | null;
  team_b_id: string | null;
  team_a_from: string | null;
  team_b_from: string | null;
}

export interface ScheduleOptions {
  /** First match day, "YYYY-MM-DD". */
  startDate: string;
  matchesPerDay: number;
  /** Start of the first match each day, "HH:MM" (local time). */
  firstMatchTime: string;
  /** Minutes from one match's start to the next one's. */
  minutesBetween: number;
  /** Rotated between matches in order. */
  venues: string[];
  /** Start each stage / knockout round on a fresh day. Off for one-day events. */
  newDayPerStage: boolean;
}

export interface ScheduledDraft extends FixtureDraft {
  scheduled_at: string;
  venue: string | null;
}

type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Round-robin pairings using the circle method: every team meets every other team
 * once per leg, nobody plays twice in a round, and home/away alternates.
 * Returns rounds of [home, away] pairs. Odd team counts get one team resting each round.
 */
export function roundRobin(teamIds: string[], legs: 1 | 2): [string, string][][] {
  const list: (string | null)[] = teamIds.length % 2 ? [...teamIds, null] : [...teamIds];
  const n = list.length;
  const rounds: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const round: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (a && b) round.push(r % 2 === 0 || i > 0 ? [a, b] : [b, a]);
    }
    rounds.push(round);
    // Keep the first team fixed and rotate the rest one place.
    list.splice(1, 0, list.pop()!);
  }
  if (legs === 2) {
    rounds.push(...rounds.map((round) => round.map(([a, b]) => [b, a] as [string, string])));
  }
  return rounds;
}

const KNOCKOUT_STAGES: Record<number, MatchStage> = {
  1: "final",
  2: "semi_final",
  4: "quarter_final",
  8: "round_of_16",
  16: "round_of_32",
};

type Slot = { teamId: string } | { from: string };
const slotTeam = (s: Slot) => ("teamId" in s ? s.teamId : null);
const slotFrom = (s: Slot) => ("from" in s ? s.from : null);

/**
 * All matches for a tournament. League formats: every league match, then playoff
 * matches whose teams are placeholders (league ranks, winners/losers of earlier matches).
 * Knockout: a random draw with byes for some teams if the count isn't a power of two.
 */
export function buildFixtures(t: Tournament, teamIds: string[], rng: Rng = Math.random): FixtureDraft[] {
  const teams = shuffle(teamIds, rng);
  const drafts: FixtureDraft[] = [];
  const add = (stage: MatchStage, a: Slot, b: Slot) => {
    const match_number = drafts.length + 1;
    drafts.push({
      stage,
      match_number,
      team_a_id: slotTeam(a),
      team_b_id: slotTeam(b),
      team_a_from: slotFrom(a),
      team_b_from: slotFrom(b),
    });
    return match_number;
  };

  if (t.format !== "knockout") {
    for (const round of roundRobin(teams, t.league_rounds)) {
      for (const [a, b] of round) add("league", { teamId: a }, { teamId: b });
    }
    if (t.format === "league_playoffs") {
      const q1 = add("qualifier_1", { from: "R:1" }, { from: "R:2" });
      const el = add("eliminator", { from: "R:3" }, { from: "R:4" });
      const q2 = add("qualifier_2", { from: `L:${q1}` }, { from: `W:${el}` });
      add("final", { from: `W:${q1}` }, { from: `W:${q2}` });
    } else {
      const sf1 = add("semi_final", { from: "R:1" }, { from: "R:4" });
      const sf2 = add("semi_final", { from: "R:2" }, { from: "R:3" });
      add("final", { from: `W:${sf1}` }, { from: `W:${sf2}` });
    }
    return drafts;
  }

  // Knockout bracket. Byes go to the first teams in the draw, spread between real matches.
  const bracket = 2 ** Math.ceil(Math.log2(teams.length));
  const byes = bracket - teams.length;
  const byeTeams = teams.slice(0, byes);
  const playing = teams.slice(byes);
  const playPairs: [string, string][] = [];
  for (let i = 0; i < playing.length; i += 2) playPairs.push([playing[i], playing[i + 1]]);

  // First-round slots in bracket order: a bye team, then a real match, alternating.
  let slots: Slot[] = [];
  let bi = 0;
  let pi = 0;
  while (bi < byeTeams.length || pi < playPairs.length) {
    if (bi < byeTeams.length) slots.push({ teamId: byeTeams[bi++] });
    if (pi < playPairs.length) {
      const [a, b] = playPairs[pi++];
      const n = add(KNOCKOUT_STAGES[bracket / 2], { teamId: a }, { teamId: b });
      slots.push({ from: `W:${n}` });
    }
  }
  // Later rounds pair neighbouring slots until one winner is left.
  while (slots.length > 1) {
    const next: Slot[] = [];
    const stage = KNOCKOUT_STAGES[slots.length / 2];
    for (let i = 0; i < slots.length; i += 2) {
      const n = add(stage, slots[i], slots[i + 1]);
      next.push({ from: `W:${n}` });
    }
    slots = next;
  }
  return drafts;
}

/** Order of stages: a new stage (or knockout round) always starts on a new day. */
function stageGroup(stage: MatchStage) {
  if (stage === "qualifier_1" || stage === "eliminator") return "playoff-1";
  return stage;
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Gives every match a date, time and venue: matchesPerDay matches a day, starting at
 * firstMatchTime and minutesBetween apart. With newDayPerStage, each new stage starts on a fresh day.
 */
export function scheduleFixtures(drafts: FixtureDraft[], o: ScheduleOptions): { matches: ScheduledDraft[]; lastDate: string } {
  const [hh, mm] = o.firstMatchTime.split(":").map(Number);
  let day = o.startDate;
  let slot = 0;
  let group = drafts[0] ? stageGroup(drafts[0].stage) : "";
  const matches = drafts.map((d, i) => {
    const g = stageGroup(d.stage);
    if (slot >= o.matchesPerDay || (o.newDayPerStage && g !== group && slot > 0)) {
      day = addDays(day, 1);
      slot = 0;
    }
    group = g;
    const start = new Date(`${day}T00:00:00`);
    start.setHours(hh, mm + slot * o.minutesBetween, 0, 0);
    slot++;
    return {
      ...d,
      scheduled_at: start.toISOString(),
      venue: o.venues.length ? o.venues[i % o.venues.length] : null,
    };
  });
  return { matches, lastDate: day };
}

/**
 * Sensible defaults: short gully games fit several a day, T20s one or two.
 * A one-day event plays every match that day (pass the number of matches).
 */
export function defaultScheduleOptions(t: Tournament, totalMatches?: number): ScheduleOptions {
  const oneDay = t.start_date === t.end_date;
  const minutesPerMatch = Math.max(45, Math.round((t.overs_per_innings * 2 * 4 + 20) / 15) * 15);
  return {
    startDate: t.start_date,
    matchesPerDay:
      oneDay && totalMatches
        ? Math.min(12, totalMatches)
        : t.overs_per_innings <= 10
          ? 4
          : t.overs_per_innings <= 20
            ? 2
            : 1,
    firstMatchTime: t.overs_per_innings <= 10 ? "08:00" : "15:30",
    minutesBetween: minutesPerMatch,
    venues: t.venues,
    newDayPerStage: !oneDay,
  };
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

type MatchRef = Pick<Match, "match_number" | "stage">;

/**
 * A match's name within its stage: "Final", "Qualifier 1", "Semi-final 2",
 * "Quarter-final 3". League matches are just "League".
 */
export function stageMatchName(m: MatchRef, matches: MatchRef[]): string {
  if (m.stage === "league") return STAGE_LABELS.league;
  const sameStage = matches.filter((x) => x.stage === m.stage).sort((a, b) => a.match_number - b.match_number);
  if (sameStage.length <= 1) return STAGE_LABELS[m.stage];
  return `${STAGE_LABELS[m.stage]} ${sameStage.findIndex((x) => x.match_number === m.match_number) + 1}`;
}

/** "1st in league", "Winner of Qualifier 1", "Loser of Semi-final 2". */
export function describeSource(from: string, matches: MatchRef[]): string {
  const [kind, num] = from.split(":");
  const n = Number(num);
  if (kind === "R") return `${ordinal(n)} in league`;
  const m = matches.find((x) => x.match_number === n);
  const name = m && m.stage !== "league" ? stageMatchName(m, matches) : `Match ${n}`;
  return `${kind === "W" ? "Winner" : "Loser"} of ${name}`;
}
