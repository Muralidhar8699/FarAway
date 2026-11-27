import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Link2, X } from "lucide-react";

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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MAX_SQUAD_SIZE, type CreateTournamentValues } from "./createTournamentSchema";

/** "YYYY-MM-DDTHH:mm" for now, in local time, for the date-time picker's min. */
function nowForPicker() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function RegistrationStep() {
  const form = useFormContext<CreateTournamentValues>();
  const { errors } = form.formState;
  const [playersPerSide, maxTeams, startDate, deadline] = useWatch({
    control: form.control,
    name: ["players_per_side", "max_teams", "start_date", "registration_deadline"],
  });

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend>Squad size</FieldLegend>
        <FieldDescription>
          How many players each team can register. Matches are {playersPerSide} a side, so a squad
          needs at least {playersPerSide}.
        </FieldDescription>
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.min_squad_size}>
            <FieldLabel htmlFor="min_squad_size">Minimum players</FieldLabel>
            <Input
              id="min_squad_size"
              type="number"
              inputMode="numeric"
              min={playersPerSide}
              max={MAX_SQUAD_SIZE}
              step={1}
              aria-invalid={!!errors.min_squad_size}
              {...form.register("min_squad_size", { valueAsNumber: true })}
            />
            <FieldError errors={[errors.min_squad_size]} />
          </Field>
          <Field data-invalid={!!errors.max_squad_size}>
            <FieldLabel htmlFor="max_squad_size">Maximum players</FieldLabel>
            <Input
              id="max_squad_size"
              type="number"
              inputMode="numeric"
              min={playersPerSide}
              max={MAX_SQUAD_SIZE}
              step={1}
              aria-invalid={!!errors.max_squad_size}
              {...form.register("max_squad_size", { valueAsNumber: true })}
            />
            <FieldError errors={[errors.max_squad_size]} />
          </Field>
        </div>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Team registration</FieldLegend>

        <Controller
          control={form.control}
          name="open_registration"
          render={({ field }) => (
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="open_registration">Open registration now</FieldLabel>
                <FieldDescription>
                  Teams can join with the invite link straight away. Turn off to keep the tournament
                  as a draft and open it later.
                </FieldDescription>
              </FieldContent>
              <Switch id="open_registration" checked={field.value} onCheckedChange={field.onChange} />
            </Field>
          )}
        />

        <Field data-invalid={!!errors.registration_deadline}>
          <FieldLabel htmlFor="registration_deadline">Registration deadline (optional)</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="registration_deadline"
              type="datetime-local"
              min={nowForPicker()}
              max={startDate ? `${startDate}T23:59` : undefined}
              aria-invalid={!!errors.registration_deadline}
              {...form.register("registration_deadline")}
            />
            {deadline && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear deadline"
                onClick={() =>
                  form.setValue("registration_deadline", "", { shouldValidate: true, shouldDirty: true })
                }
              >
                <X />
              </Button>
            )}
          </div>
          <FieldDescription>
            After this, teams can't join and squads are locked. Leave empty to close registration by hand.
          </FieldDescription>
          <FieldError errors={[errors.registration_deadline]} />
        </Field>
      </FieldSet>

      <div className="flex gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
        <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p>
          When you finish, you'll get an <strong>invite link and code</strong> to share with team
          captains. Up to <strong>{Number.isFinite(maxTeams) ? maxTeams : "?"} teams</strong> can
          join, and you approve each one.
        </p>
      </div>
    </FieldGroup>
  );
}
