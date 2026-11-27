import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, Users, X } from "lucide-react";

import { TeamBadge } from "@/components/TeamBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, ApiError } from "@/data/api";
import { formatDateTime, TEAM_STATUS_LABELS } from "@/lib/labels";
import { canApproveTeam } from "@/lib/registration";
import type { Team, Tournament } from "@/types/db";
import { ComingSoon } from "./ComingSoon";

export function TeamsTab({
  tournament,
  teams,
  squadCounts,
  isOrganizer,
  onChanged,
}: {
  tournament: Tournament;
  teams: Team[];
  squadCounts: Record<string, number>;
  isOrganizer: boolean;
  /** Called after a team is approved or rejected, to refresh the page data. */
  onChanged: () => void;
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

  const byName = (a: Team, b: Team) => a.name.localeCompare(b.name);
  const approved = teams.filter((t) => t.status === "approved").sort(byName);
  // Oldest request first, so teams are reviewed in the order they applied.
  const pending = teams
    .filter((t) => t.status === "pending")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const rejected = teams.filter((t) => t.status === "rejected").sort(byName);
  const roomToApprove = canApproveTeam(tournament, teams);

  const card = (team: Team) => (
    <TeamCard
      key={team.id}
      team={team}
      players={squadCounts[team.id] ?? 0}
      actions={
        isOrganizer && team.status !== "approved" ? (
          <ReviewActions team={team} canApprove={roomToApprove} onChanged={onChanged} />
        ) : null
      }
    />
  );

  return (
    <div className="flex flex-col gap-6">
      {pending.length > 0 && (
        <Section
          title={`Waiting for approval (${pending.length})`}
          note={
            isOrganizer
              ? roomToApprove
                ? "Review each team and approve or reject it."
                : `All ${tournament.max_teams} spots are filled by approved teams, so these requests can only be rejected.`
              : "The organizer will review these teams."
          }
        >
          {pending.map(card)}
        </Section>
      )}

      <Section title={`Approved teams (${approved.length} of ${tournament.max_teams})`}>
        {approved.length > 0 ? (
          approved.map(card)
        ) : (
          <p className="text-sm text-muted-foreground sm:col-span-2">No teams approved yet.</p>
        )}
      </Section>

      {rejected.length > 0 && isOrganizer && (
        <Section title={`Rejected (${rejected.length})`} note="Rejected by mistake? You can still approve them.">
          {rejected.map(card)}
        </Section>
      )}
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">{title}</h2>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function TeamCard({ team, players, actions }: { team: Team; players: number; actions: ReactNode }) {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="flex items-center gap-3">
          <TeamBadge team={team} />
          <div className="min-w-0 flex-1">
            <Link
              to={`/tournaments/${team.tournament_id}/teams/${team.id}`}
              className="block truncate font-medium hover:underline"
            >
              {team.name}
            </Link>
            <p className="truncate text-sm text-muted-foreground">
              {players} player{players === 1 ? "" : "s"}
              {team.home_ground ? ` · ${team.home_ground}` : ""}
            </p>
          </div>
          {team.status !== "approved" && (
            <Badge variant={team.status === "rejected" ? "destructive" : "secondary"} className="shrink-0">
              {team.status === "pending" ? "Pending" : TEAM_STATUS_LABELS[team.status]}
            </Badge>
          )}
        </div>
        {team.status === "pending" && (
          <p className="text-xs text-muted-foreground">Registered {formatDateTime(team.created_at)}</p>
        )}
        {actions}
      </CardContent>
    </Card>
  );
}

function ReviewActions({
  team,
  canApprove,
  onChanged,
}: {
  team: Team;
  canApprove: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: "approved" | "rejected") {
    setBusy(status);
    setError(null);
    try {
      await api.setTeamStatus(team.id, status);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          disabled={!canApprove || busy !== null}
          onClick={() => setStatus("approved")}
        >
          {busy === "approved" ? <Loader2 className="animate-spin" /> : <Check />}
          Approve
        </Button>
        {team.status === "pending" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex-1" disabled={busy !== null}>
                {busy === "rejected" ? <Loader2 className="animate-spin" /> : <X />}
                Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject {team.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  They won't be part of the tournament and their spot opens for another team. You can
                  still approve them later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => setStatus("rejected")}
                >
                  Reject team
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
