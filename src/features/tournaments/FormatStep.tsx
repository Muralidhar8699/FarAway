import { Controller, useFormContext, useWatch } from "react-hook-form";

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
import { FORMAT_LABELS } from "@/lib/labels";
import type { TournamentFormat } from "@/types/db";
import type { CreateTournamentValues } from "./createTournamentSchema";

const FORMAT_DESCRIPTIONS: Record<TournamentFormat, string> = {
  league_playoffs:
    "Every team plays each other. The top 4 go to Qualifier 1, Eliminator, Qualifier 2 and the Final, so the top 2 get a second chance.",
  league_semis: "Every team plays each other. The top 4 play semi-finals, then the final.",
  knockout: "Lose once and you're out. Fastest format, good for a one-day event.",
};

const FORMATS: TournamentFormat[] = ["league_playoffs", "league_semis", "knockout"];

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
