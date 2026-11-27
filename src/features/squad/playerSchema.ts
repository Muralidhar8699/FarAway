import { z } from "zod";

import { MAX_JERSEY_NUMBER } from "@/lib/squad";

export const playerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be 50 characters or less"),
    photo_url: z.string().nullable(),
    /** Kept as text in the form so the box can be empty; "" means no number. */
    jersey_number: z
      .string()
      .trim()
      .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= MAX_JERSEY_NUMBER), {
        message: `Use a number from 0 to ${MAX_JERSEY_NUMBER}, or leave it empty`,
      }),
    role: z.enum(["batter", "bowler", "all_rounder", "wicket_keeper"]),
    batting_style: z.enum(["right", "left"]),
    bowling_style: z.string(), // "" = doesn't bowl
  })
  .refine((v) => !(v.role === "bowler" || v.role === "all_rounder") || v.bowling_style !== "", {
    path: ["bowling_style"],
    message: "Bowlers and all-rounders need a bowling style",
  });

export type PlayerFormValues = z.infer<typeof playerSchema>;
