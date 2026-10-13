import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPendingVerifications, reviewVerification, verificationDocumentUrl } from "@/lib/verification";

export function VerificationQueue() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-verifications"], queryFn: listPendingVerifications });
  const [notes, setNotes] = useState<Record<string, string>>({});

  const act = async (orgId: string, status: "verified" | "rejected") => {
    try {
      await reviewVerification(orgId, status, notes[orgId]);
      toast.success(status === "verified" ? "Organization verified" : "Document rejected");
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const open = async (path: string | null) => {
    if (!path) return;
    const url = await verificationDocumentUrl(path);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Could not open the document");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Business verification queue</CardTitle>
        <p className="text-sm text-muted-foreground">Registration documents waiting for review, oldest first.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!q.isLoading && (q.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No documents waiting.</p>}
        {(q.data ?? []).map((r) => {
          const org = r.orgs as { name?: string; type?: string; country?: string } | null;
          return (
            <div key={r.org_id} className="flex flex-wrap items-center gap-3 rounded-md border p-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{org?.name ?? r.org_id}</div>
                <div className="text-xs text-muted-foreground">
                  {[org?.type, org?.country, r.submitted_at && new Date(r.submitted_at).toLocaleDateString()].filter(Boolean).join(" · ")}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => open(r.document_path)}>View document</Button>
              <Input
                placeholder="Note (optional)"
                className="h-8 w-48"
                value={notes[r.org_id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [r.org_id]: e.target.value.slice(0, 300) }))}
              />
              <Button size="sm" variant="outline" onClick={() => act(r.org_id, "rejected")}>Reject</Button>
              <Button size="sm" onClick={() => act(r.org_id, "verified")}>Approve</Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
