import { z } from "zod";

export const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Team name must be at least 2 characters")
    .max(40, "Team name must be 40 characters or less"),
  short_name: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{2,4}$/, "Use 2–4 letters or numbers, like CSK or MI"),
  logo_url: z.string().nullable(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a team colour"),
  home_ground: z.string().trim().max(60, "Home ground must be 60 characters or less"),
});

export type TeamFormValues = z.infer<typeof teamSchema>;

/** "Street Smashers" → "SS", "Warriors" → "WAR", "Lane 4 Legends" → "L4L". */
export function suggestShortName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
  return words
    .map((w) => w.replace(/[^A-Za-z0-9]/g, "")[0] ?? "")
    .join("")
    .slice(0, 4)
    .toUpperCase();
}
