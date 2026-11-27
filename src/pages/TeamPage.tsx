import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, Shield, TriangleAlert, Users } from "lucide-react";

import { MatchCard } from "@/components/MatchCard";
import { TeamBadge } from "@/components/TeamBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/data/api";
import { ComingSoon } from "@/features/tournaments/dashboard/ComingSoon";
import { useAsync } from "@/hooks/useAsync";
import { PLAYER_ROLE_LABELS, TEAM_STATUS_LABELS } from "@/lib/labels";
import type { Match, PlayerRole, SquadPlayer } from "@/types/db";

async function loadTeam(tournamentId: string, teamId: string) {
  const [tournament, team] = await Promise.all([api.getTournament(tournamentId), api.getTeam(teamId)]);
  if (!tournament || !team || team.tournament_id !== tournament.id) return null;
  const [squad, matches, teams] = await Promise.all([
    api.listSquad(team.id),
    api.listMatches(tournament.id),
    api.listTeams(tournament.id),
  ]);
  return {
    tournament,
    team,
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

const ROLE_ORDER: PlayerRole[] = ["batter", "wicket_keeper", "all_rounder", "bowler"];
const ROLE_GROUP_TITLES: Record<PlayerRole, string> = {
  batter: "Batters",
  wicket_keeper: "Wicketkeepers",
  all_rounder: "All-rounders",
  bowler: "Bowlers",
};

export function TeamPage() {
  const { id = "", teamId = "" } = useParams();
  const { status, data } = useAsync(() => loadTeam(id, teamId), [id, teamId]);

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

  const { tournament: t, team, squad, matches, teams } = data;
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

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" /> Squad
            </CardTitle>
            <CardDescription>
              {squad.length} player{squad.length === 1 ? "" : "s"} · squad size {t.min_squad_size}–
              {t.max_squad_size}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {short > 0 && (
              <p className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                <TriangleAlert className="size-4 shrink-0 text-amber-600" />
                Needs {short} more player{short === 1 ? "" : "s"} to reach the minimum squad.
              </p>
            )}
            {squad.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No players yet. Adding players to the squad comes in Phase 4.
              </p>
            ) : (
              <SquadList squad={squad} />
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

function SquadList({ squad }: { squad: SquadPlayer[] }) {
  return (
    <div className="flex flex-col gap-4">
      {ROLE_ORDER.map((role) => {
        const players = squad
          .filter((s) => s.player.role === role)
          .sort(
            (a, b) =>
              Number(b.is_captain) - Number(a.is_captain) ||
              Number(b.is_vice_captain) - Number(a.is_vice_captain) ||
              a.player.full_name.localeCompare(b.player.full_name)
          );
        if (players.length === 0) return null;
        return (
          <div key={role}>
            <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
              {ROLE_GROUP_TITLES[role]} ({players.length})
            </h3>
            <ul className="divide-y">
              {players.map((s) => (
                <li key={s.player_id} className="flex items-center gap-3 py-2">
                  <span className="w-7 shrink-0 text-center text-sm font-semibold text-muted-foreground">
                    {s.jersey_number ?? "–"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 font-medium">
                      <span className="truncate">{s.player.full_name}</span>
                      {s.is_captain && <RoleTag title="Captain">C</RoleTag>}
                      {s.is_vice_captain && <RoleTag title="Vice-captain">VC</RoleTag>}
                      {s.is_wicket_keeper && <RoleTag title="Wicketkeeper">WK</RoleTag>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {PLAYER_ROLE_LABELS[s.player.role]} · {s.player.batting_style === "left" ? "Left" : "Right"}-hand bat
                      {s.player.bowling_style ? ` · ${s.player.bowling_style}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function RoleTag({ title, children }: { title: string; children: string }) {
  return (
    <abbr
      title={title}
      className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground no-underline"
    >
      {children}
    </abbr>
  );
}
