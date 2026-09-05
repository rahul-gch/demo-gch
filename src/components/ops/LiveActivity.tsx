import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative, type AdminFeedEvent, type FeedEventKind } from "@/lib/admin-feed";
import { Activity } from "lucide-react";

const FILTERS: { id: "all" | FeedEventKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upload", label: "Uploads" },
  { id: "certification", label: "Certifications" },
  { id: "project", label: "Projects" },
  { id: "partnership", label: "Meetings" },
  { id: "message", label: "Feed" },
];

export function LiveActivity({
  events,
  loading,
}: {
  events: AdminFeedEvent[];
  loading?: boolean;
}) {
  const [filter, setFilter] = useState<"all" | FeedEventKind>("all");
  const rows = events.filter((r) => filter === "all" || r.kind === filter).slice(0, 12);
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-4 w-4 shrink-0 text-slate-600" /> Recent activity
        </CardTitle>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                filter === f.id
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-5 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : (
          <ul className="space-y-3 border-l border-slate-200 pl-4">
            {rows.map((r) => (
              <li key={r.id} className="relative">
                <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border border-slate-300 bg-white" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2 text-sm text-slate-700">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded bg-slate-900 text-[10px] font-semibold text-white">
                      {r.orgName.charAt(0)}
                    </span>
                    <span className="min-w-0">
                      {r.orgId ? (
                        <Link
                          to="/organizations/$id"
                          params={{ id: r.orgId }}
                          className="font-medium hover:underline"
                        >
                          {r.orgName}
                        </Link>
                      ) : (
                        <span className="font-medium">{r.orgName}</span>
                      )}{" "}
                      <span className="text-slate-600">{r.title}</span>
                      {r.detail && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {r.detail}
                        </span>
                      )}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 whitespace-nowrap text-[10px] tabular-nums"
                  >
                    {formatRelative(r.at)}
                  </Badge>
                </div>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="text-xs text-muted-foreground">No activity yet.</li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
