import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  CircleCheck,
  ListOrdered,
  Loader2,
  MapPin,
  Trophy,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/data/api";
import { ComingSoon } from "@/features/tournaments/dashboard/ComingSoon";
import { FixturesTab } from "@/features/tournaments/dashboard/FixturesTab";
import { OverviewTab } from "@/features/tournaments/dashboard/OverviewTab";
import { TeamsTab } from "@/features/tournaments/dashboard/TeamsTab";
import { useAsync } from "@/hooks/useAsync";
import { formatDateRange, MODE_LABELS, STATUS_LABELS } from "@/lib/labels";

const TABS = ["overview", "teams", "fixtures", "table", "stats"] as const;
type Tab = (typeof TABS)[number];

async function loadTournament(id: string) {
  const [tournament, userId] = await Promise.all([api.getTournament(id), api.getCurrentUserId()]);
  if (!tournament) return null;
  const [teams, matches] = await Promise.all([api.listTeams(id), api.listMatches(id)]);
  const squads = await Promise.all(teams.map((t) => api.listSquad(t.id)));
  const squadCounts = Object.fromEntries(teams.map((t, i) => [t.id, squads[i].length]));
  return { tournament, teams, matches, squadCounts, isOrganizer: userId === tournament.created_by };
}

export function TournamentPage() {
  const { id = "" } = useParams();
  const { status, data, error, reload } = useAsync(() => loadTournament(id), [id]);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = TABS.includes(searchParams.get("tab") as Tab) ? (searchParams.get("tab") as Tab) : "overview";

  // One-time "created" message after the Create Tournament wizard.
  const location = useLocation();
  const navigate = useNavigate();
  const [createdName, setCreatedName] = useState(
    () => (location.state as { createdName?: string } | null)?.createdName
  );
  useEffect(() => {
    if (location.state) navigate(location.pathname + location.search, { replace: true, state: null });
  }, [location.state, location.pathname, location.search, navigate]);

  const [opening, setOpening] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-9 w-full max-w-md" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="font-medium">Couldn't load this tournament.</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button variant="outline" onClick={reload}>
          Try again
        </Button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Trophy className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Tournament not found</h1>
        <p className="text-muted-foreground">It may have been deleted, or the link is wrong.</p>
        <Button asChild variant="outline">
          <Link to="/tournaments">All tournaments</Link>
        </Button>
      </div>
    );
  }

  const { tournament: t, teams, matches, squadCounts, isOrganizer } = data;

  async function openRegistration() {
    setOpening(true);
    try {
      await api.updateTournament(t.id, { status: "registration" });
      reload();
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {createdName && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm"
        >
          <CircleCheck className="size-5 shrink-0 text-green-600" />
          <span className="flex-1">
            <strong>{createdName}</strong> is ready.{" "}
            {t.status === "registration"
              ? "Share the invite link below so teams can register."
              : "Open registration when you're ready for teams to join."}
          </span>
          <Button variant="ghost" size="icon" aria-label="Dismiss" onClick={() => setCreatedName(undefined)}>
            <X />
          </Button>
        </div>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {t.logo_url ? (
            <img src={t.logo_url} alt="" className="size-full object-contain" />
          ) : (
            <Trophy className="size-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant={t.status === "ongoing" ? "default" : "secondary"}>{STATUS_LABELS[t.status]}</Badge>
            <Badge variant="outline">{MODE_LABELS[t.mode]}</Badge>
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {t.name} {t.season}
          </h1>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:gap-4">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" /> {formatDateRange(t.start_date, t.end_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" /> {t.venues.join(", ")}
            </span>
          </div>
        </div>
        {isOrganizer && t.status === "draft" && (
          <Button onClick={openRegistration} disabled={opening} className="w-full sm:w-auto">
            {opening && <Loader2 className="animate-spin" />}
            Open registration
          </Button>
        )}
      </header>

      <Tabs
        value={tab}
        onValueChange={(v) => setSearchParams(v === "overview" ? {} : { tab: v }, { replace: true })}
      >
        <div className="-mx-4 overflow-x-auto px-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Teams ({teams.filter((x) => x.status === "approved").length})</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="table">Points Table</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab tournament={t} teams={teams} isOrganizer={isOrganizer} />
        </TabsContent>
        <TabsContent value="teams" className="mt-4">
          <TeamsTab tournament={t} teams={teams} squadCounts={squadCounts} />
        </TabsContent>
        <TabsContent value="fixtures" className="mt-4">
          <FixturesTab matches={matches} teams={teams} />
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <ComingSoon
            icon={ListOrdered}
            title="Points table"
            text="Points, wins, losses and net run rate appear here once matches are scored (Phase 8)."
          />
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <ComingSoon
            icon={BarChart3}
            title="Stats & awards"
            text="Top run scorers (Orange Cap), wicket takers (Purple Cap) and more arrive in Phase 9."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
