import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Shield } from "lucide-react";

import { LogoPicker } from "@/components/LogoPicker";
import { TeamBadge } from "@/components/TeamBadge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/data/api";
import { TEAM_COLORS } from "@/lib/registration";
import { cn } from "@/lib/utils";
import type { Team, Tournament } from "@/types/db";
import { suggestShortName, teamSchema, type TeamFormValues } from "./teamSchema";

export function TeamRegistrationForm({
  tournament,
  onRegistered,
}: {
  tournament: Tournament;
  onRegistered: (team: Team) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      short_name: "",
      logo_url: null,
      primary_color: TEAM_COLORS[8],
      home_ground: "",
    },
  });
  const { errors, isSubmitting } = form.formState;

  // A server error (e.g. "name already taken") is about the old values: clear it once they change.
  useEffect(() => {
    const sub = form.watch(() => setSubmitError(null));
    return () => sub.unsubscribe();
  }, [form]);
  const [name, shortName, color, logo] = useWatch({
    control: form.control,
    name: ["name", "short_name", "primary_color", "logo_url"],
  });

  // Fill the short name from the team name until the captain types their own.
  const nameField = form.register("name", {
    onChange: (e) => {
      if (!form.getFieldState("short_name").isDirty) {
        form.setValue("short_name", suggestShortName(e.target.value));
      }
    },
  });

  async function onSubmit(values: TeamFormValues) {
    setSubmitError(null);
    try {
      const team = await api.createTeam(tournament.id, {
        ...values,
        short_name: values.short_name.toUpperCase(),
        home_ground: values.home_ground || null,
      });
      onRegistered(team);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  const preview: Team = {
    id: "preview",
    tournament_id: tournament.id,
    name: name || "Your team",
    short_name: (shortName || "?").toUpperCase(),
    logo_url: logo,
    primary_color: color,
    home_ground: null,
    owner_id: "",
    status: "pending",
    created_at: "",
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3" aria-label="Preview">
        <TeamBadge team={preview} />
        <div className="min-w-0">
          <p className="truncate font-medium">{preview.name}</p>
          <p className="text-sm text-muted-foreground">How your team will appear</p>
        </div>
      </div>

      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="team-name">Team name</FieldLabel>
          <Input
            id="team-name"
            placeholder="e.g. Street Smashers"
            autoComplete="off"
            aria-invalid={!!errors.name}
            {...nameField}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.short_name}>
          <FieldLabel htmlFor="short-name">Short name</FieldLabel>
          <Input
            id="short-name"
            placeholder="SS"
            maxLength={4}
            autoComplete="off"
            autoCapitalize="characters"
            className="max-w-32 uppercase"
            aria-invalid={!!errors.short_name}
            {...form.register("short_name")}
          />
          <FieldDescription>2–4 letters shown on scorecards, like CSK or MI.</FieldDescription>
          <FieldError errors={[errors.short_name]} />
        </Field>

        <Controller
          control={form.control}
          name="logo_url"
          render={({ field }) => (
            <LogoPicker
              id="team-logo"
              label="Team logo (optional)"
              alt="Team logo preview"
              fallback={<Shield className="size-8 text-muted-foreground" />}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          control={form.control}
          name="primary_color"
          render={({ field }) => (
            <Field>
              <FieldLabel id="team-color-label">Team colour</FieldLabel>
              <div role="radiogroup" aria-labelledby="team-color-label" className="flex flex-wrap items-center gap-2">
                {TEAM_COLORS.map((c) => {
                  const selected = field.value.toLowerCase() === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={c}
                      onClick={() => field.onChange(c)}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition",
                        selected && "ring-2 ring-foreground"
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {selected && <Check className="size-4 text-white" />}
                    </button>
                  );
                })}
                <label className="flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm">
                  <input
                    type="color"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="size-5 cursor-pointer border-0 bg-transparent p-0"
                    aria-label="Custom colour"
                  />
                  Custom
                </label>
              </div>
            </Field>
          )}
        />

        <Field data-invalid={!!errors.home_ground}>
          <FieldLabel htmlFor="home-ground">Home ground (optional)</FieldLabel>
          <Input
            id="home-ground"
            list="tournament-venues"
            placeholder={tournament.venues[0] ? `e.g. ${tournament.venues[0]}` : "e.g. Colony Ground"}
            aria-invalid={!!errors.home_ground}
            {...form.register("home_ground")}
          />
          <datalist id="tournament-venues">
            {tournament.venues.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          <FieldError errors={[errors.home_ground]} />
        </Field>
      </FieldGroup>

      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="animate-spin" />}
        Register team
      </Button>
      <p className="-mt-3 text-center text-xs text-muted-foreground">
        The organizer reviews every team. You'll add players after registering.
      </p>
    </form>
  );
}
