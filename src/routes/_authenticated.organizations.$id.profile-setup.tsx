import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileFieldGroup } from "@/components/profile/ProfileFields";
import { getOrgProfileAnswers, saveOrgProfileAnswers } from "@/lib/orgs.functions";
import { getProfileSteps, normalizeEntityType, type ProfileAnswers } from "@/lib/entity-profiles";
import { computeProfileScore } from "@/lib/profile-score";
import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/organizations/$id/profile-setup")({
  head: () => ({
    meta: [
      { title: "Complete your profile — Global Chain Hub" },
      {
        name: "description",
        content:
          "Answer a few questions tailored to your entity type so partners can find and match with your organization.",
      },
      { property: "og:title", content: "Complete your profile — Global Chain Hub" },
      {
        property: "og:description",
        content: "Entity-specific profile setup for Global Chain Hub members.",
      },
    ],
  }),
  component: ProfileSetupPage,
});

function ProfileSetupPage() {
  const { id } = useParams({ from: "/_authenticated/organizations/$id/profile-setup" });
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const load = useServerFn(getOrgProfileAnswers);
  const save = useServerFn(saveOrgProfileAnswers);

  const { data, isLoading } = useQuery({
    queryKey: ["org-profile-answers", id],
    queryFn: () => load({ data: { orgId: id } }),
  });

  const [answers, setAnswers] = useState<ProfileAnswers>({});
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

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

  const persist = async (finish: boolean) => {
    setSaving(true);
    try {
      const res = await save({ data: { orgId: id, answers: answers as never } });
      await queryClient.invalidateQueries({ queryKey: ["org-profile-answers", id] });
      await refreshRegistry(queryClient);
      if (finish) {
        toast.success(`Profile saved — ${res.score}% complete`);
        nav({ to: "/organizations/$id", params: { id }, replace: true });
      }
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your answers");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    if (step >= questionSteps.length - 1) {
      await persist(true);
      return;
    }
    const ok = await persist(false);
    if (ok) setStep((s) => s + 1);
  };

  if (isLoading || !current) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isLast = step === questionSteps.length - 1;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-2">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" /> {normalizeEntityType(entityType)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {questionSteps.length}
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Complete your profile</h1>
        <p className="text-sm text-muted-foreground">
          These questions are tailored to your entity type. Skip anything you don't have yet — you
          can finish later from Settings.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Profile completeness</span>
              <span className="font-semibold">{score.score}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${score.score}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-1.5">
        {questionSteps.map((s, i) => (
          <button
            key={s.bucket}
            type="button"
            onClick={() => setStep(i)}
            className={`h-1.5 flex-1 min-w-8 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
            aria-label={s.title}
          />
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{current.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileFieldGroup fields={current.fields} answers={answers} onChange={setAnswer} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0 || saving}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => {
              if (isLast) void persist(true);
              else setStep((s) => s + 1);
            }}
          >
            {isLast ? "Finish later" : "Skip"}
          </Button>
          <Button type="button" disabled={saving} onClick={() => void next()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLast ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Save & finish
              </>
            ) : (
              <>
                Save & continue <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
