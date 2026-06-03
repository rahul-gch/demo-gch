import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ENTITIES, ENTITY_TYPE_BREAKDOWN, summaryMetrics } from "@/seed/entities";
import { COMPANY_BENCHMARK } from "@/seed/kpi";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, TrendingUp } from "lucide-react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Platform Dashboard — Global Chain Hub" },
      {
        name: "description",
        content: "Organization registry and ecosystem intelligence hub for apparel and textile supply chains.",
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

function DashboardPage() {
  const m = summaryMetrics;
  const preview = ENTITIES.slice(0, 5);
  const breakdown = ENTITY_TYPE_BREAKDOWN;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Global Chain Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organization registry and ecosystem intelligence hub.
          </p>
        </header>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total entities" value={m.totalRegistry} hint="In registry" />
          <Stat label="Seeded visible" value={m.seededVisible} hint="In this prototype" />
          <Stat label="Verified" value={m.verified} />
          <Stat label="Incomplete profiles" value={m.incomplete} />
          <Stat label="Avg confidence" value={`${m.avgConfidence}%`} />
          <Stat label="Matchmaking-ready" value={m.matchmakingReady} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
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

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Data readiness summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-y-4 text-sm">
                <dt className="text-muted-foreground">Avg profile completeness</dt>
                <dd className="text-right font-medium tabular-nums">{m.avgCompleteness}%</dd>
                <dt className="text-muted-foreground">Avg confidence score</dt>
                <dd className="text-right font-medium tabular-nums">{m.avgConfidence}%</dd>
                <dt className="text-muted-foreground">Missing data points</dt>
                <dd className="text-right font-medium tabular-nums">{m.missingTotal}</dd>
                <dt className="text-muted-foreground">High-risk entities</dt>
                <dd className="text-right font-medium tabular-nums">{m.highRisk}</dd>
              </dl>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Map preview</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to="/map">Open Map View</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <EcosystemGoogleMap entities={ENTITIES} height={280} compact showLegend />
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
