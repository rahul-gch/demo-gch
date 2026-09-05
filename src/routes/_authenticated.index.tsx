import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  amIPlatformAdmin,
  getAdminDashboardStats,
  listRecentSignups,
  type AdminDashboardStats,
} from "@/lib/admin.functions";
import { myOrgMemberships } from "@/lib/orgs.functions";
import { listPlatformActivity } from "@/lib/activity.functions";

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
import { ALL_ENTITIES as ENTITIES, ENTITY_TYPE_BREAKDOWN, getEntity } from "@/seed/all-entities";
import { platformNhriAggregate, bandBadgeClasses, computeNhri } from "@/lib/nhri";
import { ArrowUpRight } from "lucide-react";
import { PriorityList } from "@/components/ops/PriorityList";
import { QuickActions } from "@/components/ops/QuickActions";
import { LiveActivity } from "@/components/ops/LiveActivity";
import { GrowthKpis } from "@/components/ops/GrowthKpis";
import { CountryOverview } from "@/components/ops/CountryOverview";
import { UserOverview } from "@/components/ops/UserOverview";
import { RecentSignups } from "@/components/ops/RecentSignups";
import type { PriorityItem } from "@/lib/ops-derive";

import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: async ({ context }) => {
    // Only Global Chain Hub platform admins see the operations console.
    await refreshRegistry((context as any).queryClient);
    const [admin, memberships] = await Promise.all([
      amIPlatformAdmin().catch(() => ({ isAdmin: false })),
      myOrgMemberships().catch(() => [] as { org_id: string }[]),
    ]);
    if (admin?.isAdmin) return;
    const first = memberships[0];
    if (first) {
      let entity = getEntity(first.org_id);
      if (!entity) {
        await refreshRegistry((context as any).queryClient);
        entity = getEntity(first.org_id);
      }
      const targetId = entity?.slug || entity?.id || first.org_id;
      throw redirect({
        to: "/organizations/$id",
        params: { id: targetId },
        replace: true,
      });
    }
    throw redirect({ to: "/welcome", replace: true });
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


function OpsHero({ stats, loading }: { stats?: AdminDashboardStats; loading: boolean }) {
  const p = platformNhriAggregate();
  const openRequests = stats
    ? stats.pendingConnections +
      stats.pendingMeetings +
      stats.ordersAwaitingQuote +
      stats.ordersAwaitingConfirmation
    : null;
  const tiles = [
    { label: "Organizations", value: stats?.orgs ?? ENTITIES.length },
    { label: "Countries", value: stats?.countries ?? "—" },
    { label: "Members", value: stats?.members ?? "—" },
    { label: "Active projects", value: stats?.activeProjects ?? "—" },
    { label: "Open requests", value: openRequests ?? "—" },
    { label: "Errors (24h)", value: stats?.errors24h ?? "—" },
  ];
  const queue: PriorityItem[] = stats
    ? [
        {
          id: "connections",
          tone: "info",
          label: "pending connection requests",
          count: stats.pendingConnections,
          to: "/organizations",
        },
        {
          id: "meetings",
          tone: "info",
          label: "pending meeting requests",
          count: stats.pendingMeetings,
          to: "/meetings",
        },
        {
          id: "quotes",
          tone: "warning",
          label: "sample orders awaiting a quote",
          count: stats.ordersAwaitingQuote,
          to: "/organizations",
        },
        {
          id: "confirm",
          tone: "info",
          label: "sample orders awaiting buyer confirmation",
          count: stats.ordersAwaitingConfirmation,
          to: "/organizations",
        },
        {
          id: "unclaimed",
          tone: "warning",
          label: "organizations without any member",
          count: stats.unclaimedOrgs,
          to: "/admin/organizations",
          search: { tab: "invites" },
        },
        {
          id: "onboarding",
          tone: "warning",
          label: "organizations that never finished onboarding",
          count: stats.incompleteOnboarding,
          to: "/admin/organizations",
        },
        {
          id: "invites",
          tone: "info",
          label: "open onboarding links",
          count: stats.openInvites,
          to: "/admin/organizations",
          search: { tab: "invites" },
        },
        {
          id: "errors",
          tone: "critical",
          label: "unresolved application errors",
          count: stats.unresolvedErrors,
          to: "/admin/logs",
        },
      ]
    : [];
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
            Live view of the network: what needs attention today, who joined, and how the
            platform is growing. Average readiness across profiles: {p.avg}%.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.map((s) => (
              <div
                key={s.label}
                className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <div className="truncate text-[10px] uppercase tracking-wider text-slate-300">
                  {s.label}
                </div>
                <div
                  className={`mt-1 text-xl font-semibold tabular-nums ${loading ? "animate-pulse" : ""}`}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <PriorityList items={queue} loading={loading} />
      </div>
    </section>
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

  const fetchStats = useServerFn(getAdminDashboardStats);
  const fetchActivity = useServerFn(listPlatformActivity);
  const fetchSignups = useServerFn(listRecentSignups);

  const statsQ = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: () => fetchStats(),
    staleTime: 60_000,
  });
  const activityQ = useQuery({
    queryKey: ["admin", "platform-activity"],
    queryFn: () => fetchActivity(),
    staleTime: 60_000,
  });
  const signupsQ = useQuery({
    queryKey: ["admin", "recent-signups", 8],
    queryFn: () => fetchSignups({ data: { limit: 8 } }),
    staleTime: 60_000,
  });

  return (
    <AppShell>
      <div className="w-full space-y-8">
        <OpsHero stats={statsQ.data} loading={statsQ.isLoading} />
        {statsQ.isError && (
          <p className="text-sm text-red-600">
            Could not load platform statistics. {(statsQ.error as Error)?.message}
          </p>
        )}
        <QuickActions />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <LiveActivity events={activityQ.data ?? []} loading={activityQ.isLoading} />
          <RecentSignups rows={(signupsQ.data ?? []) as never} loading={signupsQ.isLoading} />
        </section>

        <SectionDivider label="Growth · last 30 days" />
        <GrowthKpis items={statsQ.data?.growth ?? []} loading={statsQ.isLoading} />

        <section className="grid gap-4 lg:grid-cols-3">
          <CountryOverview />
          <UserOverview
            rows={statsQ.data?.membersByRole ?? []}
            total={statsQ.data?.members ?? 0}
            loading={statsQ.isLoading}
          />
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="min-w-0 truncate text-base font-semibold">
                Global network map
              </CardTitle>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link to="/map">Open map</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <EcosystemGoogleMap entities={ENTITIES} height={260} compact showLegend />
            </CardContent>
          </Card>
        </section>

        <SectionDivider label="Network" />
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <TopMovers />
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="min-w-0 truncate text-base font-semibold">
                Organization registry preview
              </CardTitle>
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
                      <TableCell className="text-right tabular-nums">
                        {e.confidenceScore}%
                      </TableCell>
                      <TableCell>
                        <VerificationBadge status={e.verificationStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
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
