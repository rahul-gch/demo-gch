import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getVerification, submitVerificationDocument } from "@/lib/verification";
import { useCredentials } from "./CredentialsPanel";
import { VerificationUpload } from "./VerificationUpload";

export function ReadinessChecklist({ orgId, routeId }: { orgId: string; routeId: string }) {
  const qc = useQueryClient();
  const v = useQuery({ queryKey: ["org-verification", orgId], queryFn: () => getVerification(orgId) });
  const creds = useCredentials(orgId);
  const manage = useQuery({
    queryKey: ["can-manage", orgId],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("user_can_manage", { _user: u.user.id, _org: orgId });
      return !!data;
    },
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  if (v.isLoading || creds.isLoading || !manage.data) return null;

  const status = v.data?.status ?? "not_submitted";
  const has = (k: string) => (creds.data ?? []).some((c) => c.kind === k);
  const items = [
    { label: "Business verification", done: status === "verified", pending: status === "pending" },
    { label: "Facility audits", done: has("audit") },
    { label: "Certificates", done: has("certificate") },
    { label: "Memberships", done: has("membership") },
  ];
  const pct = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  if (pct === 100) return null;

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      await submitVerificationDocument(orgId, file);
      setFile(null);
      toast.success("Submitted for review");
      qc.invalidateQueries({ queryKey: ["org-verification", orgId] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Profile readiness</CardTitle>
          <span className="text-sm font-semibold tabular-nums">{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.label} className="flex items-center gap-2">
              {i.done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : i.pending ? <Clock className="h-4 w-4 text-brand" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={i.done ? "text-muted-foreground line-through" : ""}>{i.label}</span>
              {i.pending && <span className="text-xs text-muted-foreground">In review</span>}
            </li>
          ))}
          <li className="pt-1">
            <Button asChild size="sm" variant="outline">
              <Link to="/organizations/$id/compliance" params={{ id: routeId }}>Add credentials</Link>
            </Button>
          </li>
        </ul>
        {(status === "not_submitted" || status === "rejected") && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {status === "rejected" ? `Your document was not accepted${v.data?.note ? `: ${v.data.note}` : ""}. Please upload a new one.` : "Upload your business registration to get a verified badge."}
            </p>
            <VerificationUpload file={file} onFile={setFile} showLater={false} />
            {file && <Button size="sm" disabled={busy} onClick={upload}>Submit for review</Button>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
