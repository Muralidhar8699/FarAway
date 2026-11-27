import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserRound } from "lucide-react";

import { LogoPicker } from "@/components/LogoPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api, ApiError, type SquadPlayerInput } from "@/data/api";
import { PLAYER_ROLE_LABELS } from "@/lib/labels";
import { BOWLING_STYLES } from "@/lib/squad";
import type { PlayerRole, SquadPlayer } from "@/types/db";
import { playerSchema, type PlayerFormValues } from "./playerSchema";

const ROLES: PlayerRole[] = ["batter", "bowler", "all_rounder", "wicket_keeper"];

const EMPTY: PlayerFormValues = {
  full_name: "",
  photo_url: null,
  jersey_number: "",
  role: "batter",
  batting_style: "right",
  bowling_style: "",
};

function toFormValues(s: SquadPlayer): PlayerFormValues {
  return {
    full_name: s.player.full_name,
    photo_url: s.player.photo_url,
    jersey_number: s.jersey_number === null ? "" : String(s.jersey_number),
    role: s.player.role,
    batting_style: s.player.batting_style,
    bowling_style: s.player.bowling_style ?? "",
  };
}

function toInput(v: PlayerFormValues): SquadPlayerInput {
  return {
    full_name: v.full_name,
    photo_url: v.photo_url,
    jersey_number: v.jersey_number === "" ? null : Number(v.jersey_number),
    role: v.role,
    batting_style: v.batting_style,
    bowling_style: v.bowling_style || null,
  };
}

/** Add a new player to a squad, or edit one ("editing" set). */
export function PlayerFormDialog({
  teamId,
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: SquadPlayer | null;
  onSaved: () => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<PlayerFormValues>({ resolver: zodResolver(playerSchema), defaultValues: EMPTY });
  const { errors, isSubmitting } = form.formState;

  // Fresh form each time the dialog opens.
  useEffect(() => {
    if (open) {
      form.reset(editing ? toFormValues(editing) : EMPTY);
      setSubmitError(null);
    }
  }, [open, editing, form]);

  useEffect(() => {
    const sub = form.watch(() => setSubmitError(null));
    return () => sub.unsubscribe();
  }, [form]);

  async function onSubmit(values: PlayerFormValues) {
    try {
      if (editing) await api.updateSquadPlayer(teamId, editing.player_id, toInput(values));
      else await api.addSquadPlayer(teamId, toInput(values));
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit player" : "Add player"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update this player's details." : "Add a player to the squad."}
          </DialogDescription>
        </DialogHeader>

        <form id="player-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Controller
              control={form.control}
              name="photo_url"
              render={({ field }) => (
                <LogoPicker
                  id="player-photo"
                  label="Photo (optional)"
                  alt="Player photo preview"
                  fallback={<UserRound className="size-8 text-muted-foreground" />}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <div className="grid grid-cols-[1fr_6rem] gap-4">
              <Field data-invalid={!!errors.full_name}>
                <FieldLabel htmlFor="player-name">Full name</FieldLabel>
                <Input
                  id="player-name"
                  autoComplete="off"
                  placeholder="e.g. Ravi Kumar"
                  aria-invalid={!!errors.full_name}
                  {...form.register("full_name")}
                />
              </Field>
              <Field data-invalid={!!errors.jersey_number}>
                <FieldLabel htmlFor="player-jersey">Jersey #</FieldLabel>
                <Input
                  id="player-jersey"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="7"
                  aria-invalid={!!errors.jersey_number}
                  {...form.register("jersey_number")}
                />
              </Field>
            </div>
            <FieldError errors={[errors.full_name, errors.jersey_number].filter(Boolean)} className="-mt-4" />

            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <FieldSet>
                  <FieldLegend variant="label">Role</FieldLegend>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <FieldLabel key={r} htmlFor={`role-${r}`} className="font-normal">
                        <Field orientation="horizontal" className="p-3!">
                          <RadioGroupItem value={r} id={`role-${r}`} />
                          {PLAYER_ROLE_LABELS[r]}
                        </Field>
                      </FieldLabel>
                    ))}
                  </RadioGroup>
                </FieldSet>
              )}
            />

            <Controller
              control={form.control}
              name="batting_style"
              render={({ field }) => (
                <FieldSet>
                  <FieldLegend variant="label">Bats</FieldLegend>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-6">
                    {(["right", "left"] as const).map((b) => (
                      <Field key={b} orientation="horizontal" className="w-auto">
                        <RadioGroupItem value={b} id={`bat-${b}`} />
                        <FieldLabel htmlFor={`bat-${b}`} className="font-normal">
                          {b === "right" ? "Right-handed" : "Left-handed"}
                        </FieldLabel>
                      </Field>
                    ))}
                  </RadioGroup>
                </FieldSet>
              )}
            />

            <Field data-invalid={!!errors.bowling_style}>
              <FieldLabel htmlFor="player-bowling">Bowls</FieldLabel>
              <NativeSelect id="player-bowling" aria-invalid={!!errors.bowling_style} {...form.register("bowling_style")}>
                <NativeSelectOption value="">Doesn't bowl</NativeSelectOption>
                {BOWLING_STYLES.map((b) => (
                  <NativeSelectOption key={b} value={b}>
                    {b}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.bowling_style]} />
            </Field>
          </FieldGroup>

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
          <Button type="submit" form="player-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {editing ? "Save changes" : "Add player"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
