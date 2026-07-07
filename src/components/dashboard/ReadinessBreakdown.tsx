import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildReadiness } from "@/lib/dashboard-derive";
import { computeNhri, bandBadgeClasses } from "@/lib/nhri";

export function ReadinessBreakdown({ entity }: { entity: Entity }) {
  const nhri = computeNhri(entity);
  const r = buildReadiness(entity, nhri.score);
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">AI readiness breakdown</CardTitle>
        <Badge variant="outline" className={bandBadgeClasses(nhri.bandTone)}>
          Overall {r.overall}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-500"
              style={{ width: `${r.overall}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            {nhri.band}
          </div>
        </div>
        <div className="space-y-2">
          {r.bars.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{b.label}</span>
                <span className="tabular-nums text-muted-foreground">{b.value}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-slate-700" style={{ width: `${b.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
