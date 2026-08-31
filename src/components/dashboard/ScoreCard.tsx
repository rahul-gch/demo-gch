import type { Entity } from "@/seed/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { bandBadgeClasses, bandBarClasses, computeNhri, healthBars } from "@/lib/nhri";
import { buildReadiness } from "@/lib/dashboard-derive";
import { isSeededOrg } from "@/seed/showcase";
import { TrendingDown, TrendingUp } from "lucide-react";

const RING_TONE: Record<string, string> = {
  emerald: "text-emerald-500",
  sky: "text-sky-500",
  amber: "text-amber-500",
  red: "text-red-500",
};

function ScoreRing({ score, tone }: { score: number; tone: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * c;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 112 112" className="h-32 w-32 -rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" strokeWidth="10" className="stroke-slate-100" />
        <circle
          cx="56"
          cy="56"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          className={RING_TONE[tone] ?? "text-sky-500"}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold leading-none tabular-nums">{score}</span>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  );
}

/**
 * Merged Network Health score + readiness breakdown. Replaces the separate
 * HealthScoreCard / ReadinessBreakdown pair on the Overview tab.
 */
export function ScoreCard({ entity }: { entity: Entity }) {
  const nhri = computeNhri(entity);
  const seeded = isSeededOrg(entity);
  const readiness = buildReadiness(entity, nhri.score);
  const bars = healthBars(nhri).slice(0, 3);
  const delta = nhri.deltaVsPeers;

  return (
    <Card className="shadow-sm">
      <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Network Health &amp; Readiness
          </div>
          <ScoreRing score={nhri.score} tone={nhri.bandTone} />
          <Badge variant="outline" className={bandBadgeClasses(nhri.bandTone)}>
            {nhri.band}
          </Badge>
          {seeded ? (
            <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              {delta >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              )}
              {delta >= 0 ? "+" : ""}
              {delta} vs peers
            </div>
          ) : (
            <div className="max-w-[14rem] text-center text-[11px] leading-4 text-muted-foreground md:text-left">
              No benchmark yet — complete your profile to start scoring.
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="space-y-3">
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
          <div className="rounded-lg border bg-slate-50/60 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Readiness · overall {readiness.overall}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
              {readiness.bars.map((b) => (
                <span key={b.label} className="text-[11px] text-slate-600">
                  {b.label}
                  <span className="ml-1 font-semibold tabular-nums text-slate-800">{b.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
