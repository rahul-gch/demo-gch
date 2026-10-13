import type { ReactNode } from "react";
import { GchLogo } from "@/components/GchLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { OnboardingProgress } from "./OnboardingProgress";

/**
 * Full-screen setup shell used by the onboarding routes. Deliberately renders
 * no sidebar, header or app navigation — onboarding lives outside the
 * application shell entirely.
 */
export function OnboardingLayout({
  step,
  total,
  stepLabel,
  title,
  description,
  children,
  footer,
  onStepSelect,
}: {
  step: number;
  total: number;
  stepLabel?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onStepSelect?: (index: number) => void;
}) {
  const nav = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/auth", search: { next: undefined }, replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="min-w-0">
            <GchLogo />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="shrink-0 text-xs text-muted-foreground"
          >
            Sign out
          </Button>
        </div>

        <div className="w-full overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-5 sm:px-8 sm:py-6">
            <OnboardingProgress step={step} total={total} onSelect={onStepSelect} />
            <h1 className="mt-4 text-xl font-semibold tracking-normal sm:text-2xl">{title}</h1>
            {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
            {stepLabel && (
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {stepLabel}
              </p>
            )}
          </div>

          <div
            key={step}
            className="px-5 py-6 sm:px-8 sm:py-8"
          >
            {children}
          </div>

          {footer && (
            <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              {footer}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your answers are saved when you continue.
        </p>
      </div>
    </div>
  );
}
