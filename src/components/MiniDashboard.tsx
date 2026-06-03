import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMockKpis } from "@/seed/showcase";
import { ArrowDownRight, ArrowUpRight, Package, Truck } from "lucide-react";

function Sparkline({ values }: { values: number[] }) {
  const w = 100;
  const h = 28;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        {children && <div className="mt-3 text-slate-700">{children}</div>}
      </CardContent>
    </Card>
  );
}

export function MiniDashboard({ entity }: { entity: Entity }) {
  const k = getMockKpis(entity);
  const avgConfidence = 72;
  const delta = entity.confidenceScore - avgConfidence;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Profile completeness"
          value={`${entity.profileCompleteness}%`}
          hint={`${entity.missingDataCount} fields missing`}
        />
        <KpiCard
          label="Confidence score"
          value={`${entity.confidenceScore}%`}
          hint={
            <span className="inline-flex items-center gap-1">
              {delta >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              {Math.abs(delta)}% vs registry avg
            </span>
          }
        />
        <KpiCard
          label="Active orders"
          value={
            <span className="inline-flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-400" />
              {k.activeOrders}
            </span>
          }
          hint="Last 12 weeks"
        >
          <Sparkline values={k.ordersSpark} />
        </KpiCard>
        <KpiCard
          label="On-time delivery"
          value={
            <span className="inline-flex items-center gap-2">
              <Truck className="h-5 w-5 text-slate-400" />
              {k.onTimeDelivery}%
            </span>
          }
          hint={
            <span className="inline-flex items-center gap-1">
              {k.onTimeTrend >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              {Math.abs(k.onTimeTrend)}% MoM
            </span>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-3">
              {k.monthlyVolume.map((m) => {
                const max = Math.max(...k.monthlyVolume.map((x) => x.value));
                const h = (m.value / max) * 100;
                return (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-md bg-slate-900/80"
                      style={{ height: `${h}%` }}
                      title={`${m.value} units`}
                    />
                    <div className="text-xs text-muted-foreground">{m.month}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Material mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {k.materialMix.map((m) => {
              const max = Math.max(...k.materialMix.map((x) => x.value));
              const w = (m.value / max) * 100;
              return (
                <div key={m.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">{m.label}</span>
                    <span className="tabular-nums text-muted-foreground">{m.value}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-slate-700" style={{ width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
