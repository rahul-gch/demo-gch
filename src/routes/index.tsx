import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VerificationBadge } from "@/components/StatusBadge";
import { EcosystemGoogleMap } from "@/components/EcosystemGoogleMap";
import {
  ALL_ENTITIES as ENTITIES,
  ENTITY_TYPE_BREAKDOWN,
  summaryMetrics,
  getEntity,
} from "@/seed/all-entities";
import { PassportCards } from "@/components/dashboard/PassportCards";
import { COMPANY_BENCHMARK } from "@/seed/kpi";
import { platformNhriAggregate, bandBadgeClasses, computeNhri } from "@/lib/nhri";
import { greetingForNow } from "@/lib/dashboard-derive";
import { ArrowUpRight, TrendingUp, Sparkles, Radar, ShieldCheck, Globe2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mission Control — Global Chain Hub" },
      {
        name: "description",
        content:
          "Live operating system for apparel and textile supply chains: Network Health & Readiness Index, ecosystem intelligence, and AI-driven actions.",
      },
    ],
  }),
  component: DashboardPage,
});

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function GreetingHero() {
  const g = greetingForNow();
  const p = platformNhriAggregate();
  const distribution = [
    { label: "Excellent", value: p.buckets.Excellent, tone: "bg-emerald-500" },
    { label: "Strong", value: p.buckets.Strong, tone: "bg-sky-500" },
    { label: "Developing", value: p.buckets.Developing, tone: "bg-amber-500" },
    { label: "At Risk", value: p.buckets["At Risk"], tone: "bg-red-500" },
  ];
  const total = distribution.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-slate-100 shadow-lg">
      <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            Mission Control
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {g.greet}, Rahul.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Platform-wide Network Health & Readiness Index sits at <span className="font-semibold text-white">{p.avg}</span>.
            {" "}{summaryMetrics.totalRegistry} organizations tracked across {summaryMetrics.countries} countries.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-300">Verified</div>
              <div className="mt-1 text-xl font-semibold">{summaryMetrics.verified}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-300">Matchmaking-ready</div>
              <div className="mt-1 text-xl font-semibold">{summaryMetrics.matchmakingReady}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-300">Avg confidence</div>
              <div className="mt-1 text-xl font-semibold">{summaryMetrics.avgConfidence}%</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-300">High risk</div>
              <div className="mt-1 text-xl font-semibold">{summaryMetrics.highRisk}</div>
            </div>
          </div>
        </div>
        <aside className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">
            Health distribution
          </div>
          <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-white/10">
            {distribution.map((d) => (
              <div key={d.label} className={d.tone} style={{ width: `${(d.value / total) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {distribution.map((d) => (
              <li key={d.label} className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${d.tone}`} />
                  <span className="text-slate-200">{d.label}</span>
                </span>
                <span className="tabular-nums text-slate-400">{d.value}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

function AiSummaryStrip() {
  const p = platformNhriAggregate();
  const items = [
    { icon: Sparkles, text: `${p.buckets.Excellent} organizations reached Excellent this week.` },
    { icon: ShieldCheck, text: `${summaryMetrics.verified} verified · ${summaryMetrics.missingTotal} open data points.` },
    { icon: Radar, text: `${summaryMetrics.matchmakingReady} organizations matchmaking-ready.` },
    { icon: Globe2, text: `${summaryMetrics.countries} countries active in the registry.` },
  ];
  return (
    <Card className="border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white shadow-sm">
      <CardContent className="p-5">
        <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-700">
          <Sparkles className="h-3.5 w-3.5" /> AI daily summary
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <it.icon className="mt-0.5 h-3.5 w-3.5 text-sky-600" />
              {it.text}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function BenchmarkIntelligence() {
  const picks = [
    COMPANY_BENCHMARK.find((r) => r.company === "H&M Group" && r.kpiId === "KPI004"),
    COMPANY_BENCHMARK.find((r) => r.company === "H&M Group" && r.kpiId === "KPI010"),
    COMPANY_BENCHMARK.find((r) => r.company === "H&M Group" && r.kpiId === "KPI002"),
    COMPANY_BENCHMARK.find((r) => r.company === "Inditex" && r.kpiId === "KPI002"),
  ].filter(Boolean) as typeof COMPANY_BENCHMARK;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Benchmark intelligence</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Sector reference from Inditex, H&amp;M, Nike, Adidas, Puma, Patagonia, Primark, M&amp;S, Zalando, Levi&apos;s.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <TrendingUp className="h-3 w-3" /> KPI dataset v0.1
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {picks.map((r, i) => (
            <div key={i} className="rounded-lg border bg-slate-50/50 p-4">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {r.company} · {r.year}
              </div>
              <div className="mt-1 text-sm font-medium">{r.kpiName}</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">
                {r.normalizedValue}
                <span className="ml-1 text-xs font-normal text-muted-foreground">{r.unit}</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                Confidence {r.confidence}% · {r.confidenceLabel}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TopMovers() {
  const p = platformNhriAggregate();
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Top performers · NHRI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {p.topMovers.map((m, i) => {
          const nhri = computeNhri(m.entity);
          return (
            <Link
              key={m.entity.id}
              to="/organizations/$id"
              params={{ id: m.entity.id }}
              className="group flex items-center justify-between rounded-md border bg-slate-50/50 p-3 transition hover:bg-white"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-900 text-xs font-semibold text-white">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{m.entity.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.entity.entityType} · {m.entity.country}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tabular-nums">{m.score}</span>
                <Badge variant="outline" className={bandBadgeClasses(nhri.bandTone)}>
                  {nhri.band}
                </Badge>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const preview = ENTITIES.slice(0, 5);
  const breakdown = ENTITY_TYPE_BREAKDOWN;

  const featured = [
    { id: "gch-nike" },
    { id: "gch-hm" },
    { id: "gch-mands" },
    { id: "gch-primark" },
    { id: "gch-170" },
    { id: "gch-123" },
  ]
    .map((f) => getEntity(f.id))
    .filter(Boolean);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        <GreetingHero />
        <AiSummaryStrip />

        <SectionDivider label="Passports" />
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Featured Network Passports</h2>
              <p className="text-xs text-muted-foreground">
                Live profile previews sourced from real published sustainability reports.
              </p>
            </div>
            {featured[0] && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/organizations/$id" params={{ id: featured[0]!.id }}>
                  Open profile <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
          {featured[0] && <PassportCards entity={featured[0]!} />}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(1).map((e) => (
              <Link
                key={e!.id}
                to="/organizations/$id"
                params={{ id: e!.id }}
                className="group rounded-lg border bg-slate-50/50 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Featured passport
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="text-sm font-semibold">{e!.name}</div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {e!.entityType} · {e!.country}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <SectionDivider label="Registry" />
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total entities" value={summaryMetrics.totalRegistry} hint="In registry" />
          <Stat label="Seeded visible" value={summaryMetrics.seededVisible} hint="In this prototype" />
          <Stat label="Verified" value={summaryMetrics.verified} />
          <Stat label="Incomplete profiles" value={summaryMetrics.incomplete} />
          <Stat label="Avg confidence" value={`${summaryMetrics.avgConfidence}%`} />
          <Stat label="Matchmaking-ready" value={summaryMetrics.matchmakingReady} />
        </section>

        <SectionDivider label="Performance" />
        <BenchmarkIntelligence />

        <SectionDivider label="Network" />
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <TopMovers />
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Global network map</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to="/map">Open map</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <EcosystemGoogleMap entities={ENTITIES} height={300} compact showLegend />
            </CardContent>
          </Card>
        </section>

        <SectionDivider label="Registry preview" />
        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Organization registry preview</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/organizations">
                  View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Link
                          to="/organizations/$id"
                          params={{ id: e.id }}
                          className="font-medium hover:underline"
                        >
                          {e.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{e.entityType}</TableCell>
                      <TableCell className="text-muted-foreground">{e.country}</TableCell>
                      <TableCell className="text-right tabular-nums">{e.confidenceScore}%</TableCell>
                      <TableCell>
                        <VerificationBadge status={e.verificationStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Entity type breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {breakdown.map((b: { type: string; count: number }) => (
                  <li key={b.type} className="flex items-center justify-between py-2 text-sm">
                    <span>{b.type}</span>
                    <span className="tabular-nums text-muted-foreground">{b.count}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
