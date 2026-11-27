import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, MATCH_STATUS_LABELS, STAGE_LABELS } from "@/lib/labels";
import type { Match, Team } from "@/types/db";
import { ComingSoon } from "./ComingSoon";
import { TeamBadge } from "@/components/TeamBadge";

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

function MatchCard({ match: m, teamA, teamB }: { match: Match; teamA?: Team; teamB?: Team }) {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Match {m.match_number} · {STAGE_LABELS[m.stage]}
            {m.venue ? ` · ${m.venue}` : ""}
          </span>
          {m.status === "live" ? (
            <Badge className="bg-red-600 text-white">● {MATCH_STATUS_LABELS.live}</Badge>
          ) : (
            <span>{m.scheduled_at ? formatDateTime(m.scheduled_at) : "Date to be set"}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {[teamA, teamB].map((team, i) => (
            <div key={i} className="flex items-center gap-2">
              {team ? <TeamBadge team={team} size="sm" /> : <span className="size-8 rounded-full bg-muted" />}
              <span className={team && m.winner_id === team.id ? "font-semibold" : ""}>{team?.name ?? "To be decided"}</span>
            </div>
          ))}
        </div>
        {m.result_text && <p className="text-sm font-medium">{m.result_text}</p>}
      </CardContent>
    </Card>
  );
}
