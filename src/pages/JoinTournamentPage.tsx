import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, CircleCheck, Lock, MapPin, Trophy } from "lucide-react";

import { TeamBadge } from "@/components/TeamBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/data/api";
import { TeamRegistrationForm } from "@/features/teams/TeamRegistrationForm";
import { useAsync } from "@/hooks/useAsync";
import { formatDateRange, formatDateTime, MODE_LABELS } from "@/lib/labels";
import { getRegistrationState } from "@/lib/registration";
import type { Team } from "@/types/db";

async function loadInvite(code: string) {
  const tournament = await api.getTournamentByInviteCode(code);
  if (!tournament) return null;
  const teams = await api.listTeams(tournament.id);
  return { tournament, teams };
}

export function JoinTournamentPage() {
  const { code = "" } = useParams();
  const { status, data } = useAsync(() => loadInvite(code), [code]);
  const [registered, setRegistered] = useState<Team | null>(null);

  if (status === "loading") return <Skeleton className="mx-auto h-96 w-full max-w-lg rounded-xl" />;

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Trophy className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Invite code not found</h1>
        <p className="text-muted-foreground">Check the link or code with the tournament organizer.</p>
      </div>
    );
  }

  const { tournament: t, teams } = data;
  const state = getRegistrationState(t, teams);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <Card>
        <CardHeader>
          <CardDescription>You're invited to join</CardDescription>
          <CardTitle className="text-xl">
            {t.name} {t.season}
          </CardTitle>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" /> {formatDateRange(t.start_date, t.end_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" /> {t.venues.join(", ")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline">{MODE_LABELS[t.mode]}</Badge>
            <Badge variant="outline">
              {t.overs_per_innings} overs · {t.players_per_side} a side
            </Badge>
            <Badge variant="outline">
              Squad {t.min_squad_size}–{t.max_squad_size}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {registered ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <CircleCheck className="size-12 text-green-600" />
            <div>
              <h1 className="text-xl font-bold">Team registered!</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                The organizer will review <strong>{registered.name}</strong>. You'll be able to add
                your {t.min_squad_size}–{t.max_squad_size} players next.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TeamBadge team={registered} />
              <Badge variant="secondary">Waiting for approval</Badge>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link to={`/tournaments/${t.id}/teams/${registered.id}`}>View your team</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/tournaments/${t.id}?tab=teams`}>View tournament</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : state.open ? (
        <Card>
          <CardHeader>
            <CardTitle>Register your team</CardTitle>
            <CardDescription>
              {state.spotsLeft} of {t.max_teams} spots left
              {t.registration_deadline && ` · closes ${formatDateTime(t.registration_deadline)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamRegistrationForm tournament={t} onRegistered={setRegistered} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Lock className="size-10 text-muted-foreground" />
            <p className="font-medium">Registration isn't open</p>
            <p className="text-sm text-muted-foreground">{state.message}</p>
            <Button asChild variant="outline">
              <Link to={`/tournaments/${t.id}`}>View tournament</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
