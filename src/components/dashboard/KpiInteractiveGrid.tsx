import type { Entity } from "@/seed/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getHeadlineKpis, confidenceClasses } from "@/seed/kpi";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function KpiInteractiveGrid({ entity }: { entity: Entity }) {
  const kpis = getHeadlineKpis(entity);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k, i) => {
        const trend = ((i * 7) % 9) - 3; // deterministic-ish trend %
        const target = Math.min(100, Math.round(k.value + 10 + (i % 3) * 4));
        const status = k.reported
          ? k.value >= target - 2
            ? "On track"
            : k.value >= target - 10
              ? "Watch"
              : "Behind"
          : "No data";
        const statusTone =
          status === "On track"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : status === "Watch"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : status === "Behind"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-slate-200 bg-slate-50 text-slate-600";
        return (
          <Card key={k.kpi.id} className="shadow-sm">
            <CardContent className="p-4">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {k.kpi.id} · {k.kpi.category}
              </div>
              <div className="mt-1 text-xs font-medium leading-tight text-slate-700">
                {k.kpi.name}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-2xl font-semibold tabular-nums">{k.displayValue}</div>
                {k.reported && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs ${
                      trend >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {trend >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {trend >= 0 ? "+" : ""}
                    {trend}%
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Target {target}</span>
                  <span>{k.confidence}% conf.</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-slate-800"
                    style={{ width: `${Math.min(100, (k.value / Math.max(1, target)) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Badge variant="outline" className={`text-[10px] ${confidenceClasses(k.band.tone)}`}>
                  {k.band.label}
                </Badge>
                <Badge variant="outline" className={`text-[10px] ${statusTone}`}>
                  {status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
