import { useState } from "react";
import { Controller, useFormContext, useWatch, type FieldPath } from "react-hook-form";
import { RotateCcw, Undo2 } from "lucide-react";

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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { MODE_LABELS } from "@/lib/labels";
import { MATCH_RULE_KEYS, RULE_PRESETS, type MatchRules } from "@/lib/tournamentDefaults";
import type { TournamentMode } from "@/types/db";
import type { CreateTournamentValues } from "./createTournamentSchema";

type NumberName = Extract<
  FieldPath<CreateTournamentValues>,
  "overs_per_innings" | "players_per_side" | "powerplay_overs" | "max_overs_per_bowler"
>;
type SwitchName = Extract<
  FieldPath<CreateTournamentValues>,
  "free_hit_on_no_ball" | "last_man_stands" | "super_over_on_tie"
>;

export function RulesStep() {
  const form = useFormContext<CreateTournamentValues>();
  const overs = form.watch("overs_per_innings");
  const usualPerBowler = Number.isFinite(overs) && overs > 0 ? Math.ceil(overs / 5) : null;

  return (
    <FieldGroup>
      <ModePicker />

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Match length</FieldLegend>
        <div className="grid gap-6 sm:grid-cols-2">
          <NumberInput
            name="overs_per_innings"
            label="Overs per innings"
            description="T20 = 20. Gully matches are often 5–8."
            max={50}
          />
          <NumberInput
            name="players_per_side"
            label="Players per side"
            description="11 for a full team. Gully teams can be smaller."
            min={2}
            max={11}
          />
          <NumberInput
            name="powerplay_overs"
            label="Powerplay overs"
            description="Fielding restrictions at the start. 0 for none."
            min={0}
            max={20}
          />
          <NumberInput
            name="max_overs_per_bowler"
            label="Max overs per bowler"
            description={
              usualPerBowler
                ? `Usually ${usualPerBowler} for a ${overs}-over innings (one fifth).`
                : "Usually one fifth of the innings."
            }
            max={50}
          />
        </div>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Extras</FieldLegend>
        <FieldDescription>Wides and no-balls are always bowled again.</FieldDescription>
        <div className="grid gap-6 sm:grid-cols-2">
          <RunsSelect name="wide_runs" label="Runs for a wide" />
          <RunsSelect name="no_ball_runs" label="Runs for a no-ball" />
        </div>
        <SwitchField
          name="free_hit_on_no_ball"
          label="Free hit after a no-ball"
          description="The next ball is a free hit: the batter can only be run out."
        />
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Special rules</FieldLegend>
        <SwitchField
          name="super_over_on_tie"
          label="Super over if the match is tied"
          description="Each team bats one over to decide the winner."
        />
        <SwitchField
          name="last_man_stands"
          label="Last man stands"
          description="When only one batter is left, they can keep batting alone (popular in gully cricket)."
        />
      </FieldSet>
    </FieldGroup>
  );
}

function NumberInput({
  name,
  label,
  description,
  min = 1,
  max,
}: {
  name: NumberName;
  label: string;
  description: string;
  min?: number;
  max: number;
}) {
  const form = useFormContext<CreateTournamentValues>();
  const error = form.formState.errors[name];
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        className="max-w-32"
        aria-invalid={!!error}
        {...form.register(name, { valueAsNumber: true })}
      />
      <FieldDescription>{description}</FieldDescription>
      <FieldError errors={[error]} />
    </Field>
  );
}

function RunsSelect({ name, label }: { name: "wide_runs" | "no_ball_runs"; label: string }) {
  const form = useFormContext<CreateTournamentValues>();
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <NativeSelect id={name} {...form.register(name, { valueAsNumber: true })}>
        <NativeSelectOption value={0}>0 runs</NativeSelectOption>
        <NativeSelectOption value={1}>1 run (standard)</NativeSelectOption>
        <NativeSelectOption value={2}>2 runs</NativeSelectOption>
      </NativeSelect>
    </Field>
  );
}

function SwitchField({
  name,
  label,
  description,
}: {
  name: SwitchName;
  label: string;
  description: string;
}) {
  const form = useFormContext<CreateTournamentValues>();
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <FieldDescription>{description}</FieldDescription>
          </FieldContent>
          <Switch id={name} checked={field.value} onCheckedChange={field.onChange} />
        </Field>
      )}
    />
  );
}

const MODE_SUMMARIES: Record<TournamentMode, string> = {
  gully: "Short matches with flexible rules for street and colony cricket.",
  professional: "Full T20 rules for club, corporate and league cricket.",
};

function presetSummary(r: MatchRules) {
  const parts = [`${r.overs_per_innings} overs`, `${r.players_per_side} a side`];
  if (r.last_man_stands) parts.push("last man stands");
  if (r.free_hit_on_no_ball) parts.push("free hits");
  return parts.join(" · ");
}

function pickRules(values: CreateTournamentValues): MatchRules {
  return Object.fromEntries(MATCH_RULE_KEYS.map((k) => [k, values[k]])) as MatchRules;
}

function sameRules(a: MatchRules, b: MatchRules) {
  return MATCH_RULE_KEYS.every((k) => a[k] === b[k]);
}

/** Gully / Professional cards. Picking one fills in that mode's usual rules. */
function ModePicker() {
  const form = useFormContext<CreateTournamentValues>();
  const mode = useWatch({ control: form.control, name: "mode" });
  const values = useWatch({ control: form.control }) as CreateTournamentValues;
  const customized = !sameRules(pickRules(values), RULE_PRESETS[mode]);

  // What to restore if the organizer undoes a mode switch that replaced their own rules.
  const [undo, setUndo] = useState<{ mode: TournamentMode; rules: MatchRules } | null>(null);

  function applyRules(nextMode: TournamentMode, rules: MatchRules) {
    form.setValue("mode", nextMode, { shouldDirty: true });
    for (const key of MATCH_RULE_KEYS) form.setValue(key, rules[key], { shouldDirty: true });
    form.clearErrors([...MATCH_RULE_KEYS]);
  }

  function selectMode(next: string) {
    const nextMode = next as TournamentMode;
    if (nextMode === mode) return;
    const current = form.getValues();
    setUndo(customized ? { mode, rules: pickRules(current) } : null);
    applyRules(nextMode, RULE_PRESETS[nextMode]);
  }

  return (
    <FieldSet>
      <FieldLegend>Type of tournament</FieldLegend>
      <FieldDescription>
        Picking one fills in its usual rules below. You can still change any rule.
      </FieldDescription>
      <RadioGroup value={mode} onValueChange={selectMode} className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(RULE_PRESETS) as TournamentMode[]).map((m) => (
          <FieldLabel key={m} htmlFor={`mode-${m}`}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{MODE_LABELS[m]}</FieldTitle>
                <FieldDescription>
                  {MODE_SUMMARIES[m]}
                  <span className="mt-1 block font-medium text-foreground/80">
                    {presetSummary(RULE_PRESETS[m])}
                  </span>
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem value={m} id={`mode-${m}`} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>

      {undo && !customized ? (
        <div role="status" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Your changed rules were replaced with the usual {MODE_LABELS[mode]} rules.
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => {
              applyRules(undo.mode, undo.rules);
              setUndo(null);
            }}
          >
            <Undo2 /> Undo
          </Button>
        </div>
      ) : customized ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Some rules are different from the usual {MODE_LABELS[mode]} rules.
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => {
              applyRules(mode, RULE_PRESETS[mode]);
              setUndo(null);
            }}
          >
            <RotateCcw /> Reset to {MODE_LABELS[mode]} rules
          </Button>
        </div>
      ) : null}
    </FieldSet>
  );
}
