import { z } from "zod";

import { LEAGUE_MIN_TEAMS, MAX_TEAMS, MIN_TEAMS, minTeamsFor } from "@/lib/format";

export const MAX_VENUES = 10;

const wholeNumber = (label: string, min: number, max: number) =>
  z
    .number({ error: `Enter the ${label}` })
    .int(`${label[0].toUpperCase()}${label.slice(1)} must be a whole number`)
    .min(min, `Minimum is ${min}`)
    .max(max, `Maximum is ${max}`);

type Payload = { issues: { path?: PropertyKey[] }[] };

/** Run a check only when none of the given fields has its own error. */
function onlyNeeds(...fields: string[]) {
  return (payload: Payload) =>
    !payload.issues.some((issue) => fields.includes(String(issue.path?.[0])));
}

export const createTournamentSchema = z
  .object({
    // Step 1: details
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(60, "Name must be 60 characters or less"),
    season: z
      .string()
      .trim()
      .regex(/^\d{4}(-\d{2})?$/, "Use a year like 2026 or 2026-27"),
    logo_url: z.string().nullable(),
    start_date: z.string().min(1, "Pick a start date"),
    end_date: z.string().min(1, "Pick an end date"),
    venues: z
      .array(z.string())
      .min(1, "Add at least one venue")
      .max(MAX_VENUES, `You can add up to ${MAX_VENUES} venues`),

    // Step 2: match rules
    mode: z.enum(["gully", "professional"]),
    overs_per_innings: wholeNumber("number of overs", 1, 50),
    players_per_side: wholeNumber("number of players", 2, 11),
    powerplay_overs: wholeNumber("powerplay overs", 0, 20),
    max_overs_per_bowler: wholeNumber("overs per bowler", 1, 50),
    wide_runs: wholeNumber("runs for a wide", 0, 5),
    no_ball_runs: wholeNumber("runs for a no-ball", 0, 5),
    free_hit_on_no_ball: z.boolean(),
    last_man_stands: z.boolean(),
    super_over_on_tie: z.boolean(),

    // Step 3: format
    format: z.enum(["league_playoffs", "league_semis", "knockout"]),
    league_rounds: z.union([z.literal(1), z.literal(2)]),
    max_teams: wholeNumber("number of teams", MIN_TEAMS, MAX_TEAMS),
    points_win: wholeNumber("points for a win", 1, 10),
    points_tie: wholeNumber("points for a tie", 0, 10),
    points_no_result: wholeNumber("points for no result", 0, 10),
    tie_breakers: z
      .array(z.enum(["wins", "nrr", "head_to_head"]))
      .length(3)
      .refine((list) => new Set(list).size === list.length, "Each tie-breaker can be used once"),
  })
  // Each cross-field check runs as soon as the fields it depends on are valid,
  // even if other fields (e.g. on another step) still have errors.
  .refine((v) => v.end_date >= v.start_date, {
    path: ["end_date"],
    message: "End date can't be before the start date",
    when: onlyNeeds("start_date", "end_date"),
  })
  .refine((v) => v.max_teams >= minTeamsFor(v.format), {
    path: ["max_teams"],
    message: `League formats need at least ${LEAGUE_MIN_TEAMS} teams (the top 4 reach the playoffs)`,
    when: onlyNeeds("max_teams", "format"),
  })
  .refine((v) => v.points_tie <= v.points_win, {
    path: ["points_tie"],
    message: "A tie can't be worth more than a win",
    when: onlyNeeds("points_tie", "points_win"),
  })
  .refine((v) => v.points_no_result <= v.points_win, {
    path: ["points_no_result"],
    message: "No result can't be worth more than a win",
    when: onlyNeeds("points_no_result", "points_win"),
  })
  .refine((v) => v.powerplay_overs <= v.overs_per_innings, {
    path: ["powerplay_overs"],
    message: "Powerplay can't be longer than the innings",
    when: onlyNeeds("powerplay_overs", "overs_per_innings"),
  })
  .refine((v) => v.max_overs_per_bowler <= v.overs_per_innings, {
    path: ["max_overs_per_bowler"],
    message: "Can't be more than the overs in an innings",
    when: onlyNeeds("max_overs_per_bowler", "overs_per_innings"),
  })
  .superRefine((v, ctx) => {
    if (v.max_overs_per_bowler > v.overs_per_innings) return; // reported above
    if (v.max_overs_per_bowler * v.players_per_side < v.overs_per_innings) {
      const needed = Math.ceil(v.overs_per_innings / v.players_per_side);
      ctx.addIssue({
        code: "custom",
        path: ["max_overs_per_bowler"],
        message: `Too low: ${v.players_per_side} players can't bowl ${v.overs_per_innings} overs at ${v.max_overs_per_bowler} each. Use at least ${needed}.`,
      });
    }
  }, { when: onlyNeeds("max_overs_per_bowler", "overs_per_innings", "players_per_side") });

export type CreateTournamentValues = z.infer<typeof createTournamentSchema>;

/** Fields checked before moving past each step. */
export const STEP_FIELDS = {
  details: ["name", "season", "logo_url", "start_date", "end_date", "venues"],
  rules: [
    "mode",
    "overs_per_innings",
    "players_per_side",
    "powerplay_overs",
    "max_overs_per_bowler",
    "wide_runs",
    "no_ball_runs",
    "free_hit_on_no_ball",
    "last_man_stands",
    "super_over_on_tie",
  ],
  format: [
    "format",
    "league_rounds",
    "max_teams",
    "points_win",
    "points_tie",
    "points_no_result",
    "tie_breakers",
  ],
} as const satisfies Record<string, readonly (keyof CreateTournamentValues)[]>;
