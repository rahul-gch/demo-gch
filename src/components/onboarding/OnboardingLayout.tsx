import type { ReactNode } from "react";
import { Globe2 } from "lucide-react";
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
    <div className="min-h-screen w-full bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Globe2 className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Global Chain Hub</span>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="text-xs text-muted-foreground hover:underline"
          >
            Sign out
          </button>
        </div>

        <div className="w-full rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-5 sm:px-8 sm:py-6">
            <OnboardingProgress step={step} total={total} onSelect={onStepSelect} />
            <h1 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
            {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
            {stepLabel && (
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {stepLabel}
              </p>
            )}
          </div>

          <div
            key={step}
            className="animate-in fade-in slide-in-from-right-2 px-5 py-6 duration-200 sm:px-8 sm:py-8"
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
          Your progress is saved automatically at each step.
        </p>
      </div>
    </div>
  );
}
