import { useState } from "react";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/data/api";
import {
  createTournamentSchema,
  MAX_SQUAD_SIZE,
  STEP_FIELDS,
  type CreateTournamentValues,
} from "@/features/tournaments/createTournamentSchema";
import { DetailsStep } from "@/features/tournaments/DetailsStep";
import { FormatStep } from "@/features/tournaments/FormatStep";
import { RegistrationStep } from "@/features/tournaments/RegistrationStep";
import { RulesStep } from "@/features/tournaments/RulesStep";
import { StepIndicator } from "@/features/tournaments/StepIndicator";
import { DEFAULT_MODE, DEFAULT_TOURNAMENT_RULES, RULE_PRESETS } from "@/lib/tournamentDefaults";

/** Squad of exactly the playing side up to 4 extra players. */
function squadSizesFor(playersPerSide: number) {
  return { min_squad_size: playersPerSide, max_squad_size: Math.min(playersPerSide + 4, MAX_SQUAD_SIZE) };
}

const STEPS = [
  {
    key: "details",
    title: "Details",
    cardTitle: "Tournament details",
    description: "Name, season, logo, dates and where matches are played.",
    Component: DetailsStep,
  },
  {
    key: "rules",
    title: "Rules",
    cardTitle: "Match rules",
    description: "Pick gully or professional, then adjust any rule.",
    Component: RulesStep,
  },
  {
    key: "format",
    title: "Format",
    cardTitle: "Tournament format",
    description: "League, playoffs or knockout, how many teams can join, and how the points table works.",
    Component: FormatStep,
  },
  {
    key: "registration",
    title: "Registration",
    cardTitle: "Team registration",
    description: "Squad sizes and when teams can join.",
    Component: RegistrationStep,
  },
] as const;

export function CreateTournamentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CreateTournamentValues>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: "",
      season: String(new Date().getFullYear()),
      logo_url: null,
      start_date: "",
      end_date: "",
      venues: [],
      mode: DEFAULT_MODE,
      ...RULE_PRESETS[DEFAULT_MODE],
      format: DEFAULT_TOURNAMENT_RULES.format,
      league_rounds: DEFAULT_TOURNAMENT_RULES.league_rounds,
      max_teams: DEFAULT_TOURNAMENT_RULES.max_teams,
      points_win: DEFAULT_TOURNAMENT_RULES.points_win,
      points_tie: DEFAULT_TOURNAMENT_RULES.points_tie,
      points_no_result: DEFAULT_TOURNAMENT_RULES.points_no_result,
      tie_breakers: DEFAULT_TOURNAMENT_RULES.tie_breakers,
      ...squadSizesFor(RULE_PRESETS[DEFAULT_MODE].players_per_side),
      open_registration: true,
      registration_deadline: "",
    },
  });
  const { isSubmitting } = form.formState;

  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];

  function goTo(index: number) {
    setStep(index);
    window.scrollTo({ top: 0 });
  }

  async function goNext() {
    const ok = await form.trigger([...STEP_FIELDS[current.key]], { shouldFocus: true });
    if (!ok) return;
    // Keep squad sizes in step with players per side until the organizer sets them by hand.
    if (current.key === "rules") {
      const { dirtyFields } = form.formState;
      if (!dirtyFields.min_squad_size && !dirtyFields.max_squad_size) {
        const sizes = squadSizesFor(form.getValues("players_per_side"));
        form.setValue("min_squad_size", sizes.min_squad_size);
        form.setValue("max_squad_size", sizes.max_squad_size);
      }
    }
    goTo(step + 1);
  }

  async function onValid(values: CreateTournamentValues) {
    setSubmitError(null);
    try {
      const { open_registration, registration_deadline, ...rest } = values;
      const tournament = await api.createTournament(
        {
          ...DEFAULT_TOURNAMENT_RULES,
          ...rest,
          registration_deadline: registration_deadline ? new Date(registration_deadline).toISOString() : null,
        },
        { openRegistration: open_registration }
      );
      navigate("/tournaments", { state: { createdName: tournament.name } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  // If a field on an earlier step is somehow invalid, jump back to that step.
  function onInvalid(errors: FieldErrors<CreateTournamentValues>) {
    const badStep = STEPS.findIndex((s) =>
      STEP_FIELDS[s.key].some((name) => name in errors)
    );
    if (badStep !== -1 && badStep !== step) goTo(badStep);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Create Tournament</h1>
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}: {current.title}
        </p>
      </div>

      <StepIndicator steps={STEPS.map((s) => ({ title: s.title }))} current={step} onStepClick={goTo} />

      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (isLastStep) form.handleSubmit(onValid, onInvalid)(e);
            else goNext();
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{current.cardTitle}</CardTitle>
              <CardDescription>{current.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <current.Component />
              {submitError && (
                <p role="alert" className="mt-6 text-sm text-destructive">
                  {submitError}
                </p>
              )}
            </CardContent>

            <CardFooter className="flex flex-col-reverse gap-3 border-t sm:flex-row sm:justify-between">
              {step === 0 ? (
                <Button asChild variant="ghost" className="w-full sm:w-auto">
                  <Link to="/tournaments">Cancel</Link>
                </Button>
              ) : (
                <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => goTo(step - 1)}>
                  <ArrowLeft /> Back
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isLastStep ? "Create tournament" : (
                  <>
                    Next <ArrowRight />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </FormProvider>
    </div>
  );
}
