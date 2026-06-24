import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STEPS } from "./steps";

export default function StepIndicator({
  step,
  complete = false,
}: {
  step: number;
  complete?: boolean;
}) {
  const progress = complete
    ? 100
    : Math.round(((step - 1) / (STEPS.length - 1)) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="font-normal tabular-nums">
          {complete ? "Setup complete" : `Step ${step} of ${STEPS.length}`}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {progress}% complete
        </span>
      </div>

      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const active = !complete && step === n;
          const done = complete || step > n;
          const Icon = s.icon;

          return (
            <div key={s.label} className="flex flex-1 items-center">
              {i > 0 && (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    !complete && "transition-colors duration-300",
                    step > i || complete ? "bg-primary" : "bg-border"
                  )}
                />
              )}

              <div className="flex flex-col items-center gap-2 px-1">
                <div
                  className={cn(
                    "relative flex size-10 items-center justify-center rounded-full border-2",
                    !complete && "transition-all duration-300",
                    active &&
                      "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_-4px] shadow-primary/50",
                    done && "border-primary bg-primary/15 text-primary",
                    !active &&
                      !done &&
                      "border-border bg-muted/50 text-muted-foreground"
                  )}
                >
                  {done ? (
                    <Check className="size-4" strokeWidth={2.5} />
                  ) : (
                    <Icon className="size-4" strokeWidth={2} />
                  )}
                  {active && (
                    <span className="absolute -inset-1 animate-pulse rounded-full ring-2 ring-primary/30" />
                  )}
                </div>
                <span
                  className={cn(
                    "hidden max-w-[4.5rem] truncate text-center text-[10px] leading-tight font-medium sm:block",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.short}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    !complete && "transition-colors duration-300",
                    step > n || complete ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
