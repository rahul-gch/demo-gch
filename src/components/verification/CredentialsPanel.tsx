import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Paperclip, Plus, Trash2 } from "lucide-react";
import { validateVerificationFile, verificationDocumentUrl } from "@/lib/verification";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Kind = "audit" | "certificate" | "membership";
const CATALOG: Record<Kind, { label: string; standards: string[]; ref: string; extra?: string }> = {
  audit: { label: "Facility audits", standards: ["SMETA / Sedex", "amfori BSCI", "WRAP", "SLCP", "Higg FEM", "Higg FSLM"], ref: "Facility / audit ID", extra: "Score or grade" },
  certificate: { label: "Certificates", standards: ["GOTS", "GRS", "RCS", "OEKO-TEX Standard 100", "BCI", "Cradle to Cradle"], ref: "Certificate number", extra: "Scope" },
  membership: { label: "Memberships", standards: ["ZDHC", "Cascale", "Textile Exchange"], ref: "Member ID" },
};

export function useCredentials(orgId: string | undefined) {
  return useQuery({
    queryKey: ["org-credentials", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("org_credentials").select("*").eq("org_id", orgId!).order("created_at");
      return data ?? [];
    },
  });
}

function AddForm({ orgId, kind }: { orgId: string; kind: Kind }) {
  const qc = useQueryClient();
  const c = CATALOG[kind];
  const [standard, setStandard] = useState("");
  const [reference, setReference] = useState("");
  const [extra, setExtra] = useState("");
  const [expires, setExpires] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const add = useMutation({
    mutationFn: async () => {
      let document_path: string | null = null;
      if (file) {
        const bad = validateVerificationFile(file);
        if (bad) throw new Error(bad);
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
        document_path = `${orgId}/credentials/${crypto.randomUUID()}-${safe}`;
        const { error: up } = await supabase.storage.from("org-verification").upload(document_path, file, { contentType: file.type });
        if (up) throw up;
      }
      const { error } = await supabase.from("org_credentials").insert({
        org_id: orgId,
        kind,
        standard,
        reference: reference.trim().slice(0, 120) || null,
        score: kind === "audit" ? extra.trim().slice(0, 40) || null : null,
        scope: kind === "certificate" ? extra.trim().slice(0, 200) || null : null,
        expires_at: expires || null,
        document_path,
        document_name: file?.name.slice(0, 200) ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setStandard(""); setReference(""); setExtra(""); setExpires(""); setFile(null);
      qc.invalidateQueries({ queryKey: ["org-credentials", orgId] });
      toast.success(file ? "Submitted for review" : "Added as self-declared");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="grid gap-3 rounded-md border bg-muted/30 p-3 sm:grid-cols-[1.2fr_1fr_1fr_0.9fr_auto] sm:items-end">
      <div className="space-y-1">
        <Label className="text-xs">Standard</Label>
        <Select value={standard} onValueChange={setStandard}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{c.standards.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label className="text-xs">{c.ref}</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} /></div>
      {c.extra ? (
        <div className="space-y-1"><Label className="text-xs">{c.extra}</Label><Input value={extra} onChange={(e) => setExtra(e.target.value)} /></div>
      ) : <div />}
      <div className="space-y-1"><Label className="text-xs">{kind === "membership" ? "Renewal" : "Expiry"}</Label><Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></div>
      <Button size="sm" disabled={!standard || add.isPending} onClick={() => add.mutate()}><Plus className="mr-1 h-4 w-4" />Add</Button>
      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground sm:col-span-5">
        <Paperclip className="h-3.5 w-3.5" />
        <span className="truncate">{file ? file.name : `Attach ${kind === "audit" ? "audit report" : kind === "certificate" ? "certificate" : "proof"} (PDF, JPG, PNG, max 10 MB) — required for verification`}</span>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  );
}

export function CredentialsPanel({ orgId, canEdit }: { orgId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const q = useCredentials(orgId);
  const del = async (id: string) => {
    const { error } = await supabase.from("org_credentials").delete().eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["org-credentials", orgId] });
  };
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Credentials</CardTitle>
        <p className="text-sm text-muted-foreground">Add audits, certificates and memberships. Items stay self-declared until our team verifies them.</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="audit">
          <TabsList>
            {(Object.keys(CATALOG) as Kind[]).map((k) => (
              <TabsTrigger key={k} value={k}>{CATALOG[k].label} ({(q.data ?? []).filter((r) => r.kind === k).length})</TabsTrigger>
            ))}
          </TabsList>
          {(Object.keys(CATALOG) as Kind[]).map((k) => {
            const rows = (q.data ?? []).filter((r) => r.kind === k);
            return (
              <TabsContent key={k} value={k} className="space-y-3 pt-3">
                {rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing added yet.</p>}
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{r.standard}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[r.reference, r.score, r.scope, r.expires_at && `Expires ${r.expires_at}`].filter(Boolean).join(" · ") || "No details"}
                      </div>
                    </div>
                    {r.document_path && (
                      <button aria-label="View document" className="rounded p-1 text-muted-foreground hover:bg-muted" onClick={async () => { const u = await verificationDocumentUrl(r.document_path!); if (u) window.open(u, "_blank", "noopener"); }}>
                        <FileText className="h-4 w-4" />
                      </button>
                    )}
                    <Badge variant={r.status === "verified" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                      {r.status === "verified" ? "Verified" : r.status === "rejected" ? "Rejected" : r.document_path ? "In review" : "Self-declared"}
                    </Badge>
                    {canEdit && (
                      <button aria-label="Remove" className="rounded p-1 text-muted-foreground hover:bg-muted" onClick={() => del(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {canEdit && <AddForm orgId={orgId} kind={k} />}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
