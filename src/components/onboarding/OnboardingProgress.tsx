import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Dot-and-connector rail: completed, current and remaining onboarding steps. */
export function OnboardingProgress({
  step,
  total,
  onSelect,
}: {
  step: number;
  total: number;
  onSelect?: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">
        Step {Math.min(step + 1, total)} of {total}
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const done = i < step;
          const current = i === step;
          const clickable = Boolean(onSelect) && done;
          return (
            <div key={i} className="flex min-w-0 flex-1 items-center gap-1.5 last:flex-none">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Step ${i + 1}`}
                aria-current={current ? "step" : undefined}
                disabled={!clickable}
                onClick={() => clickable && onSelect?.(i)}
                className={cn(
                  "h-3 w-3 min-w-0 shrink-0 rounded-full p-0 transition-colors disabled:opacity-100",
                  done || current ? "bg-primary" : "bg-muted-foreground/25",
                  current && "ring-4 ring-primary/15",
                  clickable && "cursor-pointer",
                )}
              />
              {i < total - 1 && (
                <div
                  className={cn(
                    "h-0.5 min-w-3 flex-1 rounded-full transition-colors",
                    done ? "bg-primary" : "bg-muted-foreground/20",
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
