import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { amIPlatformAdmin } from "@/lib/admin.functions";
import { myOrgMemberships } from "@/lib/orgs.functions";

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
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { PriorityList } from "@/components/ops/PriorityList";
import { QuickActions } from "@/components/ops/QuickActions";
import { PlatformAlerts } from "@/components/ops/PlatformAlerts";
import { PendingApprovals } from "@/components/ops/PendingApprovals";
import { AIOperations } from "@/components/ops/AIOperations";
import { LiveActivity } from "@/components/ops/LiveActivity";
import { GrowthKpis } from "@/components/ops/GrowthKpis";
import { CountryOverview } from "@/components/ops/CountryOverview";
import { SystemStatus } from "@/components/ops/SystemStatus";
import { UserOverview } from "@/components/ops/UserOverview";
import { RecentRequests } from "@/components/ops/RecentRequests";
import { ScheduledJobs } from "@/components/ops/ScheduledJobs";
import { OpsFooter } from "@/components/ops/OpsFooter";
import { platformCounts, todaysPriorities, platformAlerts } from "@/lib/ops-derive";

export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: async () => {
    // Only Global Chain Hub platform admins see the operations console.
    const [admin, memberships] = await Promise.all([
      amIPlatformAdmin().catch(() => ({ isAdmin: false })),
      myOrgMemberships().catch(() => [] as { org_id: string }[]),
    ]);
    if (admin?.isAdmin) return;
    const first = memberships[0];
    if (first) {
      const entity = getEntity(first.org_id);
      throw redirect({
        to: "/organizations/$id",
        params: { id: entity?.id ?? first.org_id },
        replace: true,
      });
    }
    throw redirect({ to: "/signup", search: { tab: "create" as const }, replace: true });
  },

  head: () => ({
    meta: [
      { title: "Operations Console — Global Chain Hub" },
      {
        name: "description",
        content:
          "Platform operations console for the Global Chain Hub team: alerts, approvals, activity, AI operations, and system health.",
      },
    ],
  }),
  component: DashboardPage,
});

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

function OpsHero() {
  const p = platformNhriAggregate();
  const counts = platformCounts(p.avg);
  const priorities = todaysPriorities();
  const stats = [
    { label: "Organizations", value: counts.organizations },
    { label: "Countries", value: counts.countries },
    { label: "Active projects", value: counts.activeProjects },
    { label: "Verification requests", value: counts.verificationRequests },
    { label: "Platform health", value: `${counts.healthPct}%` },
  ];
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-slate-100 shadow-lg">
      <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            Platform Operations Center
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Global Chain Hub · Admin
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Monitor platform health, review pending approvals, and act on AI-surfaced signals across the network.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label} className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="truncate text-[10px] uppercase tracking-wider text-slate-300">
                  {s.label}
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        <PriorityList items={priorities} />
      </div>
    </section>
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
  const alerts = platformAlerts();

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
        <OpsHero />
        <QuickActions />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <PlatformAlerts items={alerts} />
          <PendingApprovals />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <AIOperations />
          <LiveActivity />
        </section>

        <SectionDivider label="Growth" />
        <GrowthKpis />

        <section className="grid gap-4 lg:grid-cols-3">
          <CountryOverview />
          <SystemStatus />
          <UserOverview />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <RecentRequests />
          <ScheduledJobs />
        </section>

        <SectionDivider label="Passports" />
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight">Featured Network Passports</h2>
              <p className="text-xs text-muted-foreground">
                Live profile previews sourced from real published sustainability reports.
              </p>
            </div>
            {featured[0] && (
              <Button asChild variant="ghost" size="sm" className="shrink-0">
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

        <SectionDivider label="Performance" />
        <BenchmarkIntelligence />

        <SectionDivider label="Network" />
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <TopMovers />
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="min-w-0 truncate text-base font-semibold">Global network map</CardTitle>
              <Button asChild variant="outline" size="sm" className="shrink-0">
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
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="min-w-0 truncate text-base font-semibold">Organization registry preview</CardTitle>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link to="/organizations">
                  View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
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

        <OpsFooter />
        {/* Prevent unused import warnings for summaryMetrics used indirectly via ops-derive */}
        <span className="hidden">{summaryMetrics.total}</span>
      </div>
    </AppShell>
  );
}
