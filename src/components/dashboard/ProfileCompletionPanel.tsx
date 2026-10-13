import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileFieldGroup } from "@/components/profile/ProfileFields";
import { getOrgProfileAnswers, saveOrgProfileAnswers } from "@/lib/orgs.functions";
import { getRemainingProfileSteps } from "@/lib/profile-completion";
import { normalizeEntityType, type ProfileAnswers } from "@/lib/entity-profiles";
import { useAuthenticatedSessionReady } from "@/lib/use-comms";
import { useOrgRole } from "@/lib/use-org-role";
import { refreshRegistry } from "@/lib/registry";

type QuestionBatch = ReturnType<typeof getRemainingProfileSteps>[number];

export function ProfileCompletionPanel(props: { orgId: string; routeId: string }) {
  const ready = useAuthenticatedSessionReady();
  return ready ? <AuthorizedProfileCompletion {...props} /> : null;
}

function AuthorizedProfileCompletion({ orgId, routeId }: { orgId: string; routeId: string }) {
  const { canEdit } = useOrgRole(orgId);
  const load = useServerFn(getOrgProfileAnswers);
  const save = useServerFn(saveOrgProfileAnswers);
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["org-profile-answers", orgId],
    queryFn: () => load({ data: { orgId } }),
    enabled: canEdit,
  });
  const [open, setOpen] = useState(false);
  const [batches, setBatches] = useState<QuestionBatch[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ProfileAnswers>({});
  const [patch, setPatch] = useState<ProfileAnswers>({});
  const [busy, setBusy] = useState(false);
  const data = profile.data;
  if (!canEdit || !data) return null;
  const remaining = getRemainingProfileSteps(data.entityType, data.answers);
  const count = remaining.reduce((sum, s) => sum + s.fields.length, 0);
  const current = batches[index];

  const start = () => {
    setBatches(remaining.flatMap((s) => {
      const chunks: QuestionBatch[] = [];
      for (let i = 0; i < s.fields.length; i += 3) chunks.push({ ...s, fields: s.fields.slice(i, i + 3) });
      return chunks;
    }));
    setAnswers(data.answers);
    setPatch({});
    setIndex(0);
    setOpen(true);
  };

  const persist = async (close: boolean) => {
    setBusy(true);
    try {
      if (Object.keys(patch).length > 0) {
        await save({ data: { orgId, answers: patch as never } });
        await qc.invalidateQueries({ queryKey: ["org-profile-answers"] });
        await refreshRegistry(qc);
        toast.success("Profile details saved");
      }
      setPatch({});
      if (close || index === batches.length - 1) setOpen(false);
      else setIndex((i) => i + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile details");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Complete your profile" className="border-y bg-muted/20 px-4 py-5 sm:px-6">
      <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 space-y-1">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            {count === 0 && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
            {count ? "Complete your profile" : "Profile questions completed"}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {count ? `${normalizeEntityType(data.entityType)} · ${count} unanswered questions` : "Your entity-specific details are saved."}
          </p>
        </div>
        {count > 0 ? <Button onClick={start} className="shrink-0">Continue profile <ArrowRight className="ml-2 h-4 w-4" /></Button> :
          <Button variant="outline" asChild><Link to="/organizations/$id/settings" params={{ id: routeId }}>Review profile</Link></Button>}
      </div>
      <Dialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden rounded-lg p-0">
          <DialogHeader className="shrink-0 border-b px-5 py-5 pr-12 text-left sm:px-6">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{normalizeEntityType(data.entityType)} · {index + 1} of {batches.length}</p>
            <DialogTitle className="tracking-normal">{current?.title ?? "Profile details"}</DialogTitle>
            <DialogDescription>Complete what you know. Remaining details can wait.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto px-5 py-6 sm:px-6">
            {current && <ProfileFieldGroup fields={current.fields} answers={answers} onChange={(id, value) => {
              setAnswers((a) => ({ ...a, [id]: value }));
              setPatch((a) => ({ ...a, [id]: value }));
            }} />}
          </div>
          <div className="grid shrink-0 gap-2 border-t px-5 py-4 sm:flex sm:flex-wrap sm:justify-end sm:px-6">
            <Button variant="ghost" disabled={busy} onClick={() => void persist(true)}>Finish later</Button>
            <Button variant="outline" disabled={busy} onClick={() => {
              setPatch({});
              if (index === batches.length - 1) setOpen(false);
              else setIndex((i) => i + 1);
            }}>Skip section</Button>
            <Button disabled={busy} onClick={() => void persist(false)}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {index === batches.length - 1 ? "Save & finish" : "Save & continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}