import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarClock, CalendarDays, RefreshCw, Shuffle } from "lucide-react";

import { MatchCard } from "@/components/MatchCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GenerateFixturesDialog } from "@/features/fixtures/GenerateFixturesDialog";
import { RescheduleDialog } from "@/features/fixtures/RescheduleDialog";
import { describeSource, stageMatchName } from "@/lib/fixtures";
import { minTeamsFor } from "@/lib/format";
import type { Match, Team, Tournament } from "@/types/db";
import { ComingSoon } from "./ComingSoon";

const FILTERS = ["all", "upcoming", "live", "results"] as const;
type Filter = (typeof FILTERS)[number];
const FILTER_LABELS: Record<Filter, string> = { all: "All", upcoming: "Upcoming", live: "Live", results: "Results" };

const isDone = (m: Match) => m.status === "completed" || m.status === "abandoned";
const matchesFilter: Record<Filter, (m: Match) => boolean> = {
  all: () => true,
  upcoming: (m) => m.status === "scheduled",
  live: (m) => m.status === "live",
  results: isDone,
};

const pad = (n: number) => String(n).padStart(2, "0");
/** Local "YYYY-MM-DD" for grouping, or "" when the match has no date yet. */
function localDay(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayHeading(day: string) {
  if (!day) return "Date to be set";
  const today = localDay(new Date().toISOString());
  const tomorrow = localDay(new Date(Date.now() + 86_400_000).toISOString());
  const label = new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (day === today) return `Today · ${label}`;
  if (day === tomorrow) return `Tomorrow · ${label}`;
  return label;
}

/** Groups matches by local day, in time order (newest day first for results). */
function groupByDay(list: Match[], newestFirst: boolean) {
  const sorted = [...list].sort((a, b) => {
    const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
    const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
    return ta - tb || a.match_number - b.match_number;
  });
  const groups = new Map<string, Match[]>();
  for (const m of sorted) {
    const day = localDay(m.scheduled_at);
    groups.set(day, [...(groups.get(day) ?? []), m]);
  }
  const entries = [...groups.entries()];
  if (newestFirst) entries.reverse();
  return entries;
}

export function FixturesTab({
  tournament: t,
  matches,
  teams,
  isOrganizer,
  onChanged,
}: {
  tournament: Tournament;
  matches: Match[];
  teams: Team[];
  isOrganizer: boolean;
  onChanged: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<Match | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const approved = teams.filter((x) => x.status === "approved");
  const pendingCount = teams.filter((x) => x.status === "pending").length;
  const minTeams = minTeamsFor(t.format);
  const anyStarted = matches.some((m) => m.status !== "scheduled");

  // Filters live in the URL (?show=upcoming&team=...) so a view can be shared.
  const show: Filter = FILTERS.includes(searchParams.get("show") as Filter) ? (searchParams.get("show") as Filter) : "all";
  const teamFilter = approved.some((x) => x.id === searchParams.get("team")) ? searchParams.get("team")! : "";
  function setParam(key: string, value: string, empty: string) {
    const next = new URLSearchParams(searchParams);
    if (value === empty) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }

  const dialog = isOrganizer && (
    <GenerateFixturesDialog
      tournament={t}
      approvedTeams={approved}
      pendingCount={pendingCount}
      redo={matches.length > 0}
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      onDone={onChanged}
    />
  );

  if (matches.length === 0) {
    if (!isOrganizer) {
      return (
        <ComingSoon
          icon={CalendarDays}
          title="No fixtures yet"
          text="The organizer creates the fixtures once team registration is done."
        />
      );
    }
    const ready = approved.length >= minTeams;
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Shuffle className="size-10 text-muted-foreground" />
          <p className="font-medium">Ready to make the fixtures?</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {ready
              ? `${approved.length} approved teams will be drawn at random into ${
                  t.format === "knockout" ? "a knockout bracket" : "league matches and playoffs"
                }.`
              : `You need at least ${minTeams} approved teams (you have ${approved.length}).`}
            {pendingCount > 0 && ` ${pendingCount} team${pendingCount > 1 ? "s are" : " is"} still waiting for approval.`}
          </p>
          <Button onClick={() => setDialogOpen(true)} disabled={!ready}>
            <Shuffle /> Generate fixtures
          </Button>
        </CardContent>
        {dialog}
      </Card>
    );
  }

  const teamById = new Map(teams.map((x) => [x.id, x]));
  const byTeam = (m: Match) => !teamFilter || m.team_a_id === teamFilter || m.team_b_id === teamFilter;
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f, matches.filter((m) => byTeam(m) && matchesFilter[f](m)).length])
  ) as Record<Filter, number>;
  const visible = matches.filter((m) => byTeam(m) && matchesFilter[show](m));
  const live = show === "all" ? visible.filter((m) => m.status === "live") : [];
  const dayGroups = groupByDay(
    show === "all" ? visible.filter((m) => m.status !== "live") : visible,
    show === "results"
  );

  const card = (m: Match, timeOnly = false) => (
    <MatchCard
      key={m.id}
      timeOnly={timeOnly}
      match={m}
      teamA={teamById.get(m.team_a_id ?? "")}
      teamB={teamById.get(m.team_b_id ?? "")}
      sourceA={m.team_a_from ? describeSource(m.team_a_from, matches) : undefined}
      sourceB={m.team_b_from ? describeSource(m.team_b_from, matches) : undefined}
      stageName={stageMatchName(m, matches)}
      action={
        isOrganizer && m.status === "scheduled" ? (
          <Button variant="outline" size="sm" className="self-start" onClick={() => setRescheduling(m)}>
            <CalendarClock /> Reschedule
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <div className="flex flex-col gap-6">
      {isOrganizer && !anyStarted && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed px-4 py-3 text-sm">
          <span className="text-muted-foreground">Not happy with the draw? You can redo it until the first match starts.</span>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <RefreshCw /> Redo fixtures
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ToggleGroup
            type="single"
            variant="outline"
            value={show}
            onValueChange={(v) => v && setParam("show", v, "all")}
            aria-label="Show matches"
          >
            {FILTERS.map((f) => (
              <ToggleGroupItem key={f} value={f} className="px-3">
                {FILTER_LABELS[f]}
                <span className="text-xs text-muted-foreground">{counts[f]}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <NativeSelect
          aria-label="Filter by team"
          value={teamFilter}
          onChange={(e) => setParam("team", e.target.value, "")}
          className="sm:w-56"
        >
          <NativeSelectOption value="">All teams</NativeSelectOption>
          {[...approved]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((x) => (
              <NativeSelectOption key={x.id} value={x.id}>
                {x.name}
              </NativeSelectOption>
            ))}
        </NativeSelect>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No {show === "all" ? "" : FILTER_LABELS[show].toLowerCase() + " "}matches
          {teamFilter ? ` for ${teamById.get(teamFilter)?.name}` : ""}.
        </p>
      ) : (
        <>
          {live.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-red-600 uppercase">● Live now</h2>
              {live.map((m) => card(m))}
            </section>
          )}
          {dayGroups.map(([day, list]) => (
            <section key={day || "tbd"} className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground">{dayHeading(day)}</h2>
              {list.map((m) => card(m, !!day))}
            </section>
          ))}
        </>
      )}

      {dialog}
      <RescheduleDialog
        tournament={t}
        match={rescheduling}
        matches={matches}
        teams={teams}
        title={rescheduling ? `Match ${rescheduling.match_number}` : ""}
        onOpenChange={(open) => !open && setRescheduling(null)}
        onDone={onChanged}
      />
    </div>
  );
}
