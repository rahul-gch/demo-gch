import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getKpisForEntity, getSectorBenchmark, HEADLINE_KPI_IDS } from "@/seed/kpi";

export function BenchmarkChart({ entity }: { entity: Entity }) {
  const kpis = getKpisForEntity(entity);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Benchmark vs sector reference</CardTitle>
        <p className="text-xs text-muted-foreground">
          Sector values pulled from public reports of Inditex, H&amp;M, Nike, Adidas, PUMA,
          Patagonia, Primark, M&amp;S, Zalando, PVH. More peers will be added later.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {HEADLINE_KPI_IDS.map((id) => {
          const ek = kpis.find((k) => k.kpi.id === id);
          if (!ek) return null;
          const sb = getSectorBenchmark(id);
          if (!sb) {
            return (
              <BenchRow
                key={id}
                title={ek.kpi.name}
                entityName={entity.name}
                entityVal={ek.reported ? ek.value : null}
                unit={ek.kpi.unit}
                noBenchmark
              />
            );
          }
          return (
            <BenchRow
              key={id}
              title={ek.kpi.name}
              entityName={entity.name}
              entityVal={ek.reported ? ek.value : null}
              sector={sb}
              unit={ek.kpi.unit}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function BenchRow({
  title,
  entityName,
  entityVal,
  unit,
  sector,
  noBenchmark,
}: {
  title: string;
  entityName: string;
  entityVal: number | null;
  unit: string;
  sector?: {
    min: number;
    max: number;
    median: number;
    values: { company: string; value: number }[];
  };
  noBenchmark?: boolean;
}) {
  const max = Math.max(100, sector?.max ?? 100, entityVal ?? 0);
  const w = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{unit}</div>
      </div>
      <div className="mt-2 space-y-1.5">
        <Row
          label={entityName}
          value={entityVal}
          w={entityVal != null ? w(entityVal) : "0%"}
          primary
        />
        {sector && (
          <>
            <Row label="Sector median" value={sector.median} w={w(sector.median)} />
            <Row label="Sector best" value={sector.max} w={w(sector.max)} />
          </>
        )}
      </div>
      {sector && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sector.values.slice(0, 6).map((v) => (
            <Badge key={v.company} variant="outline" className="text-[10px]">
              {v.company}: {v.value}
            </Badge>
          ))}
        </div>
      )}
      {noBenchmark && (
        <div className="mt-2 text-xs text-muted-foreground">
          No peer benchmark data yet for this KPI.
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  w,
  primary,
}: {
  label: string;
  value: number | null;
  w: string;
  primary?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 text-xs text-muted-foreground">{label}</div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full ${primary ? "bg-slate-900" : "bg-slate-400"}`}
          style={{ width: w }}
        />
      </div>
      <div className="w-14 text-right text-xs tabular-nums">{value == null ? "—" : value}</div>
    </div>
  );
}
