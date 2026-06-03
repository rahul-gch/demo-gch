import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VerificationBadge, RiskBadge } from "@/components/StatusBadge";
import { GoogleMap } from "@/components/GoogleMap";
import { getEntity } from "@/seed/entities";
import { ArrowLeft, MapPin, Mail, Phone, Info } from "lucide-react";

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
                  <MapPin className="mr-1 h-3 w-3" /> {[e.city, e.country].filter(Boolean).join(", ")}
                </Badge>
                <VerificationBadge status={e.verificationStatus} />
                <RiskBadge level={e.riskLevel} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Confidence</div>
              <div className="text-3xl font-semibold tabular-nums">{e.confidenceScore}%</div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Profile completeness" value={`${e.profileCompleteness}%`} />
          <Stat label="Verified certs" value={e.verifiedCertCount} hint={`${e.expiredCertCount} expired`} />
          <Stat label="Evidence count" value={e.evidenceCount} />
          <Stat label="Missing fields" value={e.missingDataCount} />
        </section>

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
              </dl>
              <TagBlock label="Materials" items={e.materials} />
              <TagBlock label="Capabilities" items={e.capabilities} />
              <TagBlock label="Certifications" items={e.certifications} />
              {e.governance && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Governance
                  </div>
                  <p className="mt-1">{e.governance}</p>
                </div>
              )}
              {e.traceabilityNotes && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Traceability notes
                  </div>
                  <p className="mt-1">{e.traceabilityNotes}</p>
                </div>
              )}
              {e.comments && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Comments
                  </div>
                  <p className="mt-1 whitespace-pre-line">{e.comments}</p>
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
                  {e.certificationDetails.map((c, i) => (
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
                {e.contacts.map((c, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {c.role}
                    </div>
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

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <GoogleMap entities={[e]} height={300} zoom={6} />
              <div className="mt-3 text-xs text-muted-foreground">
                {e.address && `${e.address} · `}
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

        <Card className="border-slate-200 bg-slate-50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Info className="h-4 w-4" /> How these scores are calculated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div>
              <span className="font-semibold">Confidence score</span> ={" "}
              <code className="rounded bg-white px-1.5 py-0.5">
                0.5 × completeness + 0.3 × verified-cert ratio + 0.2 × contactability
              </code>
            </div>
            <div>
              <span className="font-semibold">Profile completeness</span> — share of 12 core fields
              present (name, GCH-number, address, city, country, tier, entity type, certifications,
              capabilities, contacts, director email, director phone).
            </div>
            <div className="space-y-1">
              <div className="font-semibold">Verification status</div>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>
                  <strong>Verified</strong> — at least one certificate has a valid last-verified date
                  and is not expired, and ≤ 3 fields are missing.
                </li>
                <li>
                  <strong>Pending</strong> — certificates exist but lack last-verified or expiry
                  dates.
                </li>
                <li>
                  <strong>Incomplete</strong> — no certifications uploaded yet.
                </li>
                <li>
                  <strong>Flagged</strong> — one or more certifications have an expiry date in the
                  past.
                </li>
              </ul>
            </div>
            <div>
              <span className="font-semibold">Risk level</span> — Low ≥ 80% confidence, Medium 55–79%,
              High &lt; 55%.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
