import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VerificationBadge, RiskBadge } from "@/components/StatusBadge";
import { EcosystemGoogleMap } from "@/components/EcosystemGoogleMap";
import { MiniDashboard } from "@/components/MiniDashboard";
import { MessageChannel } from "@/components/MessageChannel";
import { ActivityFeed } from "@/components/ActivityFeed";
import { DocumentsList } from "@/components/DocumentsList";
import { EcosystemConnections } from "@/components/EcosystemConnections";
import { MatchmakingPanel } from "@/components/MatchmakingPanel";
import { KpiSnapshot } from "@/components/KpiSnapshot";
import { KpiTable } from "@/components/KpiTable";
import { BenchmarkChart } from "@/components/BenchmarkChart";
import { ReportUploader } from "@/components/ReportUploader";
import {
  isShowcase,
  getEcosystemConnections,
  getMatchSuggestions,
} from "@/seed/showcase";
import { getEntity } from "@/seed/all-entities";
import { NetworkPassport } from "@/components/NetworkPassport";
import type { CertificationDetail, Contact, Entity } from "@/seed/types";
import { ArrowLeft, MapPin, Mail, Phone, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/organizations/$id")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.entity.name ?? "Organization"} — Global Chain Hub` },
      { name: "description", content: loaderData?.entity.description ?? "Organization profile." },
    ],
  }),
  component: OrgProfilePage,
});

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value || "—"}</dd>
    </div>
  );
}

