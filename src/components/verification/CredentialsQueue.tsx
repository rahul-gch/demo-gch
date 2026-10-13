import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { verificationDocumentUrl } from "@/lib/verification";

const KIND_LABEL: Record<string, string> = { audit: "Audit", certificate: "Certificate", membership: "Membership" };

export function CredentialsQueue() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"self_declared" | "verified" | "rejected">("self_declared");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const q = useQuery({
    queryKey: ["admin-credentials", filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_credentials")
        .select("*, orgs(name, country)")
        .eq("status", filter)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const counts = useQuery({
    queryKey: ["admin-credentials", "counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_credentials").select("status").limit(5000);
      if (error) throw error;
      const c: Record<string, number> = {};
      for (const r of data ?? []) c[r.status] = (c[r.status] ?? 0) + 1;
      return c;
    },
  });

  const act = async (id: string, status: "verified" | "rejected") => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("org_credentials")
      .update({ status, reviewed_by: u.user?.id ?? null, reviewed_at: new Date().toISOString(), review_note: notes[id]?.trim() || null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "verified" ? "Approved — now shown in directory filters" : "Rejected");
    qc.invalidateQueries({ queryKey: ["admin-credentials"] });
  };
  const open = async (path: string) => {
    const url = await verificationDocumentUrl(path);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Could not open the document");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Credentials review</CardTitle>
          <p className="text-sm text-muted-foreground">Audit reports, certificates and memberships. Approved items appear in directory filters.</p>
        </div>
        <div className="flex gap-1">
          {(["self_declared", "verified", "rejected"] as const).map((s) => (
            <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
              {s === "self_declared" ? "Pending" : s === "verified" ? "Approved" : "Rejected"} ({counts.data?.[s] ?? 0})
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {q.isError && <p className="text-sm text-destructive">Could not load credentials: {(q.error as Error).message}</p>}
        {!q.isLoading && !q.isError && (q.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            {filter === "self_declared" ? "No credentials waiting for review." : filter === "verified" ? "No approved credentials yet." : "No rejected credentials yet."}
          </p>
        )}
        {(q.data ?? []).map((r) => {
          const org = r.orgs as { name?: string; country?: string } | null;
          return (
            <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-md border p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-medium">
                  {r.standard}
                  <Badge variant="secondary">{KIND_LABEL[r.kind] ?? r.kind}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {[org?.name, org?.country, r.reference, r.score, r.scope, r.expires_at && `Expires ${r.expires_at}`].filter(Boolean).join(" · ")}
                </div>
                {r.review_note && <div className="mt-1 text-xs text-muted-foreground">Note: {r.review_note}</div>}
                {r.reviewed_at && <div className="mt-1 text-xs text-muted-foreground">Reviewed {new Date(r.reviewed_at).toLocaleString()}</div>}
              </div>
              {r.document_path ? (
                <Button size="sm" variant="outline" onClick={() => open(r.document_path!)}>View document</Button>
              ) : (
                <span className="text-xs text-muted-foreground">No document</span>
              )}
              {filter === "self_declared" && (
                <>
                  <Input placeholder="Note (optional)" className="h-8 w-44" value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value.slice(0, 300) }))} />
                  <Button size="sm" variant="outline" onClick={() => act(r.id, "rejected")}>Reject</Button>
                  <Button size="sm" onClick={() => act(r.id, "verified")}>Approve</Button>
                </>
              )}
              {filter !== "self_declared" && (
                <Button size="sm" variant="outline" onClick={() => act(r.id, filter === "verified" ? "rejected" : "verified")}>
                  {filter === "verified" ? "Revoke" : "Approve"}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
