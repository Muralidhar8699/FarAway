import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TEAM_STATUS_LABELS } from "@/lib/labels";
import type { Team, Tournament } from "@/types/db";
import { ComingSoon } from "./ComingSoon";

const STATUS_ORDER = { approved: 0, pending: 1, rejected: 2 } as const;

export function TeamsTab({
  tournament,
  teams,
  squadCounts,
}: {
  tournament: Tournament;
  teams: Team[];
  squadCounts: Record<string, number>;
}) {
  if (teams.length === 0) {
    return (
      <ComingSoon
        icon={Users}
        title="No teams yet"
        text={
          tournament.status === "registration"
            ? "Share the invite link from the Overview tab. Teams that register show up here."
            : "Teams can register once registration is open."
        }
      />
    );
  }

  const sorted = [...teams].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name)
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sorted.map((team) => (
        <Card key={team.id} className="py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <TeamBadge team={team} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{team.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {squadCounts[team.id] ?? 0} players{team.home_ground ? ` · ${team.home_ground}` : ""}
              </p>
            </div>
            {team.status !== "approved" && (
              <Badge variant={team.status === "rejected" ? "destructive" : "secondary"} className="shrink-0">
                {TEAM_STATUS_LABELS[team.status]}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Coloured circle with the team's short name, or its logo. */
export function TeamBadge({ team, size = "md" }: { team: Team; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "size-8 text-[10px]" : "size-11 text-xs";
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
