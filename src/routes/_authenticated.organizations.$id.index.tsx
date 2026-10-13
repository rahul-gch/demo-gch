import { createFileRoute, notFound } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEntity } from "@/seed/all-entities";
import { HeroPassport } from "@/components/dashboard/HeroPassport";
import { KpiInteractiveGrid } from "@/components/dashboard/KpiInteractiveGrid";
import { EcosystemSummary } from "@/components/dashboard/EcosystemSummary";
import { SupplyChainSnapshot } from "@/components/dashboard/SupplyChainSnapshot";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { QuickActionsDock } from "@/components/dashboard/QuickActionsDock";
import { ActionQueue } from "@/components/dashboard/ActionQueue";
import { KpiRow } from "@/components/dashboard/KpiRow";
import { AiBriefCard } from "@/components/dashboard/AiBriefCard";
import { PassportProgressCard } from "@/components/dashboard/PassportProgressCard";
import { OperationsOverview } from "@/components/dashboard/OperationsOverview";
import { KpiTable } from "@/components/KpiTable";
import { BenchmarkChart } from "@/components/BenchmarkChart";
import { ReportUploader } from "@/components/ReportUploader";
import { ReadinessChecklist } from "@/components/verification/ReadinessChecklist";
import type { Entity } from "@/seed/types";

import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/organizations/$id/")({
  loader: async ({ params, context }) => {
    let entity = getEntity(params.id);
    if (!entity) {
      await refreshRegistry(context.queryClient);
      entity = getEntity(params.id);
    }
    if (!entity) throw notFound();
    return { entity };
  },
  component: OrgDashboardPage,
});

function Section({ children }: { children: React.ReactNode }) {
  return <section className="space-y-4">{children}</section>;
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">{title}</h2>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

function OverviewMissionControl({ e }: { e: Entity }) {
  return (
    <div className="space-y-5">
      <HeroPassport entity={e} />

      {e.orgUuid && <ReadinessChecklist orgId={e.orgUuid} routeId={e.id} />}

      <KpiRow entity={e} />

      <div className="grid items-stretch gap-5 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <AiBriefCard entity={e} />
        </div>
        <div className="lg:col-span-6">
          <ActionQueue entity={e} />
        </div>
        <div className="lg:col-span-3">
          <PassportProgressCard entity={e} />
        </div>
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <OperationsOverview entity={e} />
        </div>
        <div className="lg:col-span-5">
          <ActivityTimeline entity={e} limit={4} />
        </div>
      </div>
    </div>
  );
}


function OrgDashboardPage() {
  const { entity: e } = Route.useLoaderData();

  return (
    <div className="relative w-full space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewMissionControl e={e} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Section>
            <SectionHeader title="Performance" hint="Headline KPIs · target · confidence" />
            <KpiInteractiveGrid entity={e} />
          </Section>
          <KpiTableFallback entity={e} />
          <BenchmarkFallback entity={e} />
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <EcosystemSummary entity={e} />
          <SupplyChainSnapshot entity={e} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <ReportUploader entity={e} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTimeline entity={e} />
        </TabsContent>
      </Tabs>

      <QuickActionsDock entity={e} />
    </div>
  );
}

// Wrappers so a missing import doesn't crash the build if paths differ.
function KpiTableFallback({ entity }: { entity: Entity }) {
  try {
    return <KpiTable entity={entity} />;
  } catch {
    return null;
  }
}
function BenchmarkFallback({ entity }: { entity: Entity }) {
  try {
    return <BenchmarkChart entity={entity} />;
  } catch {
    return null;
  }
}
