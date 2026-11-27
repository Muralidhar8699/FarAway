import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isLeagueFormat, planFormat } from "@/lib/format";
import { FORMAT_LABELS, formatDateTime, MODE_LABELS, TIE_BREAKER_LABELS } from "@/lib/labels";
import type { Team, Tournament } from "@/types/db";

export function OverviewTab({
  tournament: t,
  teams,
  isOrganizer,
}: {
  tournament: Tournament;
  teams: Team[];
  isOrganizer: boolean;
}) {
  const approved = teams.filter((x) => x.status === "approved").length;
  const pending = teams.filter((x) => x.status === "pending").length;
  const plan = planFormat(t.format, t.max_teams, t.league_rounds);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {isOrganizer && (t.status === "draft" || t.status === "registration") && (
        <InviteCard tournament={t} className="lg:col-span-2" />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            {t.status === "registration"
              ? "Registration is open."
              : t.status === "draft"
                ? "Registration hasn't opened yet."
                : "Registration is closed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InfoList
            rows={[
              ["Approved teams", `${approved} of ${t.max_teams}`],
              ["Waiting for approval", String(pending)],
              ["Squad size", `${t.min_squad_size}–${t.max_squad_size} players`],
              ["Registration closes", t.registration_deadline ? formatDateTime(t.registration_deadline) : "When the organizer closes it"],
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Match rules</CardTitle>
          <CardDescription>{MODE_LABELS[t.mode]} rules</CardDescription>
        </CardHeader>
        <CardContent>
          <InfoList
            rows={[
              ["Overs per innings", String(t.overs_per_innings)],
              ["Players per side", String(t.players_per_side)],
              ["Powerplay", t.powerplay_overs ? `${t.powerplay_overs} overs` : "None"],
              ["Max overs per bowler", String(t.max_overs_per_bowler)],
              ["Wide / no-ball", `${runs(t.wide_runs)} / ${runs(t.no_ball_runs)}`],
              ["Free hit after a no-ball", yesNo(t.free_hit_on_no_ball)],
              ["Super over on a tie", yesNo(t.super_over_on_tie)],
              ["Last man stands", yesNo(t.last_man_stands)],
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Format</CardTitle>
          <CardDescription>
            {FORMAT_LABELS[t.format]}
            {isLeagueFormat(t.format) && (t.league_rounds === 2 ? ", each team plays twice" : ", each team plays once")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-2 text-sm">
            {plan.stages.map((stage) => (
              <li key={stage.name} className="flex justify-between gap-2">
                <span>
                  <span className="font-medium">{stage.name}</span>
                  {stage.note && <span className="block text-muted-foreground">{stage.note}</span>}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {stage.matches} match{stage.matches > 1 ? "es" : ""}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t pt-3 text-sm">
            <strong>{plan.totalMatches} matches</strong> for {t.max_teams} teams
          </p>
        </CardContent>
      </Card>

      {isLeagueFormat(t.format) && (
        <Card>
          <CardHeader>
            <CardTitle>Points</CardTitle>
            <CardDescription>How the league table is decided</CardDescription>
          </CardHeader>
          <CardContent>
            <InfoList
              rows={[
                ["Win", pts(t.points_win)],
                ["Tie", pts(t.points_tie)],
                ["No result", pts(t.points_no_result)],
              ]}
            />
            <p className="mt-3 text-sm font-medium">If teams are level on points</p>
            <ol className="mt-1 list-decimal pl-5 text-sm text-muted-foreground">
              {t.tie_breakers.map((tb) => (
                <li key={tb}>{TIE_BREAKER_LABELS[tb].title}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InviteCard({ tournament: t, className }: { tournament: Tournament; className?: string }) {
  const link = `${window.location.origin}/join/${t.invite_code}`;
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-5" /> Invite teams
        </CardTitle>
        <CardDescription>
          {t.status === "registration"
            ? "Share this link or code with team captains so they can register their team."
            : "Open registration first. Teams can't use the link while the tournament is a draft."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Code</span>
          <code className="rounded-md bg-muted px-3 py-1.5 font-mono text-lg font-semibold tracking-widest">
            {t.invite_code}
          </code>
          <CopyButton text={t.invite_code} label="Copy code" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md border px-3 py-2 text-sm">{link}</code>
          <CopyButton text={link} label="Copy link" />
        </div>
      </CardContent>
    </Card>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this:", text);
    }
  }
  return (
    <Button type="button" variant="outline" size="icon" onClick={copy} aria-label={copied ? "Copied" : label}>
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}

function InfoList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const yesNo = (v: boolean) => (v ? "Yes" : "No");
const runs = (n: number) => `${n} run${n === 1 ? "" : "s"}`;
const pts = (n: number) => `${n} point${n === 1 ? "" : "s"}`;
