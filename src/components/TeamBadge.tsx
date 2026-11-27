import type { Team } from "@/types/db";

/** Coloured circle with the team's short name, or its logo. */
export function TeamBadge({ team, size = "md" }: { team: Team; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "size-8 text-[10px]", md: "size-11 text-xs", lg: "size-16 text-base" }[size];
  if (team.logo_url) {
    return <img src={team.logo_url} alt="" className={`${dims} shrink-0 rounded-full border object-cover`} />;
  }
  return (
    <span
      className={`${dims} flex shrink-0 items-center justify-center rounded-full font-bold text-white`}
      style={{ backgroundColor: team.primary_color }}
      aria-hidden
    >
      {team.short_name}
    </span>
  );
}
