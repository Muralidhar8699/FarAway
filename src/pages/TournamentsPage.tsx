import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, CircleCheck, X, MapPin, RotateCcw, Trophy, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, USING_MOCK_DATA } from "@/data/api";
import { FORMAT_LABELS, formatDateRange, MODE_LABELS, STATUS_LABELS } from "@/lib/labels";
import type { Tournament } from "@/types/db";

type Row = Tournament & { teamCount: number };

export function TournamentsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  // Show the "created" message once, then clear it so a refresh doesn't bring it back.
  const [createdName, setCreatedName] = useState(
    () => (location.state as { createdName?: string } | null)?.createdName
  );
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const load = useCallback(async () => {
    setRows(null);
    const tournaments = await api.listTournaments();
    const counts = await Promise.all(
      tournaments.map((t) => api.listTeams(t.id).then((teams) => teams.filter((x) => x.status === "approved").length))
    );
    setRows(tournaments.map((t, i) => ({ ...t, teamCount: counts[i] })));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReset() {
    if (!window.confirm("Reset all demo data to the original dummy tournaments?")) return;
    await api.resetDemoData();
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <Button asChild>
          <Link to="/tournaments/new">Create Tournament</Link>
        </Button>
      </div>

      {createdName && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm"
        >
          <CircleCheck className="size-5 shrink-0 text-green-600" />
          <span className="flex-1">
            <strong>{createdName}</strong> was created as a draft. Rules and team registration come next.
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Dismiss"
            onClick={() => setCreatedName(undefined)}
          >
            <X />
          </Button>
        </div>
      )}

      {USING_MOCK_DATA && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            <Badge variant="outline" className="mr-2">Demo data</Badge>
            These tournaments are dummy data until the database is connected.
          </span>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw /> Reset demo data
          </Button>
        </div>
      )}

      {rows === null ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Trophy className="size-10 text-muted-foreground" />
            <p className="font-medium">No tournaments yet</p>
            <p className="text-sm text-muted-foreground">
              Tournaments you create or join will show up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <div className="mb-2 flex size-12 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {t.logo_url ? (
                    <img src={t.logo_url} alt="" className="size-full object-contain" />
                  ) : (
                    <Trophy className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={t.status === "ongoing" ? "default" : "secondary"}>
                    {STATUS_LABELS[t.status]}
                  </Badge>
                  <Badge variant="outline">{MODE_LABELS[t.mode]}</Badge>
                </div>
                <CardTitle className="text-lg">
                  {t.name} {t.season}
                </CardTitle>
                <CardDescription>
                  {FORMAT_LABELS[t.format]} · {t.overs_per_innings} overs · {t.players_per_side} a side
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CalendarDays className="size-4" /> {formatDateRange(t.start_date, t.end_date)}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="size-4" /> {t.venues.join(", ") || "Venue not set"}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="size-4" /> {t.teamCount} / {t.max_teams} teams
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
