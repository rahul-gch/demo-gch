import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ProfileFieldGroup } from "@/components/profile/ProfileFields";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import {
  completeOnboarding,
  getOrgProfileAnswers,
  saveOrgProfileAnswers,
  updateOrgProfile,
} from "@/lib/orgs.functions";
import { normalizeEntityType, type ProfileAnswers } from "@/lib/entity-profiles";
import { computeProfileScore } from "@/lib/profile-score";
import { refreshRegistry } from "@/lib/registry";

import { getOnboardingPages, getOnboardingSections, canFinishOnboarding } from "@/lib/onboarding-sections";
import { OrganizationReviewFields, type OrganizationReviewValues } from "@/components/onboarding/OrganizationReviewFields";

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
  const updateProfile = useServerFn(updateOrgProfile);

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

  const { data, isLoading, error } = useQuery({
    queryKey: ["org-profile-answers", id],
    queryFn: () => load({ data: { orgId: id } }),
    enabled: authed,
  });

  const [answers, setAnswers] = useState<ProfileAnswers>({});
  const [step, setStep] = useState(0);
  const [core, setCore] = useState<OrganizationReviewValues>({ name: "", country: "", description: "", website: "", city: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (data) {
      setAnswers(data.answers);
      setCore({ name: data.name, ...data.core });
    }
  }, [data]);

  const entityType = data?.entityType ?? "";
  const sections = useMemo(() => getOnboardingSections(entityType), [entityType]);
  const pages = useMemo(() => getOnboardingPages(entityType), [entityType]);
  const current = pages[step - 1];
  const isReview = step === 0;
  const isSummary = step === pages.length + 1;
  const progressStep = isReview ? 0 : isSummary ? sections.length + 1 : (current?.sectionIndex ?? 0) + 1;
  const score = useMemo(() => computeProfileScore(entityType, answers, core), [entityType, answers, core]);

  const setAnswer = (fieldId: string, value: ProfileAnswers[string]) =>
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));

  const finish = async () => {
    setSaving(true);
    try {
      if (!canFinishOnboarding(score.score) || !(await persist())) return;
      setSaving(true);
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
      if (core.name.trim().length < 2) throw new Error("Enter your organization name before continuing.");
      if (data && (core.name !== data.name || core.country !== data.core.country || core.city !== data.core.city || core.website !== data.core.website || core.description !== data.core.description)) {
        await updateProfile({ data: { orgId: id, name: core.name, country: core.country, city: core.city, website: core.website, description: core.description } });
      }
      await save({ data: { orgId: id, answers: answers as never } });
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your answers");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goTo = async (next: number) => {
    if (saving || next === step) return;
    if (await persist()) setStep(next);
  };

  if (error) return <OnboardingLayout step={0} total={1} title="Could not load your profile"><p role="alert" className="text-destructive">{error instanceof Error ? error.message : "Please try again."}</p><Button onClick={() => void queryClient.invalidateQueries({ queryKey: ["org-profile-answers", id] })}>Try again</Button></OnboardingLayout>;

  if (!authed || isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (done) {
    return (
      <OnboardingLayout
        step={sections.length + 1}
        total={sections.length + 2}
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


  return (
    <OnboardingLayout
      step={progressStep}
      total={sections.length + 2}
      title={isReview ? "Review your organization" : isSummary ? "Your profile readiness" : current?.title ?? "Complete your profile"}
      description="Complete what you know now. You can finish the remaining details from your dashboard."
      stepLabel={current && current.total > 1 ? `Questions ${current.batch + 1} of ${current.total}` : undefined}
      onStepSelect={(i) => {
        const target = i === 0 ? 0 : pages.findIndex((p) => p.sectionIndex === i - 1) + 1;
        void goTo(target);
      }}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => isReview ? void finish() : void goTo(step - 1)}
            className="w-full sm:w-auto"
          >
            {isReview ? "Finish later" : <><ArrowLeft className="mr-2 h-4 w-4" /> Back</>}
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => isSummary ? void goTo(0) : void goTo(step + 1)}
              className="w-full sm:w-auto"
            >
              {isSummary ? "Review details" : isReview ? "Continue" : "Skip"}
            </Button>
            <Button
              type="button"
              disabled={saving}
              className="w-full sm:w-auto"
              onClick={() => isSummary ? void finish() : void goTo(step + 1)}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSummary ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Go to dashboard
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
          <Badge variant="brand" className="w-fit max-w-full whitespace-normal px-3 py-1.5 text-sm">
            {normalizeEntityType(entityType)}
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

        {isReview ? <OrganizationReviewFields values={core} entityType={normalizeEntityType(entityType)} onChange={setCore} /> : isSummary ? (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">{score.score > 80 ? "Your profile is ready for partners" : "Aim for more than 80% completeness"}</h2>
            <p className="text-sm text-muted-foreground">{score.score > 80 ? "You can update your details anytime from your workspace." : "You can continue to your dashboard now and complete these details later."}</p>
            <div className="divide-y">
              {score.buckets.filter((b) => b.missing.length > 0).map((bucket) => <div key={bucket.bucket} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0"><p className="text-sm font-medium">{bucket.label}</p><p className="text-xs text-muted-foreground">{bucket.missing.map((m) => m.label).join(", ")}</p></div>
                <Button variant="ghost" size="sm" className="shrink-0" onClick={() => {
                  const pageIndex = pages.findIndex((p) => p.fields.some((f) => f.bucket === bucket.bucket));
                  void goTo(bucket.bucket === "basic" ? 0 : Math.max(0, pageIndex + 1));
                }}>Review <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>)}
            </div>
            <p className="text-xs text-muted-foreground">Credential answers are self-declared. Uploaded documents are verified separately by an administrator.</p>
          </div>
        ) : current ? <ProfileFieldGroup fields={current.fields} answers={answers} onChange={setAnswer} /> : null}
        {!isReview && !isSummary && <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => void finish()} className="text-muted-foreground">Finish later</Button>}
      </div>
    </OnboardingLayout>
  );
}
