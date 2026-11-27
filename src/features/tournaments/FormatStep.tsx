import { Controller, useFormContext, useWatch } from "react-hook-form";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  isLeagueFormat,
  MAX_TEAMS,
  MIN_TEAMS,
  minTeamsFor,
  planFormat,
} from "@/lib/format";
import { FORMAT_LABELS, TIE_BREAKER_LABELS } from "@/lib/labels";
import { DEFAULT_TOURNAMENT_RULES } from "@/lib/tournamentDefaults";
import type { TournamentFormat } from "@/types/db";
import type { CreateTournamentValues } from "./createTournamentSchema";

const FORMAT_DESCRIPTIONS: Record<TournamentFormat, string> = {
  league_playoffs:
    "Every team plays each other. The top 4 go to Qualifier 1, Eliminator, Qualifier 2 and the Final, so the top 2 get a second chance.",
  league_semis: "Every team plays each other. The top 4 play semi-finals, then the final.",
  knockout: "Lose once and you're out. Fastest format, good for a one-day event.",
};

const FORMATS: TournamentFormat[] = ["league_playoffs", "league_semis", "knockout"];
const POINT_KEYS = ["points_win", "points_tie", "points_no_result"] as const;

export function FormatStep() {
  const form = useFormContext<CreateTournamentValues>();
  const format = useWatch({ control: form.control, name: "format" });
  const { errors } = form.formState;

  return (
    <FieldGroup>
      <Controller
        control={form.control}
        name="format"
        render={({ field }) => (
          <FieldSet>
            <FieldLegend>How is the tournament played?</FieldLegend>
            <RadioGroup
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v);
                // Knockouts have no points table: drop any half-typed points so they can't block "Next".
                if (!isLeagueFormat(v as TournamentFormat)) {
                  for (const key of POINT_KEYS) form.setValue(key, DEFAULT_TOURNAMENT_RULES[key]);
                  form.setValue("tie_breakers", DEFAULT_TOURNAMENT_RULES.tie_breakers);
                  form.clearErrors([...POINT_KEYS, "tie_breakers"]);
                }
                // Team-count rules differ per format, so re-check once one is entered.
                if (form.getFieldState("max_teams").isTouched || errors.max_teams) form.trigger("max_teams");
              }}
              className="grid gap-3"
            >
              {FORMATS.map((f) => (
                <FieldLabel key={f} htmlFor={`format-${f}`}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{FORMAT_LABELS[f]}</FieldTitle>
                      <FieldDescription>{FORMAT_DESCRIPTIONS[f]}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={f} id={`format-${f}`} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </FieldSet>
        )}
      />

      <FieldSeparator />

      <Field data-invalid={!!errors.max_teams}>
        <FieldLabel htmlFor="max_teams">Number of teams</FieldLabel>
        <Input
          id="max_teams"
          type="number"
          inputMode="numeric"
          min={minTeamsFor(format)}
          max={MAX_TEAMS}
          step={1}
          className="max-w-32"
          aria-invalid={!!errors.max_teams}
          {...form.register("max_teams", { valueAsNumber: true })}
        />
        <FieldDescription>
          How many teams can join ({minTeamsFor(format)}–{MAX_TEAMS}).
        </FieldDescription>
        <FieldError errors={[errors.max_teams]} />
      </Field>

      {isLeagueFormat(format) && (
        <Controller
          control={form.control}
          name="league_rounds"
          render={({ field }) => (
            <FieldSet>
              <FieldLegend variant="label">League matches</FieldLegend>
              <RadioGroup
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v) as 1 | 2)}
                className="grid gap-3 sm:grid-cols-2"
              >
                <FieldLabel htmlFor="rounds-1">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Play each team once</FieldTitle>
                      <FieldDescription>Single round-robin</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value="1" id="rounds-1" />
                  </Field>
                </FieldLabel>
                <FieldLabel htmlFor="rounds-2">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Play each team twice</FieldTitle>
                      <FieldDescription>Double round-robin, like the IPL</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value="2" id="rounds-2" />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </FieldSet>
          )}
        />
      )}

      {isLeagueFormat(format) && (
        <>
          <FieldSeparator />
          <PointsSection />
        </>
      )}

      <FormatPreview />
    </FieldGroup>
  );
}

