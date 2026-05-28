import { createFileRoute } from "@tanstack/react-router";
import { EcosystemGraph } from "@/components/EcosystemGraph";
import {
  AlertTriangle,
  FileSearch,
  Sparkles,
  Target,
  TrendingUp,
  Network,
  ShieldAlert,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ecosystem Intelligence Dashboard" },
      {
        name: "description",
        content:
          "A graph-first view of your ecosystem with confidence, evidence, risk, and matchmaking insights.",
      },
    ],
  }),
  component: Dashboard,
});

type InsightProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "warn" | "info" | "risk" | "good";
  side: "tl" | "tr" | "bl" | "br";
};

const toneStyles: Record<InsightProps["tone"], string> = {
  warn: "border-amber-400/40 text-amber-100",
  info: "border-sky-400/40 text-sky-100",
  risk: "border-rose-400/40 text-rose-100",
  good: "border-emerald-400/40 text-emerald-100",
};

const sideAnchor: Record<InsightProps["side"], { dot: string; line: string }> = {
  tl: { dot: "right-[-6px] bottom-[-6px]", line: "right-[-40px] bottom-[-40px] w-[60px] rotate-[135deg]" },
  tr: { dot: "left-[-6px] bottom-[-6px]", line: "left-[-40px] bottom-[-40px] w-[60px] rotate-[45deg]" },
  bl: { dot: "right-[-6px] top-[-6px]", line: "right-[-40px] top-[-40px] w-[60px] rotate-[45deg]" },
  br: { dot: "left-[-6px] top-[-6px]", line: "left-[-40px] top-[-40px] w-[60px] rotate-[135deg]" },
};

function InsightPanel({ icon, label, value, detail, tone, side }: InsightProps) {
  const anchor = sideAnchor[side];
  return (
    <div
      className={`relative rounded-xl border bg-slate-900/70 backdrop-blur-md px-4 py-3 shadow-xl ${toneStyles[tone]}`}
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider opacity-80">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1.5 text-xl font-semibold text-white leading-tight">{value}</div>
      <div className="mt-1 text-xs text-slate-300/90 leading-snug">{detail}</div>

      {/* connector dot + line pointing toward graph */}
      <span className={`absolute h-2.5 w-2.5 rounded-full bg-white/80 shadow-[0_0_12px_2px_rgba(255,255,255,0.6)] ${anchor.dot}`} />
      <span className={`absolute h-px bg-gradient-to-r from-white/60 to-transparent origin-left ${anchor.line}`} />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  delta,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
}) {
  const trendColor =
    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-muted-foreground";
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        <span className={`text-xs font-medium ${trendColor}`}>{delta}</span>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">Ecosystem Intelligence</h1>
              <p className="text-xs text-muted-foreground">Live graph · updated 2 min ago</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Graph engine online
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-10">
        {/* GRAPH-FIRST HERO */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Your ecosystem graph
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Every insight on this page is derived from the relationships below.
              </p>
            </div>
            <div className="hidden gap-4 text-xs text-muted-foreground md:flex">
              <Legend swatch="bg-amber-400" label="Core" />
              <Legend swatch="bg-sky-400" label="Partner" />
              <Legend swatch="bg-emerald-400" label="Prospect" />
              <Legend swatch="bg-rose-400" label="Risk" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-2xl">
            {/* graph canvas — big */}
            <div className="aspect-[16/10] w-full">
              <EcosystemGraph />
            </div>

            {/* insight panels around the graph */}
            <div className="pointer-events-none absolute inset-0 p-4 sm:p-6">
              <div className="grid h-full grid-cols-12 grid-rows-6 gap-3">
                <div className="col-span-12 sm:col-span-4 lg:col-span-3 row-span-2 pointer-events-auto">
                  <InsightPanel
                    side="tl"
                    tone="warn"
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                    label="Confidence gap"
                    value="12 nodes"
                    detail="Below 60% confidence — verification recommended."
                  />
                </div>
                <div className="hidden lg:block col-span-6 row-span-2" />
                <div className="col-span-12 sm:col-span-4 lg:col-span-3 col-start-1 sm:col-start-9 lg:col-start-10 row-start-1 row-span-2 pointer-events-auto">
                  <InsightPanel
                    side="tr"
                    tone="info"
                    icon={<FileSearch className="h-3.5 w-3.5" />}
                    label="Missing evidence"
                    value="34 claims"
                    detail="Relationships asserted without supporting sources."
                  />
                </div>

                <div className="hidden lg:block col-span-12 row-span-2" />

                <div className="col-span-12 sm:col-span-4 lg:col-span-3 row-start-5 row-span-2 pointer-events-auto self-end">
                  <InsightPanel
                    side="bl"
                    tone="risk"
                    icon={<ShieldAlert className="h-3.5 w-3.5" />}
                    label="Highest risk node"
                    value="Umbrella Co."
                    detail="Sanctions exposure + 3 weakening ties in 30 days."
                  />
                </div>
                <div className="hidden lg:block col-span-6 row-span-2" />
                <div className="col-span-12 sm:col-span-4 lg:col-span-3 col-start-1 sm:col-start-9 lg:col-start-10 row-start-5 row-span-2 pointer-events-auto self-end">
                  <InsightPanel
                    side="br"
                    tone="good"
                    icon={<Target className="h-3.5 w-3.5" />}
                    label="Best matchmaking opportunity"
                    value="Stark ↔ Wayne"
                    detail="High structural fit, no current edge. 86% predicted."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs as graph outputs */}
        <section>
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            Intelligence outputs generated from the ecosystem graph
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              icon={<Network className="h-3.5 w-3.5" />}
              label="Mapped entities"
              value="248"
              delta="+12"
              trend="up"
            />
            <KpiCard
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label="Avg. confidence"
              value="74%"
              delta="+3%"
              trend="up"
            />
            <KpiCard
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              label="At-risk relationships"
              value="9"
              delta="-2"
              trend="down"
            />
            <KpiCard
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Predicted matches"
              value="17"
              delta="+5"
              trend="up"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${swatch}`} />
      {label}
    </span>
  );
}
