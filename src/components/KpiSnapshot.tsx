import type { Entity } from "@/seed/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getHeadlineKpis, confidenceClasses } from "@/seed/kpi";

export function KpiSnapshot({ entity }: { entity: Entity }) {
  const kpis = getHeadlineKpis(entity);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => (
        <Card key={k.kpi.id} className="shadow-sm">
          <CardContent className="p-4">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {k.kpi.id} · {k.kpi.category}
            </div>
            <div className="mt-1 text-sm font-medium leading-tight">{k.kpi.name}</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{k.displayValue}</div>
            <div className="mt-2 flex items-center justify-between">
              <Badge variant="outline" className={`text-[10px] ${confidenceClasses(k.band.tone)}`}>
                {k.reported ? `${k.band.label} · ${k.confidence}%` : "Not reported"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