/** Live summary of the stages and number of matches for the chosen format. */
function FormatPreview() {
  const form = useFormContext<CreateTournamentValues>();
  const [format, teams, rounds] = useWatch({
    control: form.control,
    name: ["format", "max_teams", "league_rounds"],
  });

  const valid = Number.isInteger(teams) && teams >= Math.max(MIN_TEAMS, minTeamsFor(format)) && teams <= MAX_TEAMS;

  return (
    <section aria-live="polite" className="rounded-lg border bg-muted/40 p-4">
      <h3 className="mb-3 text-sm font-medium">Tournament plan</h3>
      {!valid ? (
        <p className="text-sm text-muted-foreground">Enter a valid number of teams to see the plan.</p>
      ) : (
        <PlanDetails plan={planFormat(format, teams, isLeagueFormat(format) ? rounds : 1)} teams={teams} />
      )}
    </section>
  );
}

function PlanDetails({ plan, teams }: { plan: ReturnType<typeof planFormat>; teams: number }) {
  return (
    <>
      <ol className="flex flex-col gap-2">
        {plan.stages.map((stage, i) => (
          <li key={stage.name} className="flex gap-3 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold ring-1 ring-border">
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap justify-between gap-x-2">
                <span className="font-medium">{stage.name}</span>
                <span className="text-muted-foreground">
                  {stage.matches} match{stage.matches > 1 ? "es" : ""}
                </span>
              </div>
              {stage.note && <p className="text-muted-foreground">{stage.note}</p>}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t pt-3 text-sm">
        <strong>{plan.totalMatches} matches</strong> in total for {teams} teams. A team plays up to{" "}
        {plan.maxMatchesPerTeam}.
      </p>
    </>
  );
}

/** Points for each result, and the order of tie-breakers for teams level on points. */
function PointsSection() {
  const form = useFormContext<CreateTournamentValues>();
  const { errors } = form.formState;
  const pointFields = [
    { name: "points_win", label: "Win", min: 1 },
    { name: "points_tie", label: "Tie", min: 0 },
    { name: "points_no_result", label: "No result", min: 0 },
  ] as const;

  return (
    <FieldSet>
      <FieldLegend>Points table</FieldLegend>
      <FieldDescription>Points a team gets for each result in the league.</FieldDescription>
      <div className="grid grid-cols-3 gap-3">
        {pointFields.map((f) => (
          <Field key={f.name} data-invalid={!!errors[f.name]}>
            <FieldLabel htmlFor={f.name}>{f.label}</FieldLabel>
            <Input
              id={f.name}
              type="number"
              inputMode="numeric"
              min={f.min}
              max={10}
              step={1}
              aria-invalid={!!errors[f.name]}
              {...form.register(f.name, { valueAsNumber: true })}
            />
          </Field>
        ))}
      </div>
      <FieldError errors={pointFields.map((f) => errors[f.name])} />

      <Controller
        control={form.control}
        name="tie_breakers"
        render={({ field, fieldState }) => {
          const move = (from: number, to: number) => {
            const next = [...field.value];
            [next[from], next[to]] = [next[to], next[from]];
            field.onChange(next);
          };
          return (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel id="tie-breakers-label">If teams are level on points</FieldLabel>
              <FieldDescription>Checked in this order. Use the arrows to change it.</FieldDescription>
              <ol aria-labelledby="tie-breakers-label" className="flex flex-col gap-2">
                {field.value.map((tb, i) => (
                  <li key={tb} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {i + 1}
                    </span>
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{TIE_BREAKER_LABELS[tb].title}</div>
                      <div className="text-muted-foreground">{TIE_BREAKER_LABELS[tb].description}</div>
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={i === 0}
                        aria-label={`Move ${TIE_BREAKER_LABELS[tb].title} up`}
                        onClick={() => move(i, i - 1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={i === field.value.length - 1}
                        aria-label={`Move ${TIE_BREAKER_LABELS[tb].title} down`}
                        onClick={() => move(i, i + 1)}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
              <FieldError errors={[fieldState.error]} />
            </Field>
          );
        }}
      />
    </FieldSet>
  );
}
