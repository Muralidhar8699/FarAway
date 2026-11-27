import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Step {
  title: string;
}

export function StepIndicator({
  steps,
  current,
  onStepClick,
}: {
  steps: Step[];
  current: number;
  /** Called for steps before the current one (going back is always allowed). */
  onStepClick: (index: number) => void;
}) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.title} className="flex flex-1 items-center gap-2 last:flex-none">
            <button
              type="button"
              disabled={!done}
              onClick={() => onStepClick(i)}
              aria-current={active ? "step" : undefined}
              className="flex items-center gap-2 rounded-md text-sm disabled:cursor-default"
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  active && "border-primary bg-primary text-primary-foreground",
                  done && "border-primary text-primary",
                  !active && !done && "text-muted-foreground"
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("font-medium", !active && "text-muted-foreground", !active && "max-sm:sr-only")}>
                {step.title}
              </span>
            </button>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
