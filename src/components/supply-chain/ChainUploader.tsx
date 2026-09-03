import { useEffect, useRef, useState } from "react";
import type { Entity } from "@/seed/types";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileSpreadsheet, Upload, Loader2, Trash2, Download } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface FileEntry {
  name: string;
  metadata?: { size?: number } | null;
  created_at?: string;
}

export function ChainUploader({ entity }: { entity: Entity }) {
  const [session, setSession] = useState<unknown | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Bucket policies cast the top-level folder to a UUID — use the org UUID,
  // not the route slug/legacy id.
  const folder = `${entity.orgUuid ?? entity.id}/supply-chain`;

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
      setFiles([]);
      return;
    }
    setFiles((data || []) as unknown as FileEntry[]);
  };

  useEffect(() => {
    if (session) list();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, folder]);

  const handleFile = async (file: File) => {
    setUploading(true);
    const path = `${folder}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("reports").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    setUploading(false);
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return;
    }

    let rowMsg = "";
    if (/\.csv$/i.test(file.name)) {
      try {
        const text = await file.text();
        const rows = text.split(/\r?\n/).filter((r) => r.trim().length).length - 1;
        if (rows > 0) rowMsg = ` — ${rows} rows detected`;
      } catch {
        /* ignore */
      }
    }
    toast.success(`Chain imported${rowMsg}`);
    list();
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await handleFile(file);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  const onDelete = async (name: string) => {
    const { error } = await supabase.storage.from("reports").remove([`${folder}/${name}`]);
    if (error) toast.error(error.message);
    else {
      toast.success("File removed");
      list();
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-3">
        <div>
          <CardTitle className="text-base font-semibold">Upload existing supply chain</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Import a .xlsx or .csv of your current supplier network. Stored privately under{" "}
            <code>{folder}/</code>.
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <a href="/supply-chain-template.csv" download>
            <Download className="h-3.5 w-3.5" /> Template
          </a>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {session ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
              dragOver ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400"
            }`}
          >
            {uploading ? (
              <Loader2 className="mb-2 h-6 w-6 animate-spin text-slate-500" />
            ) : (
              <Upload className="mb-2 h-6 w-6 text-slate-500" />
            )}
            <div className="text-sm font-medium text-slate-800">
              {uploading ? "Uploading…" : "Drop file here or click to upload"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Accepts .xlsx, .xls, .csv</div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={onPick}
              disabled={uploading}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Sign in to upload supply chain files.
            </span>
            <Button asChild size="sm" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        )}

        {loading && <div className="text-xs text-muted-foreground">Loading…</div>}
        {!loading && files.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {files.map((f) => (
              <li key={f.name} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{f.name.replace(/^\d+-/, "")}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.max(1, Math.round((f.metadata?.size || 0) / 1024))} KB · uploaded{" "}
                    {(f.created_at || "").slice(0, 10)}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  Stored
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => onDelete(f.name)}
                >
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
