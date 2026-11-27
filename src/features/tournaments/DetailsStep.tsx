import { useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ImagePlus, Loader2, MapPin, Plus, Trophy, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resizeImageToDataUrl } from "@/lib/image";
import { MAX_VENUES, type CreateTournamentValues } from "./createTournamentSchema";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

export function DetailsStep() {
  const form = useFormContext<CreateTournamentValues>();
  const { errors } = form.formState;

  return (
    <FieldGroup>
      <Controller
        control={form.control}
        name="logo_url"
        render={({ field }) => <LogoPicker value={field.value} onChange={field.onChange} />}
      />

      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="name">Tournament name</FieldLabel>
        <Input
          id="name"
          placeholder="e.g. Colony Premier League"
          autoComplete="off"
          aria-invalid={!!errors.name}
          {...form.register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field data-invalid={!!errors.season}>
        <FieldLabel htmlFor="season">Season</FieldLabel>
        <Input
          id="season"
          inputMode="numeric"
          placeholder="2026"
          className="max-w-40"
          aria-invalid={!!errors.season}
          {...form.register("season")}
        />
        <FieldDescription>A year like 2026, or 2026-27 if it runs across two years.</FieldDescription>
        <FieldError errors={[errors.season]} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field data-invalid={!!errors.start_date}>
          <FieldLabel htmlFor="start_date">Start date</FieldLabel>
          <Input
            id="start_date"
            type="date"
            aria-invalid={!!errors.start_date}
            {...form.register("start_date")}
          />
          <FieldError errors={[errors.start_date]} />
        </Field>
        <Field data-invalid={!!errors.end_date}>
          <FieldLabel htmlFor="end_date">End date</FieldLabel>
          <Input
            id="end_date"
            type="date"
            min={form.watch("start_date") || undefined}
            aria-invalid={!!errors.end_date}
            {...form.register("end_date")}
          />
          <FieldError errors={[errors.end_date]} />
        </Field>
      </div>

      <Controller
        control={form.control}
        name="venues"
        render={({ field, fieldState }) => (
          <VenuesInput
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
    </FieldGroup>
  );
}

function LogoPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("Image is too large. Pick one under 5 MB.");
      return;
    }
    setBusy(true);
    try {
      onChange(await resizeImageToDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use that image.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor="logo">Logo (optional)</FieldLabel>
      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {value ? (
            <img src={value} alt="Tournament logo preview" className="size-full object-contain" />
          ) : (
            <Trophy className="size-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {value ? "Change logo" : "Upload logo"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X /> Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          id="logo"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <FieldDescription>Square images look best. Max 5 MB.</FieldDescription>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

function VenuesInput({
  value,
  onChange,
  error,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}) {
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function addVenue() {
    const venue = draft.trim().replace(/\s+/g, " ");
    if (!venue) return;
    if (venue.length < 2 || venue.length > 60) {
      setLocalError("Venue name must be 2–60 characters.");
      return;
    }
    if (value.some((v) => v.toLowerCase() === venue.toLowerCase())) {
      setLocalError("That venue is already added.");
      return;
    }
    if (value.length >= MAX_VENUES) {
      setLocalError(`You can add up to ${MAX_VENUES} venues.`);
      return;
    }
    onChange([...value, venue]);
    setDraft("");
    setLocalError(null);
  }

  const shownError = localError ?? error;

  return (
    <Field data-invalid={!!shownError}>
      <FieldLabel htmlFor="venue-input">Venues / grounds</FieldLabel>
      <div className="flex gap-2">
        <Input
          id="venue-input"
          placeholder="e.g. Colony Ground"
          value={draft}
          aria-invalid={!!shownError}
          onChange={(e) => {
            setDraft(e.target.value);
            setLocalError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addVenue();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addVenue}>
          <Plus /> Add
        </Button>
      </div>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Added venues">
          {value.map((venue) => (
            <li
              key={venue}
              className="flex items-center gap-1 rounded-full border bg-secondary py-1 pr-1 pl-3 text-sm"
            >
              <MapPin className="size-3.5 text-muted-foreground" />
              {venue}
              <button
                type="button"
                className="rounded-full p-1 hover:bg-background"
                aria-label={`Remove ${venue}`}
                onClick={() => onChange(value.filter((v) => v !== venue))}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <FieldDescription>Add every ground where matches will be played.</FieldDescription>
      {shownError && <FieldError>{shownError}</FieldError>}
    </Field>
  );
}
