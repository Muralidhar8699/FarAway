import { useState } from "react";
import { CalendarClock, CalendarDays, RefreshCw, Shuffle } from "lucide-react";

import { MatchCard } from "@/components/MatchCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GenerateFixturesDialog } from "@/features/fixtures/GenerateFixturesDialog";
import { RescheduleDialog } from "@/features/fixtures/RescheduleDialog";
import { describeSource, stageMatchName } from "@/lib/fixtures";
import { minTeamsFor } from "@/lib/format";
import type { Match, Team, Tournament } from "@/types/db";
import { ComingSoon } from "./ComingSoon";

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
  const approved = teams.filter((x) => x.status === "approved");
  const pendingCount = teams.filter((x) => x.status === "pending").length;
  const minTeams = minTeamsFor(t.format);
  const anyStarted = matches.some((m) => m.status !== "scheduled");

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
  const card = (m: Match) => (
    <MatchCard
      key={m.id}
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
  const groups: { title: string; list: Match[] }[] = [
    { title: "Live", list: matches.filter((m) => m.status === "live") },
    { title: "Upcoming", list: matches.filter((m) => m.status === "scheduled") },
    { title: "Results", list: matches.filter((m) => m.status === "completed" || m.status === "abandoned").reverse() },
  ];

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
      {groups
        .filter((g) => g.list.length > 0)
        .map((g) => (
          <section key={g.title} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">{g.title}</h2>
            {g.list.map(card)}
          </section>
        ))}
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
