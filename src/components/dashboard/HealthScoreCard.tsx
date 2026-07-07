import type { Entity } from "@/seed/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { bandBadgeClasses, bandBarClasses, computeNhri, healthBars } from "@/lib/nhri";
import { TrendingUp, TrendingDown } from "lucide-react";

export function HealthScoreCard({ entity }: { entity: Entity }) {
  const nhri = computeNhri(entity);
  const bars = healthBars(nhri);
  const delta = nhri.deltaVsPeers;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
          <div className="flex flex-col items-start gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Network Health & Readiness
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-semibold leading-none tabular-nums">{nhri.score}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <Badge variant="outline" className={bandBadgeClasses(nhri.bandTone)}>
              {nhri.band}
            </Badge>
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              {delta >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              )}
              {delta >= 0 ? "+" : ""}
              {delta} vs {entity.entityType} peers · Rank #{nhri.globalRank} of {nhri.totalRanked}
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{b.label}</span>
                  <span className="tabular-nums text-muted-foreground">{b.value}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${bandBarClasses(nhri.bandTone)}`}
                    style={{ width: `${b.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
