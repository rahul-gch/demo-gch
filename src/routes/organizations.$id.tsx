import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { VerificationBadge, RiskBadge } from "@/components/StatusBadge";
import { MockWorldMap } from "@/components/MockWorldMap";
import { getEntity } from "@/seed/entities";
import { ArrowLeft, MapPin } from "lucide-react";

export const Route = createFileRoute("/organizations/$id")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.entity.name ?? "Organization"} — Global Chain Hub` },
      {
        name: "description",
        content: loaderData?.entity.description ?? "Organization profile.",
      },
    ],
  }),
  component: OrgProfilePage,
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
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
                  <MapPin className="mr-1 h-3 w-3" /> {e.city}, {e.country}
                </Badge>
                <VerificationBadge status={e.verificationStatus} />
                <RiskBadge level={e.riskLevel} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Confidence
              </div>
              <div className="text-3xl font-semibold tabular-nums">{e.confidenceScore}%</div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Profile completeness" value={`${e.profileCompleteness}%`} />
          <Stat label="Confidence score" value={`${e.confidenceScore}%`} />
          <Stat label="Evidence count" value={e.evidenceCount} />
          <Stat label="Missing data" value={e.missingDataCount} />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Profile details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">{e.description}</p>
              <dl className="grid grid-cols-2 gap-y-3 md:grid-cols-3">
                <Field label="Country" value={e.country} />
                <Field label="Region" value={e.region} />
                <Field label="City" value={e.city} />
                <Field label="Capacity" value={e.capacity} />
                <Field label="MOQ" value={e.moq} />
                <Field label="Lead time" value={`${e.leadTimeDays} days`} />
                <Field label="Comms channel" value={e.preferredCommunicationChannel} />
              </dl>
              <TagBlock label="Materials" items={e.materials} />
              <TagBlock label="Capabilities" items={e.capabilities} />
              <TagBlock label="Certifications" items={e.certifications} />
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

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <MockWorldMap entities={[e]} height={260} />
              <div className="mt-3 text-xs text-muted-foreground">
                {e.latitude.toFixed(3)}, {e.longitude.toFixed(3)}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Missing data</CardTitle>
              </CardHeader>
              <CardContent>
                {e.missingFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No missing fields.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {e.missingFields.map((f: string) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Recommended next action</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{e.recommendedNextAction}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function TagBlock({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
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
