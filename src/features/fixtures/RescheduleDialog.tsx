import { useEffect, useMemo, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/data/api";
import type { Match, Team, Tournament } from "@/types/db";

/** Matches closer together than this (same ground or same team) get a clash warning. */
const CLASH_MINUTES = 60;

const pad = (n: number) => String(n).padStart(2, "0");
function toLocalParts(iso: string | null) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function RescheduleDialog({
  tournament: t,
  match,
  matches,
  teams,
  title,
  onOpenChange,
  onDone,
}: {
  tournament: Tournament;
  /** The match being moved; the dialog is open while this is set. */
  match: Match | null;
  matches: Match[];
  teams: Team[];
  title: string;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      const parts = toLocalParts(match.scheduled_at);
      setDate(parts.date);
      setTime(parts.time);
      setVenue(match.venue ?? "");
      setError(null);
    }
  }, [match]);

  const warnings = useMemo(() => {
    if (!match || !date || !time) return [];
    const start = new Date(`${date}T${time}`).getTime();
    const out: string[] = [];
    if (date < t.start_date || date > t.end_date) out.push("This date is outside the tournament dates.");
    const near = (m: Match) => m.scheduled_at && Math.abs(new Date(m.scheduled_at).getTime() - start) < CLASH_MINUTES * 60_000;
    const others = matches.filter((m) => m.id !== match.id && near(m));
    const atVenue = others.find((m) => venue && m.venue === venue.trim());
    if (atVenue) out.push(`Match ${atVenue.match_number} is at ${venue.trim()} around the same time.`);
    const myTeams = [match.team_a_id, match.team_b_id].filter(Boolean);
    const teamClash = others.find((m) => myTeams.includes(m.team_a_id) || myTeams.includes(m.team_b_id));
    if (teamClash) {
      const busy = teams.find((x) => myTeams.includes(x.id) && (x.id === teamClash.team_a_id || x.id === teamClash.team_b_id));
      out.push(`${busy?.name ?? "A team"} also plays Match ${teamClash.match_number} around the same time.`);
    }
    return out;
  }, [match, matches, teams, date, time, venue, t]);

  async function save() {
    if (!match) return;
    if (!date || !time) {
      setError("Pick a date and a time.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.rescheduleMatch(match.id, {
        scheduled_at: new Date(`${date}T${time}`).toISOString(),
        venue: venue.trim() || null,
      });
      onDone();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={match !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule {title}</DialogTitle>
          <DialogDescription>Change when and where this match is played.</DialogDescription>
        </DialogHeader>
        <form
          id="reschedule-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="rs-date">Date</FieldLabel>
                <Input id="rs-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="rs-time">Time</FieldLabel>
                <Input id="rs-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="rs-venue">Venue</FieldLabel>
              <Input id="rs-venue" list="rs-venues" value={venue} onChange={(e) => setVenue(e.target.value)} />
              <datalist id="rs-venues">
                {t.venues.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </Field>
            {warnings.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm text-amber-700 dark:text-amber-500" aria-live="polite">
                {warnings.map((w) => (
                  <li key={w} className="flex items-start gap-2">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            )}
            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="reschedule-form" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
