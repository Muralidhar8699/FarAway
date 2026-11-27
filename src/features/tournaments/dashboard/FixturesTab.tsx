import { CalendarDays } from "lucide-react";

import { MatchCard } from "@/components/MatchCard";
import type { Match, Team } from "@/types/db";
import { ComingSoon } from "./ComingSoon";

export function FixturesTab({ matches, teams }: { matches: Match[]; teams: Team[] }) {
  if (matches.length === 0) {
    return (
      <ComingSoon
        icon={CalendarDays}
        title="No fixtures yet"
        text="Fixtures are generated once registration closes (Phase 5)."
      />
    );
  }

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const groups: { title: string; list: Match[] }[] = [
    { title: "Live", list: matches.filter((m) => m.status === "live") },
    { title: "Upcoming", list: matches.filter((m) => m.status === "scheduled") },
    { title: "Results", list: matches.filter((m) => m.status === "completed" || m.status === "abandoned").reverse() },
  ];

  return (
    <div className="flex flex-col gap-6">
      {groups
        .filter((g) => g.list.length > 0)
        .map((g) => (
          <section key={g.title} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">{g.title}</h2>
            {g.list.map((m) => (
              <MatchCard key={m.id} match={m} teamA={teamById.get(m.team_a_id ?? "")} teamB={teamById.get(m.team_b_id ?? "")} />
            ))}
          </section>
        ))}
    </div>
  );
}
