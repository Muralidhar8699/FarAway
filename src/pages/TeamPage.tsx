import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, Lock, MapPin, Shield, TriangleAlert, UserPlus, Users } from "lucide-react";

import { MatchCard } from "@/components/MatchCard";
import { TeamBadge } from "@/components/TeamBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/data/api";
import { PlayerFormDialog } from "@/features/squad/PlayerFormDialog";
import { SquadList } from "@/features/squad/SquadList";
import { ComingSoon } from "@/features/tournaments/dashboard/ComingSoon";
import { useAsync } from "@/hooks/useAsync";
import { formatDateTime, TEAM_STATUS_LABELS } from "@/lib/labels";
import { getSquadAccess, isSquadLocked } from "@/lib/squad";
import type { Match, SquadPlayer } from "@/types/db";

async function loadTeam(tournamentId: string, teamId: string) {
  const [tournament, team, userId] = await Promise.all([
    api.getTournament(tournamentId),
    api.getTeam(teamId),
    api.getCurrentUserId(),
  ]);
  if (!tournament || !team || team.tournament_id !== tournament.id) return null;
  const [squad, matches, teams] = await Promise.all([
    api.listSquad(team.id),
    api.listMatches(tournament.id),
    api.listTeams(tournament.id),
  ]);
  return {
    tournament,
    team,
    userId,
    squad,
    teams,
    matches: matches.filter((m) => m.team_a_id === team.id || m.team_b_id === team.id),
  };
}

/** Played / won / lost / no result, from completed and abandoned matches. */
function record(matches: Match[], teamId: string) {
  const done = matches.filter((m) => m.status === "completed" || m.status === "abandoned");
  const won = done.filter((m) => m.winner_id === teamId).length;
  const lost = done.filter((m) => m.winner_id && m.winner_id !== teamId).length;
  return { played: done.length, won, lost, noResult: done.length - won - lost };
}

export function TeamPage() {
  const { id = "", teamId = "" } = useParams();
  const { status, data, reload } = useAsync(() => loadTeam(id, teamId), [id, teamId]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SquadPlayer | null>(null);

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Shield className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Team not found</h1>
        <Button asChild variant="outline">
          <Link to={`/tournaments/${id}?tab=teams`}>Back to tournament</Link>
        </Button>
      </div>
    );
  }

  const { tournament: t, team, squad, matches, teams, userId } = data;
  const access = getSquadAccess(t, team, userId);
  const squadFull = squad.length >= t.max_squad_size;
  const locked = isSquadLocked(t);
  const canSeeLockInfo = access.canEdit || team.owner_id === userId;
  const rec = record(matches, team.id);
  const short = t.min_squad_size - squad.length;
  const upcoming = matches.filter((m) => m.status === "live" || m.status === "scheduled");
  const results = matches.filter((m) => m.status === "completed" || m.status === "abandoned").reverse();
  const teamById = new Map(teams.map((x) => [x.id, x]));

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={`/tournaments/${t.id}?tab=teams`}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {t.name} {t.season}
      </Link>

      <header className="flex items-center gap-4">
        <TeamBadge team={team} size="lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">{team.name}</h1>
            {team.status !== "approved" && (
              <Badge variant={team.status === "rejected" ? "destructive" : "secondary"}>
                {TEAM_STATUS_LABELS[team.status]}
              </Badge>
            )}
          </div>
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            <span className="font-semibold tracking-wide">{team.short_name}</span>
            {team.home_ground && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {team.home_ground}
              </span>
            )}
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-4 gap-2 rounded-xl border p-3 text-center">
        {[
          ["Played", rec.played],
          ["Won", rec.won],
          ["Lost", rec.lost],
          ["No result", rec.noResult],
        ].map(([label, value]) => (
          <div key={label}>
            <dd className="text-2xl font-bold">{value}</dd>
            <dt className="text-xs text-muted-foreground">{label}</dt>
          </div>
        ))}
      </dl>

      <PlayerFormDialog
        teamId={team.id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={reload}
      />

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr] [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" /> Squad
            </CardTitle>
            <CardDescription>
              {squad.length} player{squad.length === 1 ? "" : "s"}
              {squadFull ? " (full)" : ""} · squad size {t.min_squad_size}–
              {t.max_squad_size}
            </CardDescription>
            {access.canEdit && (
              <CardAction>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                  disabled={squadFull}
                  title={squadFull ? `The squad is full (${t.max_squad_size} players)` : undefined}
                >
                  <UserPlus /> Add player
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {canSeeLockInfo && (
              <LockNotice
                locked={locked}
                deadline={t.registration_deadline}
                started={t.status === "ongoing" || t.status === "completed"}
                asOrganizer={access.canEdit && access.asOrganizer}
              />
            )}
            {short > 0 && (
              <p className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                <TriangleAlert className="size-4 shrink-0 text-amber-600" />
                Needs {short} more player{short === 1 ? "" : "s"} to reach the minimum squad.
              </p>
            )}
            {squad.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {access.canEdit ? "No players yet. Tap Add player to build your squad." : "No players added yet."}
              </p>
            ) : (
              <SquadList
                teamId={team.id}
                squad={squad}
                canEdit={access.canEdit}
                onEdit={(player) => {
                  setEditing(player);
                  setDialogOpen(true);
                }}
                onChanged={reload}
              />
            )}
          </CardContent>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <CalendarDays className="size-5" /> Matches
          </h2>
          {matches.length === 0 ? (
            <ComingSoon
              icon={CalendarDays}
              title="No matches yet"
              text="This team's fixtures appear here once they're generated (Phase 5)."
            />
          ) : (
            <>
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} teamA={teamById.get(m.team_a_id ?? "")} teamB={teamById.get(m.team_b_id ?? "")} />
              ))}
              {results.map((m) => (
                <MatchCard key={m.id} match={m} teamA={teamById.get(m.team_a_id ?? "")} teamB={teamById.get(m.team_b_id ?? "")} />
              ))}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/** Tells editors when squads lock, or that they're locked and who can still change them. */
function LockNotice({
  locked,
  deadline,
  started,
  asOrganizer,
}: {
  locked: boolean;
  deadline: string | null;
  started: boolean;
  asOrganizer: boolean;
}) {
  if (!locked) {
    if (!deadline) return null;
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="size-4 shrink-0" />
        Squad changes close {formatDateTime(deadline)}.
      </p>
    );
  }
  const why = started ? "The tournament has started" : `Registration closed ${deadline ? formatDateTime(deadline) : ""}`;
  return (
    <p className="flex items-start gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
      <Lock className="mt-0.5 size-4 shrink-0" />
      <span>
        <strong>Squads are locked.</strong> {why}.{" "}
        {asOrganizer
          ? "As the organizer you can still make changes, e.g. injury replacements."
          : "Ask the organizer if you need a replacement."}
      </span>
    </p>
  );
}
