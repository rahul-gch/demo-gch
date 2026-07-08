import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AlertItem, Severity } from "@/lib/ops-derive";
import { AlertTriangle, ArrowUpRight } from "lucide-react";

const tone: Record<Severity, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function PlatformAlerts({ items }: { items: AlertItem[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-600" /> Platform alerts
        </CardTitle>
        <span className="text-xs text-muted-foreground">{items.length} active</span>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((a) => (
          <Link
            key={a.id}
            to={a.to}
            className="group flex items-start justify-between gap-3 rounded-md border p-3 transition hover:bg-slate-50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tone[a.tone]}`}>
                  {a.tone}
                </span>
                <span className="truncate text-sm font-medium text-slate-800">{a.title}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{a.detail}</div>
            </div>
            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-700" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
