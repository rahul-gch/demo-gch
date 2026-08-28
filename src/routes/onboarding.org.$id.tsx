import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ProfileFieldGroup } from "@/components/profile/ProfileFields";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import {
  completeOnboarding,
  getOrgProfileAnswers,
  saveOrgProfileAnswers,
} from "@/lib/orgs.functions";
import { getProfileSteps, normalizeEntityType, type ProfileAnswers } from "@/lib/entity-profiles";
import { computeProfileScore } from "@/lib/profile-score";
import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/onboarding/org/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Complete your organization profile — Global Chain Hub" },
      {
        name: "description",
        content:
          "Answer a few questions tailored to your entity type so partners can find and match with your organization.",
      },
      { property: "og:title", content: "Complete your organization profile — Global Chain Hub" },
      {
        property: "og:description",
        content: "Entity-specific profile setup for Global Chain Hub members.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingProfilePage,
});

function OnboardingProfilePage() {
  const { id } = useParams({ from: "/onboarding/org/$id" });
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const load = useServerFn(getOrgProfileAnswers);
  const save = useServerFn(saveOrgProfileAnswers);
  const finishFn = useServerFn(completeOnboarding);

  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      if (!data.user) nav({ to: "/auth", search: { next: "/onboarding" }, replace: true });
      else setAuthed(true);
    });
    return () => {
      alive = false;
    };
  }, [nav]);

  const { data, isLoading } = useQuery({
    queryKey: ["org-profile-answers", id],
    queryFn: () => load({ data: { orgId: id } }),
    enabled: authed,
  });

  const [answers, setAnswers] = useState<ProfileAnswers>({});
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (data?.answers) setAnswers(data.answers);
  }, [data]);

  const entityType = data?.entityType ?? "";
  const steps = useMemo(() => getProfileSteps(entityType), [entityType]);
  const questionSteps = useMemo(() => steps.filter((s) => s.bucket !== "basic"), [steps]);
  const current = questionSteps[Math.min(step, Math.max(questionSteps.length - 1, 0))];

  const score = useMemo(
    () => computeProfileScore(entityType, answers, data?.core ?? {}),
    [entityType, answers, data],
  );

  const setAnswer = (fieldId: string, value: ProfileAnswers[string]) =>
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));

  const finish = async () => {
    setSaving(true);
    try {
      await save({ data: { orgId: id, answers: answers as never } });
      await finishFn({ data: { orgId: id } });
      await queryClient.invalidateQueries({ queryKey: ["org-profile-answers", id] });
      queryClient.removeQueries({ queryKey: ["my-org-memberships-gate"] });
      await refreshRegistry(queryClient);
      setDone(true);
      setTimeout(() => nav({ to: "/organizations/$id", params: { id }, replace: true }), 1400);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete setup");
      setSaving(false);
    }
  };

  const persist = async () => {
    setSaving(true);
    try {
      await save({ data: { orgId: id, answers: answers as never } });
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your answers");
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (!authed || isLoading || !current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (done) {
    return (
      <OnboardingLayout
        step={questionSteps.length}
        total={questionSteps.length + 1}
        title="You're all set."
        description="Your organization profile is ready."
      >
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary" />
          <p className="text-sm text-muted-foreground">Taking you to your dashboard…</p>
        </div>
      </OnboardingLayout>
    );
  }

  const isLast = step === questionSteps.length - 1;

  return (
    <OnboardingLayout
      // step 0 of the whole flow was creating the organization
      step={step + 1}
      total={questionSteps.length + 1}
      title={current.title}
      description="Skip anything you don't have yet — you can finish later from Settings."
      onStepSelect={(i) => setStep(Math.max(0, i - 1))}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0 || saving}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => {
                if (isLast) void finish();
                else setStep((s) => s + 1);
              }}
              className="w-full sm:w-auto"
            >
              Skip
            </Button>
            <Button
              type="button"
              disabled={saving}
              className="w-full sm:w-auto"
              onClick={async () => {
                if (isLast) {
                  await finish();
                  return;
                }
                if (await persist()) setStep((s) => s + 1);
              }}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLast ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Finish setup
                </>
              ) : (
                <>
                  Save &amp; continue <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Badge variant="outline" className="w-fit gap-1">
            <Sparkles className="h-3 w-3" /> {normalizeEntityType(entityType)}
          </Badge>
          <div className="min-w-40 flex-1">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Profile completeness</span>
              <span className="font-semibold text-foreground">{score.score}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${score.score}%` }}
              />
            </div>
          </div>
        </div>

        <ProfileFieldGroup fields={current.fields} answers={answers} onChange={setAnswer} />
      </div>
    </OnboardingLayout>
  );
}
