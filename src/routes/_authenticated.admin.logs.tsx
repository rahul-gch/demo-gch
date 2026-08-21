import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { amIPlatformAdmin } from "@/lib/admin.functions";
import { listAppErrors, resolveAppError } from "@/lib/errors.functions";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({
    meta: [
      { title: "System logs — Global Chain Hub Admin" },
      {
        name: "description",
        content:
          "Review browser and server errors captured across Global Chain Hub, with filters and resolution tracking.",
      },
      { property: "og:title", content: "System logs — Global Chain Hub Admin" },
      { property: "og:description", content: "Captured platform errors and their status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLogsPage,
});

type SourceFilter = "all" | "browser" | "server";

function AdminLogsPage() {
  const admin = useQuery({ queryKey: ["platform-admin"], queryFn: () => amIPlatformAdmin() });
  const queryClient = useQueryClient();

  const [hours, setHours] = useState(24);
  const [source, setSource] = useState<SourceFilter>("all");
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);
  const [search, setSearch] = useState("");

  const logs = useQuery({
    queryKey: ["app-errors", hours, source, unresolvedOnly, search],
    queryFn: () => listAppErrors({ data: { hours, source, unresolvedOnly, search } }),
    enabled: !!admin.data?.isAdmin,
  });

  const resolve = useMutation({
    mutationFn: (id: string) => resolveAppError({ data: { id } }),
    onSuccess: () => {
      toast.success("Marked as resolved");
      void queryClient.invalidateQueries({ queryKey: ["app-errors"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update"),
  });

  if (admin.isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!admin.data?.isAdmin) {
    return (
      <AppShell>
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <ShieldAlert className="h-5 w-5" />
            This area is restricted to platform admins.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const rows = logs.data?.rows ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Errors captured from the browser and the server, newest first.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last hour</SelectItem>
                <SelectItem value="24">Last 24 hours</SelectItem>
                <SelectItem value="168">Last 7 days</SelectItem>
                <SelectItem value="720">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={(v) => setSource(v as SourceFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="browser">Browser</SelectItem>
                <SelectItem value="server">Server</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={unresolvedOnly ? "unresolved" : "all"}
              onValueChange={(v) => setUnresolvedOnly(v === "unresolved")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unresolved">Unresolved only</SelectItem>
                <SelectItem value="all">Including resolved</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search message or route"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {logs.isLoading ? "Loading…" : `${rows.length} error${rows.length === 1 ? "" : "s"}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!logs.isLoading && rows.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No errors recorded for this filter. That's good news.
              </p>
            )}
            {rows.map((row: any) => (
              <div key={row.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">{row.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(row.occurred_at).toLocaleString()}
                      {row.route ? ` · ${row.route}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline">{row.source}</Badge>
                    {row.resolved_at ? (
                      <Badge variant="secondary">Resolved</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resolve.isPending}
                        onClick={() => resolve.mutate(row.id)}
                      >
                        Mark resolved
                      </Button>
                    )}
                  </div>
                </div>
                {row.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Stack trace
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px] leading-relaxed">
                      {row.stack}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
