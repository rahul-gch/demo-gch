import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildSupplyChainSnapshot } from "@/lib/dashboard-derive";
import { Truck } from "lucide-react";

function Cell({ label, value, tone }: { label: string; value: number; tone?: "risk" | "delay" | "ok" }) {
  const cls =
    tone === "risk"
      ? "border-red-200 bg-red-50 text-red-800"
      : tone === "delay"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "ok"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-slate-50 text-slate-800";
  return (
    <div className={`rounded-md border p-3 ${cls}`}>
      <div className="text-[10px] font-medium uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function SupplyChainSnapshot({ entity }: { entity: Entity }) {
  const s = buildSupplyChainSnapshot(entity);
  const max = Math.max(...s.tiers.map((t) => t.value), 1);
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          <Truck className="mr-1.5 -mt-0.5 inline h-4 w-4 text-slate-600" />
          Supply chain snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Cell label="Suppliers" value={s.suppliers} />
          <Cell label="Countries" value={s.countries} />
          <Cell label="Risks" value={s.risks} tone="risk" />
          <Cell label="Delays" value={s.delays} tone="delay" />
          <Cell label="Certified" value={s.certified} tone="ok" />
        </div>
        <div>
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Tier distribution
          </div>
          <div className="flex h-24 items-end gap-3">
            {s.tiers.map((t) => (
              <div key={t.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-slate-800"
                  style={{ height: `${(t.value / max) * 100}%` }}
                  title={`${t.value}`}
                />
                <div className="text-[10px] text-muted-foreground">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
