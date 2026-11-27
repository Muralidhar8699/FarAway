import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { TeamBadge } from "@/components/TeamBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, MATCH_STATUS_LABELS, STAGE_LABELS } from "@/lib/labels";
import type { Match, Team } from "@/types/db";

/** One fixture or result. Team names link to their team pages. */
export function MatchCard({
  match: m,
  teamA,
  teamB,
  sourceA,
  sourceB,
  action,
  stageName,
  timeOnly,
}: {
  match: Match;
  teamA?: Team;
  teamB?: Team;
  /** Shown when the team isn't known yet, e.g. "Winner of Qualifier 1". */
  sourceA?: string;
  sourceB?: string;
  /** Optional button row, e.g. "Reschedule" for the organizer. */
  action?: ReactNode;
  /** Name within the stage, e.g. "Semi-final 2". Defaults to the stage name. */
  stageName?: string;
  /** Show only the start time (when the card sits under a date heading). */
  timeOnly?: boolean;
}) {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Match {m.match_number} · {stageName ?? STAGE_LABELS[m.stage]}
            {m.venue ? ` · ${m.venue}` : ""}
          </span>
          {m.status === "live" ? (
            <Badge className="bg-red-600 text-white">● {MATCH_STATUS_LABELS.live}</Badge>
          ) : (
            <span>
              {m.scheduled_at
                ? timeOnly
                  ? new Date(m.scheduled_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
                  : formatDateTime(m.scheduled_at)
                : "Date to be set"}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {[
            { team: teamA, source: sourceA },
            { team: teamB, source: sourceB },
          ].map(({ team, source }, i) => (
            <div key={i} className="flex items-center gap-2">
              {team ? (
                <TeamBadge team={team} size="sm" />
              ) : (
                <span className="size-8 shrink-0 rounded-full border border-dashed bg-muted" />
              )}
              {team ? (
                <Link
                  to={`/tournaments/${m.tournament_id}/teams/${team.id}`}
                  className={team && m.winner_id === team.id ? "font-semibold hover:underline" : "hover:underline"}
                >
                  {team.name}
                </Link>
              ) : (
                <span className="text-muted-foreground italic">{source ?? "To be decided"}</span>
              )}
            </div>
          ))}
        </div>
        {m.result_text && <p className="text-sm font-medium">{m.result_text}</p>}
        {action}
      </CardContent>
    </Card>
  );
}
