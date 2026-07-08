import { Card, CardContent } from "@/components/ui/card";
import { growthKpis, type KpiTrend } from "@/lib/ops-derive";

function Sparkline({ data }: { data: number[] }) {
  const w = 80;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-20 text-sky-500">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}

export function GrowthKpis() {
  const items = growthKpis();
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {items.map((k: KpiTrend) => (
        <Card key={k.id} className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {k.label}
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{k.value}</div>
              </div>
              <Sparkline data={k.sparkline} />
            </div>
            <div className="mt-1 text-xs font-medium text-emerald-600">{k.delta}</div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
