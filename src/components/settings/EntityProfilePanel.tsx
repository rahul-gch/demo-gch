import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileFieldGroup } from "@/components/profile/ProfileFields";
import { getOrgProfileAnswers, saveOrgProfileAnswers } from "@/lib/orgs.functions";
import { getProfileSteps, normalizeEntityType, type ProfileAnswers } from "@/lib/entity-profiles";
import { computeProfileScore } from "@/lib/profile-score";
import { refreshRegistry } from "@/lib/registry";

/** Entity-specific questionnaire, editable any time after onboarding. */
export function EntityProfilePanel({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const load = useServerFn(getOrgProfileAnswers);
  const save = useServerFn(saveOrgProfileAnswers);
  const { data, isLoading } = useQuery({
    queryKey: ["org-profile-answers", orgId],
    queryFn: () => load({ data: { orgId } }),
  });

  const [answers, setAnswers] = useState<ProfileAnswers>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.answers) setAnswers(data.answers);
  }, [data]);

  const entityType = data?.entityType ?? "";
  const steps = useMemo(
    () => getProfileSteps(entityType).filter((s) => s.bucket !== "basic"),
    [entityType],
  );
  const score = useMemo(
    () => computeProfileScore(entityType, answers, data?.core ?? {}),
    [entityType, answers, data],
  );

  const submit = async () => {
    setSaving(true);
    try {
      const res = await save({ data: { orgId, answers: answers as never } });
      await queryClient.invalidateQueries({ queryKey: ["org-profile-answers", orgId] });
      await refreshRegistry(queryClient);
      toast.success(`Profile saved — ${res.score}% complete`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your answers");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {normalizeEntityType(entityType)} profile — {score.score}% complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${score.score}%` }}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {score.buckets.map((b) => (
              <div
                key={b.bucket}
                className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{b.label}</span>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {b.answered}/{b.total}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {steps.map((s) => (
        <Card key={s.bucket} className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{s.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileFieldGroup
              fields={s.fields}
              answers={answers}
              onChange={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={() => void submit()} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save profile
        </Button>
      </div>
    </div>
  );
}