function TagBlock({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((i) => (
          <Badge key={i} variant="secondary" className="font-normal">
            {i}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function Readiness({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function OrgProfilePage() {
  const { entity: e } = Route.useLoaderData();
  const showcase = isShowcase(e.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/organizations">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to registry
          </Link>
        </Button>

        <header className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {e.gchNumber}
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">{e.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{e.organizationType}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{e.entityType}</Badge>
                <Badge variant="outline">{e.actorType}</Badge>
                <Badge variant="outline">
                  <MapPin className="mr-1 h-3 w-3" /> {[e.city, e.country].filter(Boolean).join(", ")}
                </Badge>
                <VerificationBadge status={e.verificationStatus} />
                <RiskBadge level={e.riskLevel} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Profile completeness
              </div>
              <div className="text-3xl font-semibold tabular-nums">{e.profileCompleteness}%</div>
              {showcase && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                  <Sparkles className="h-3 w-3" /> Showcase profile
                </div>
              )}
            </div>
          </div>
        </header>

        {!showcase && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
            Lite profile — dashboard, ecosystem, matchmaking, messaging and documents are only enabled
            for the first 20 showcase entities in this prototype.
          </div>
        )}

        {showcase && <NetworkPassport entity={e} />}

        {showcase ? <ShowcaseTabs e={e} /> : <LiteProfile e={e} />}
      </div>
    </AppShell>
  );
}

function ShowcaseTabs({ e }: { e: Entity }) {
  const connections = getEcosystemConnections(e);
  const matches = getMatchSuggestions(e);
  const connectionEntities = [e, ...connections.map((c) => c.entity)];

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="flex w-full flex-wrap justify-start">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="kpis">KPIs</TabsTrigger>
        <TabsTrigger value="ecosystem">Ecosystem</TabsTrigger>
        <TabsTrigger value="matchmaking">Matchmaking</TabsTrigger>
        <TabsTrigger value="messages">Messages</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="missing">Missing data</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <KpiSnapshot entity={e} />
        <OverviewSection e={e} />
      </TabsContent>

      <TabsContent value="dashboard" className="space-y-6">
        <MiniDashboard entity={e} />
        <BenchmarkChart entity={e} />
      </TabsContent>

      <TabsContent value="kpis">
        <KpiTable entity={e} />
      </TabsContent>

      <TabsContent value="ecosystem" className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Connected organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <EcosystemGoogleMap
              entities={connectionEntities}
              selectedId={e.id}
              height={360}
              center={{ lat: e.latitude, lng: e.longitude }}
              zoom={4}
              showLegend
            />
          </CardContent>
        </Card>
        <EcosystemConnections connections={connections} />
      </TabsContent>

      <TabsContent value="matchmaking" className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top suggested matches</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchmakingPanel matches={matches} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="messages">
        <MessageChannel entity={e} />
      </TabsContent>

      <TabsContent value="documents" className="space-y-6">
        <ReportUploader entity={e} />
        <DocumentsList entity={e} />
      </TabsContent>


      <TabsContent value="activity">
        <ActivityFeed entity={e} />
      </TabsContent>

      <TabsContent value="missing">
        <MissingDataSection e={e} />
      </TabsContent>
    </Tabs>
  );
}

function OverviewSection({ e }: { e: Entity }) {
  return (
    <>
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Organization details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            {e.description && <p className="text-muted-foreground">{e.description}</p>}
            <dl className="grid grid-cols-2 gap-y-3 md:grid-cols-3">
              <Field label="GCH Number" value={e.gchNumber} />
              <Field label="Entity Type" value={e.rawEntityType || e.entityType} />
              <Field label="Tier" value={e.actorType} />
              <Field label="Country" value={e.country} />
              <Field label="State / Region" value={e.region} />
              <Field label="City" value={e.city} />
              <Field label="Zip Code" value={e.zipCode} />
              <Field label="Address" value={e.address} />
              <Field label="Comms channel" value={e.preferredCommunicationChannel} />
              <Field label="Capacity" value={e.capacity} />
              <Field label="MOQ" value={e.moq} />
              <Field label="Lead time" value={e.leadTimeDays ? `${e.leadTimeDays} days` : ""} />
            </dl>
            <TagBlock label="Materials" items={e.materials} />
            <TagBlock label="Capabilities" items={e.capabilities} />
            <TagBlock label="Certifications" items={e.certifications} />
            {e.governance && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Governance</div>
                <p className="mt-1">{e.governance}</p>
              </div>
            )}
            {e.traceabilityNotes && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Traceability notes</div>
                <p className="mt-1">{e.traceabilityNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Readiness label="KPI readiness" value={e.kpiReadiness} />
            <Readiness label="Traceability readiness" value={e.traceabilityReadiness} />
            <Readiness label="Matchmaking readiness" value={e.matchmakingReadiness} />
          </CardContent>
        </Card>
      </section>

      {e.certificationDetails.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Certifications & verification</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Last Verified</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {e.certificationDetails.map((c: CertificationDetail, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{c.category}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.lastVerified || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.expiryDate || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          c.status === "Verified"
                            ? "border-slate-300 bg-slate-900 text-white"
                            : c.status === "Expired"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {e.contacts.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {e.contacts.map((c: Contact, i: number) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.role}</div>
                  <div className="mt-1 font-medium">{c.name || "—"}</div>
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="mt-2 flex items-center gap-1.5 text-sm text-slate-700 hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" /> {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {c.phone}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Location</CardTitle>
        </CardHeader>
        <CardContent>
          <EcosystemGoogleMap
            entities={[e]}
            height={300}
            showLegend={false}
            center={{ lat: e.latitude, lng: e.longitude }}
            zoom={6}
          />
          <div className="mt-3 text-xs text-muted-foreground">
            {e.address && `${e.address} · `}
            {e.latitude.toFixed(3)}, {e.longitude.toFixed(3)}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

const CORE_FIELDS: { key: keyof Entity; label: string }[] = [
  { key: "address", label: "Street address" },
  { key: "city", label: "City" },
  { key: "zipCode", label: "Zip code" },
  { key: "region", label: "State / Region" },
  { key: "materials", label: "Materials list" },
  { key: "capabilities", label: "Capabilities" },
  { key: "certifications", label: "Certifications" },
  { key: "capacity", label: "Production capacity" },
  { key: "moq", label: "Minimum order quantity" },
  { key: "governance", label: "Governance statement" },
  { key: "traceabilityNotes", label: "Traceability notes" },
  { key: "contacts", label: "Primary contacts" },
];

function MissingDataSection({ e }: { e: Entity }) {
  const isMissing = (k: keyof Entity) => {
    const v = e[k] as unknown;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "string") return v.trim() === "";
    return v == null;
  };
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Data completeness checklist</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 md:grid-cols-2">
          {CORE_FIELDS.map((f) => {
            const missing = isMissing(f.key);
            return (
              <li
                key={f.key as string}
                className={`flex items-center gap-2 rounded-md border p-2.5 text-sm ${
                  missing ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                {missing ? (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
                <span className={missing ? "text-amber-900" : "text-slate-700"}>{f.label}</span>
                {missing && (
                  <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs">
                    Request
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Recommended next action: {e.recommendedNextAction}
        </p>
      </CardContent>
    </Card>
  );
}

function LiteProfile({ e }: { e: Entity }) {
  return <OverviewSection e={e} />;
}
