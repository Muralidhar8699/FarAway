import { z } from "zod";

export const MAX_VENUES = 10;

export const tournamentDetailsSchema = z
  .object({
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
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
    message: "End date can't be before the start date",
    path: ["end_date"],
  });

export type TournamentDetailsValues = z.infer<typeof tournamentDetailsSchema>;
