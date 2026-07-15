import { createFileRoute, notFound } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEntity } from "@/seed/all-entities";
import { HeroPassport } from "@/components/dashboard/HeroPassport";
import { OrgBanner } from "@/components/dashboard/OrgBanner";
import { AICommandCenter } from "@/components/dashboard/AICommandCenter";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { CriticalActionsStrip } from "@/components/dashboard/CriticalActionsStrip";
import { KpiInteractiveGrid } from "@/components/dashboard/KpiInteractiveGrid";
import { EcosystemSummary } from "@/components/dashboard/EcosystemSummary";
import { MissingDataGamified } from "@/components/dashboard/MissingDataGamified";
import { SupplyChainSnapshot } from "@/components/dashboard/SupplyChainSnapshot";
import { ReadinessBreakdown } from "@/components/dashboard/ReadinessBreakdown";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { OpportunitiesPanel } from "@/components/dashboard/OpportunitiesPanel";
import { QuickActionsDock } from "@/components/dashboard/QuickActionsDock";
import { PassportCards } from "@/components/dashboard/PassportCards";
import { KpiTable } from "@/components/KpiTable";
import { BenchmarkChart } from "@/components/BenchmarkChart";
import { DocumentsList } from "@/components/DocumentsList";
import { ReportUploader } from "@/components/ReportUploader";
import type { Entity } from "@/seed/types";

export const Route = createFileRoute("/organizations/$id/")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  component: OrgDashboardPage,
});

function Section({ children }: { children: React.ReactNode }) {
  return <section className="space-y-4">{children}</section>;
}

function Divider() {
  return <div className="my-2 h-px w-full bg-slate-200/70" />;
}

function OverviewMissionControl({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <OrgBanner entity={e} />
      <HeroPassport entity={e} />
      <AICommandCenter entity={e} />
      <HealthScoreCard entity={e} />
      <CriticalActionsStrip entity={e} />
      <Divider />
      <Section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Passport</h2>
          <span className="text-xs text-muted-foreground">Verified network identity</span>
        </div>
        <PassportCards entity={e} />
      </Section>
      <Divider />
      <Section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Performance</h2>
          <span className="text-xs text-muted-foreground">Headline KPIs · target · confidence</span>
        </div>
        <KpiInteractiveGrid entity={e} />
      </Section>
      <Divider />
      <div className="grid gap-6 lg:grid-cols-2">
        <EcosystemSummary entity={e} />
        <SupplyChainSnapshot entity={e} />
      </div>
      <Divider />
      <div className="grid gap-6 lg:grid-cols-2">
        <MissingDataGamified entity={e} />
        <ReadinessBreakdown entity={e} />
      </div>
      <Divider />
      <OpportunitiesPanel entity={e} />
      <Divider />
      <ActivityTimeline entity={e} />
    </div>
  );
}

function OrgDashboardPage() {
  const { entity: e } = Route.useLoaderData();

  return (
    <div className="relative mx-auto max-w-7xl space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewMissionControl e={e} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <AICommandCenter entity={e} />
          <OpportunitiesPanel entity={e} />
          <CriticalActionsStrip entity={e} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <HealthScoreCard entity={e} />
          <KpiInteractiveGrid entity={e} />
          <KpiTableFallback entity={e} />
          <BenchmarkFallback entity={e} />
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <EcosystemSummary entity={e} />
          <SupplyChainSnapshot entity={e} />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <HealthScoreCard entity={e} />
          <ReadinessBreakdown entity={e} />
          <MissingDataGamified entity={e} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <ReportUploader entity={e} />
          <DocumentsList entity={e} />
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
