import { useEffect, useState } from "react";
import type { Entity } from "@/seed/types";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Upload, Loader2, Trash2, Download } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ALLOWED_DOCUMENT_EXTENSIONS, safeFileName, validateUploadFile } from "@/lib/policies";
import { logSecurityEvent } from "@/lib/security-log";

interface FileEntry {
  name: string;
  metadata?: { size?: number } | null;
  created_at?: string;
  updated_at?: string;
}


export function ReportUploader({ entity }: { entity: Entity }) {
  const [session, setSession] = useState<unknown | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const folder = entity.id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const list = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from("reports").list(folder, {
      sortBy: { column: "created_at", order: "desc" },
    });
    setLoading(false);
    if (error) {
      // Not signed in or no access — just empty.
      setFiles([]);
      return;
    }
    setFiles((data || []) as unknown as FileEntry[]);
  };

  useEffect(() => {
    if (session) list();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, folder]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const invalid = validateUploadFile(file);
    if (invalid) {
      e.target.value = "";
      toast.error(invalid);
      return;
    }
    setUploading(true);
    const path = `${folder}/${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from("reports").upload(path, file, {
      cacheControl: "3600", upsert: false,
    });
    setUploading(false);
    e.target.value = "";
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return;
    }
    toast.success(`Uploaded ${file.name}`);
    void logSecurityEvent("document.uploaded", {
      orgId: entity.id,
      targetType: "reports",
      targetId: path,
      detail: { size_bytes: file.size },
    });
    list();
  };

  const onDelete = async (name: string) => {
    const { data, error } = await supabase.storage.from("reports").remove([`${folder}/${name}`]);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Storage returns an empty array (no error) when RLS blocks the delete.
    if (!data || data.length === 0) {
      toast.error("You are not authorised to delete this file. Only the person who uploaded it can remove it.");
      return;
    }
    toast.success("File removed");
    void logSecurityEvent("document.deleted", { orgId: entity.id, targetType: "reports", targetId: `${folder}/${name}` });
    list();
  };


  /**
   * Private bucket: never expose a public URL. Authorisation is re-checked by
   * storage RLS when the signed link is minted, and the link expires in 60s.
   */
  const onDownload = async (name: string) => {
    const { data, error } = await supabase.storage
      .from("reports")
      .createSignedUrl(`${folder}/${name}`, 60);
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "You are not authorised to download this file");
      return;
    }
    void logSecurityEvent("document.downloaded", { orgId: entity.id, targetType: "reports", targetId: `${folder}/${name}` });
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Uploaded reports</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Sustainability reports, audits and certificates. Stored privately — only members of
            this organization can open them, through short-lived signed links. Max 20&nbsp;MB
            ({ALLOWED_DOCUMENT_EXTENSIONS.join(", ")}).
          </p>
        </div>
        {session ? (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? "Uploading…" : "Upload report"}
            <input
              type="file"
              className="hidden"
              accept={ALLOWED_DOCUMENT_EXTENSIONS.join(",")}
              onChange={onPick}
              disabled={uploading}
            />
          </label>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link to="/auth">Sign in to upload</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading && <div className="px-5 py-3 text-xs text-muted-foreground">Loading…</div>}
        {!loading && files.length === 0 && (
          <div className="px-5 py-6 text-sm text-muted-foreground">
            {session ? "No reports uploaded yet." : "Sign in to upload sustainability reports for this organization."}
          </div>
        )}
        {files.length > 0 && (
          <ul className="divide-y">
            {files.map((f) => (
              <li key={f.name} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{f.name.replace(/^\d+-/, "")}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.max(1, Math.round((f.metadata?.size || 0) / 1024))} KB · uploaded {(f.created_at || "").slice(0, 10)}
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  Stored
                </Badge>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDownload(f.name)} title="Download">
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(f.name)} title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
