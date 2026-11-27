import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarCheck, Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api, ApiError } from "@/data/api";
import { buildFixtures, defaultScheduleOptions, scheduleFixtures } from "@/lib/fixtures";
import { formatDateRange } from "@/lib/labels";
import type { Team, Tournament } from "@/types/db";

const scheduleSchema = z.object({
  startDate: z.string().min(1, "Pick the first match day"),
  matchesPerDay: z.number({ error: "Enter a number" }).int().min(1, "At least 1").max(12, "At most 12"),
  firstMatchTime: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
  minutesBetween: z.number({ error: "Enter a number" }).int().min(15, "At least 15 minutes").max(600, "At most 600"),
  newDayPerStage: z.boolean(),
});
type ScheduleValues = z.infer<typeof scheduleSchema>;

export function GenerateFixturesDialog({
  tournament: t,
  approvedTeams,
  pendingCount,
  redo,
  open,
  onOpenChange,
  onDone,
}: {
  tournament: Tournament;
  approvedTeams: Team[];
  pendingCount: number;
  /** True when fixtures already exist and will be replaced. */
  redo: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const defaults = useMemo(() => {
    const total = buildFixtures(t, approvedTeams.map((x) => x.id), () => 0.5).length;
    const { venues: _venues, ...d } = defaultScheduleOptions(t, total);
    return d;
  }, [t, approvedTeams]);
  const form = useForm<ScheduleValues>({ resolver: zodResolver(scheduleSchema), defaultValues: defaults });
  const { errors, isSubmitting } = form.formState;
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      form.reset(defaults);
      setSubmitError(null);
    }
  }, [open, defaults, form]);

  // Preview with a fixed draw: the real draw is random, but counts and dates don't depend on it.
  const values = useWatch({ control: form.control });
  const preview = useMemo(() => {
    const parsed = scheduleSchema.safeParse(values);
    if (!parsed.success) return null;
    const drafts = buildFixtures(t, approvedTeams.map((x) => x.id), () => 0.5);
    const { lastDate } = scheduleFixtures(drafts, { ...parsed.data, venues: t.venues });
    return { total: drafts.length, lastDate };
  }, [values, t, approvedTeams]);

  async function onSubmit(v: ScheduleValues) {
    setSubmitError(null);
    try {
      await api.generateFixtures(t.id, { ...v, venues: t.venues });
      onDone();
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{redo ? "Redo fixtures" : "Generate fixtures"}</DialogTitle>
          <DialogDescription>
            {approvedTeams.length} approved teams are drawn at random and given match dates. You can change any
            match's date, time or venue afterwards.
          </DialogDescription>
        </DialogHeader>

        <form id="fixtures-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.startDate}>
                <FieldLabel htmlFor="fx-start">First match day</FieldLabel>
                <Input id="fx-start" type="date" aria-invalid={!!errors.startDate} {...form.register("startDate")} />
                <FieldError errors={[errors.startDate]} />
              </Field>
              <Field data-invalid={!!errors.firstMatchTime}>
                <FieldLabel htmlFor="fx-time">First match starts</FieldLabel>
                <Input id="fx-time" type="time" aria-invalid={!!errors.firstMatchTime} {...form.register("firstMatchTime")} />
                <FieldError errors={[errors.firstMatchTime]} />
              </Field>
              <Field data-invalid={!!errors.matchesPerDay}>
                <FieldLabel htmlFor="fx-perday">Matches per day</FieldLabel>
                <Input
                  id="fx-perday"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={12}
                  aria-invalid={!!errors.matchesPerDay}
                  {...form.register("matchesPerDay", { valueAsNumber: true })}
                />
                <FieldError errors={[errors.matchesPerDay]} />
              </Field>
              <Field data-invalid={!!errors.minutesBetween}>
                <FieldLabel htmlFor="fx-gap">Minutes per match</FieldLabel>
                <Input
                  id="fx-gap"
                  type="number"
                  inputMode="numeric"
                  min={15}
                  step={15}
                  aria-invalid={!!errors.minutesBetween}
                  {...form.register("minutesBetween", { valueAsNumber: true })}
                />
                <FieldError errors={[errors.minutesBetween]} />
              </Field>
            </div>
            <Controller
              control={form.control}
              name="newDayPerStage"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="fx-newday">Start each round on a new day</FieldLabel>
                    <FieldDescription>Playoffs and knockout rounds begin on a fresh day. Turn off for one-day events.</FieldDescription>
                  </FieldContent>
                  <Switch id="fx-newday" checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />
            <FieldDescription>Matches rotate through your venues: {t.venues.join(", ")}.</FieldDescription>
          </FieldGroup>

          {preview && (
            <div className="mt-4 flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 text-sm" aria-live="polite">
              <p className="flex items-center gap-2">
                <CalendarCheck className="size-4 shrink-0" />
                <span>
                  <strong>{preview.total} matches</strong>,{" "}
                  {formatDateRange(values.startDate ?? t.start_date, preview.lastDate)}
                </span>
              </p>
              {preview.lastDate > t.end_date && (
                <p className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
                  <TriangleAlert className="size-4 shrink-0" />
                  Runs past the tournament's end date ({formatDateRange(t.end_date, t.end_date)}). Try more matches
                  per day.
                </p>
              )}
            </div>
          )}

          <ul className="mt-4 flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
            {pendingCount > 0 && (
              <li>
                {pendingCount} team{pendingCount > 1 ? "s" : ""} still waiting for approval won't be included.
              </li>
            )}
            {redo && <li>All current fixtures and their dates will be replaced with a new draw.</li>}
            {!redo && <li>Registration closes and squads lock (you can still change squads as the organizer).</li>}
          </ul>

          {submitError && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {submitError}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="fixtures-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {redo ? "Redo fixtures" : "Generate fixtures"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
