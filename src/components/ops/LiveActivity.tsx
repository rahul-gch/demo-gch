import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { liveActivity, type ActivityKind, type ActivityRow } from "@/lib/ops-derive";
import { Upload, CheckCircle2, Sparkles, FolderKanban, ShieldCheck, Activity } from "lucide-react";

const ICONS: Record<ActivityKind, React.ComponentType<{ className?: string }>> = {
  upload: Upload,
  approval: CheckCircle2,
  ai: Sparkles,
  project: FolderKanban,
  verification: ShieldCheck,
};

const FILTERS: { id: "all" | ActivityKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upload", label: "Uploads" },
  { id: "approval", label: "Approvals" },
  { id: "ai", label: "AI" },
  { id: "project", label: "Projects" },
];

export function LiveActivity() {
  const [filter, setFilter] = useState<"all" | ActivityKind>("all");
  const rows = liveActivity().filter((r: ActivityRow) => filter === "all" || r.kind === filter);
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-4 w-4 shrink-0 text-slate-600" /> Live activity
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
        <ul className="space-y-3 border-l border-slate-200 pl-4">
          {rows.map((r, i) => {
            const Icon = ICONS[r.kind];
            return (
              <li key={i} className="relative">
                <div className="absolute -left-[21px] top-1.5 grid h-3 w-3 place-items-center rounded-full border border-slate-300 bg-white">
                  <Icon className="h-2 w-2 text-slate-500" />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2 text-sm text-slate-700">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded bg-slate-900 text-[10px] font-semibold text-white">
                      {r.org.charAt(0)}
                    </span>
                    <span className="min-w-0">
                      <span className="font-medium">{r.org}</span>{" "}
                      <span className="text-slate-600">{r.text}</span>
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 whitespace-nowrap text-[10px] tabular-nums"
                  >
                    {r.time}
                  </Badge>
                </div>
              </li>
            );
          })}
          {rows.length === 0 && (
            <li className="text-xs text-muted-foreground">No activity for this filter.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
