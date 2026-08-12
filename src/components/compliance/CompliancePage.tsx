import { useRef, useState } from "react";
import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { ReportUploader } from "@/components/ReportUploader";
import { isSeededOrg } from "@/seed/showcase";
import {
  getMockSocialAudits,
  getMockTransactionCerts,
  daysUntil,
  expiryTone,
  scoreTone,
  type ExpiryTone,
  type AuditStatus,
  type TCStatus,
  type SocialAudit,
  type TransactionCert,
  type Severity,
} from "@/seed/compliance";
import { ShieldCheck, AlertTriangle, Clock, ClipboardCheck, Upload, ExternalLink, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function toneClass(t: ExpiryTone) {
  if (t === "expired") return "border-red-200 bg-red-50 text-red-700";
  if (t === "soon") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function toneLabel(dateStr: string) {
  const d = daysUntil(dateStr);
  if (d < 0) return `Expired ${-d}d ago`;
  return `in ${d}d`;
}

function auditBadge(s: AuditStatus) {
  const map: Record<AuditStatus, string> = {
    Passed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    "Minor NC": "border-amber-200 bg-amber-50 text-amber-800",
    "Major NC": "border-red-200 bg-red-50 text-red-700",
    Expired: "border-slate-300 bg-slate-100 text-slate-700",
  };
  return map[s];
}

function tcBadge(s: TCStatus) {
  const map: Record<TCStatus, string> = {
    Issued: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Pending: "border-amber-200 bg-amber-50 text-amber-800",
    Void: "border-red-200 bg-red-50 text-red-700",
  };
  return map[s];
}

function severityBadge(s: Severity) {
  const m: Record<Severity, string> = {
    Info: "border-slate-200 bg-slate-50 text-slate-700",
    Minor: "border-amber-200 bg-amber-50 text-amber-800",
    Major: "border-orange-200 bg-orange-50 text-orange-800",
    Critical: "border-red-200 bg-red-50 text-red-700",
  };
  return m[s];
}

function scorePill(score: number) {
  const t = scoreTone(score);
  const cls =
    t === "ok" ? "bg-emerald-100 text-emerald-800"
    : t === "amber" ? "bg-amber-100 text-amber-900"
    : "bg-red-100 text-red-800";
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums", cls)}>
      {score}/100
    </span>
  );
}

function Kpi({
  label, value, icon: Icon, tone,
}: {
  label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; tone: "ok" | "amber" | "red" | "slate";
}) {
  const toneMap = {
    ok: "text-emerald-700 bg-emerald-50",
    amber: "text-amber-800 bg-amber-50",
    red: "text-red-700 bg-red-50",
    slate: "text-slate-700 bg-slate-100",
  } as const;
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-md", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function AuditDetailSheet({
  audit, open, onOpenChange,
}: { audit: SocialAudit | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!audit) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <SheetTitle className="text-xl">{audit.standard}</SheetTitle>
              <SheetDescription>Audited by {audit.auditor} · {audit.scope}</SheetDescription>
            </div>
            {scorePill(audit.score)}
          </div>
        </SheetHeader>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Audit date" value={audit.auditDate} />
          <MiniStat label="Next due" value={audit.nextDue} />
          <MiniStat label="Status" value={audit.status} />
          <MiniStat label="Findings" value={String(audit.findings.length)} />
        </div>

        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Findings & corrective actions</div>
          <div className="mt-3 overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Severity</th>
                  <th className="px-3 py-2 text-left font-medium">Area</th>
                  <th className="px-3 py-2 text-left font-medium">Finding</th>
                  <th className="px-3 py-2 text-left font-medium">Corrective action</th>
                  <th className="px-3 py-2 text-left font-medium">Due</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {audit.findings.map((f) => (
                  <tr key={f.id}>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={severityBadge(f.severity)}>{f.severity}</Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{f.area}</td>
                    <td className="px-3 py-2 font-medium">{f.title}</td>
                    <td className="px-3 py-2 text-muted-foreground">{f.correctiveAction}</td>
                    <td className="px-3 py-2">{f.dueDate}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">{f.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-md border border-dashed px-4 py-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>
              Attachments live in your organization&rsquo;s document library — upload audit reports and
              certificates below.
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TcDetailSheet({
  tc, open, onOpenChange,
}: { tc: TransactionCert | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!tc) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-mono text-lg">{tc.number}</SheetTitle>
          <SheetDescription>{tc.standard} · issued by {tc.issuedBy}</SheetDescription>
        </SheetHeader>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniStat label="Issue date" value={tc.issueDate} />
          <MiniStat label="Status" value={tc.status} />
          <MiniStat label="Buyer" value={tc.buyer} />
          <MiniStat label="Weight" value={`${tc.weightKg.toLocaleString()} kg`} />
          <MiniStat label="Products" value={tc.products} />
        </div>
        <div className="mt-6 rounded-md border border-dashed px-4 py-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>
              Attachments live in your organization&rsquo;s document library — upload audit reports and
              certificates below.
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}

export function CompliancePage({ entity }: { entity: Entity }) {
  const uploaderRef = useRef<HTMLDivElement | null>(null);
  const scrollToUpload = () => uploaderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const seeded = isSeededOrg(entity);
  const audits = seeded ? getMockSocialAudits(entity) : [];
  const tcs = seeded ? getMockTransactionCerts(entity) : [];
  const certs = entity.certificationDetails ?? [];

  const [activeAudit, setActiveAudit] = useState<SocialAudit | null>(null);
  const [activeTc, setActiveTc] = useState<TransactionCert | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [tcOpen, setTcOpen] = useState(false);

  const validCount = certs.filter((c) => c.status === "Verified" && daysUntil(c.expiryDate) >= 0).length;
  const expiringSoon = certs.filter((c) => expiryTone(c.expiryDate) === "soon").length;
  const expired = certs.filter((c) => expiryTone(c.expiryDate) === "expired" || c.status === "Expired").length;
  const pendingAudits = audits.filter((a) => a.status === "Minor NC" || a.status === "Major NC").length;
  const avgAuditScore = audits.length ? Math.round(audits.reduce((s, a) => s + a.score, 0) / audits.length) : 0;

  const openAudit = (a: SocialAudit) => { setActiveAudit(a); setAuditOpen(true); };
  const openTc = (t: TransactionCert) => { setActiveTc(t); setTcOpen(true); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compliance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Social audits, product certifications, transaction certificates and compliance uploads. Click any row for full details.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Valid certificates" value={validCount} icon={ShieldCheck} tone="ok" />
        <Kpi label="Expiring in 90 days" value={expiringSoon} icon={Clock} tone="amber" />
        <Kpi label="Expired" value={expired} icon={AlertTriangle} tone="red" />
        <Kpi label="Audit non-conformities" value={pendingAudits} icon={ClipboardCheck} tone="slate" />
        <Kpi label="Avg audit score" value={avgAuditScore || "—"} icon={ShieldCheck} tone={avgAuditScore >= 85 ? "ok" : avgAuditScore >= 65 ? "amber" : "red"} />
      </div>

      {/* Social audits */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">Social audits</CardTitle>
          <Button size="sm" variant="outline" onClick={scrollToUpload}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload audit report
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {audits.length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted-foreground">
              No social audits recorded yet. Upload an audit report to get started.
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Standard</th>
                  <th className="px-4 py-2 text-left font-medium">Auditor</th>
                  <th className="px-4 py-2 text-left font-medium">Scope</th>
                  <th className="px-4 py-2 text-left font-medium">Audit date</th>
                  <th className="px-4 py-2 text-left font-medium">Next due</th>
                  <th className="px-4 py-2 text-left font-medium">Score</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {audits.map((a) => (
                  <tr key={a.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openAudit(a)}>
                    <td className="px-4 py-3 font-medium">{a.standard}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.auditor}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.scope}</td>
                    <td className="px-4 py-3">{a.auditDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{a.nextDue}</span>
                        <Badge variant="outline" className={cn("text-[10px]", toneClass(expiryTone(a.nextDue)))}>
                          {toneLabel(a.nextDue)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">{scorePill(a.score)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={auditBadge(a.status)}>{a.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Product certifications */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">Product certifications</CardTitle>
          <Button size="sm" variant="outline" onClick={scrollToUpload}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload certificate
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {certs.length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted-foreground">No certifications recorded for this organization.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Certification</th>
                    <th className="px-4 py-2 text-left font-medium">Category</th>
                    <th className="px-4 py-2 text-left font-medium">Issued</th>
                    <th className="px-4 py-2 text-left font-medium">Expiry</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {certs.map((c, i) => {
                    const tone = expiryTone(c.expiryDate);
                    return (
                      <tr key={i} className={tone === "expired" ? "bg-red-50/40" : tone === "soon" ? "bg-amber-50/40" : ""}>
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.category}</td>
                        <td className="px-4 py-3">{c.lastVerified}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{c.expiryDate}</span>
                            <Badge variant="outline" className={cn("text-[10px]", toneClass(tone))}>
                              {toneLabel(c.expiryDate)}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={
                              c.status === "Verified"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : c.status === "Pending"
                                  ? "border-amber-200 bg-amber-50 text-amber-800"
                                  : "border-red-200 bg-red-50 text-red-700"
                            }
                          >
                            {c.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction certificates */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-semibold">Transaction certificates (TCs)</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Shipment-level certificates linking specific orders to certified inputs. Click a row for details.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={scrollToUpload}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload TC
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {tcs.length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted-foreground">
              No transaction certificates recorded yet. Upload a TC to link shipments to certified
              inputs.
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">TC number</th>
                  <th className="px-4 py-2 text-left font-medium">Standard</th>
                  <th className="px-4 py-2 text-left font-medium">Issued by</th>
                  <th className="px-4 py-2 text-left font-medium">Issue date</th>
                  <th className="px-4 py-2 text-left font-medium">Products</th>
                  <th className="px-4 py-2 text-left font-medium">Buyer</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {tcs.map((t) => (
                  <tr key={t.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openTc(t)}>
                    <td className="px-4 py-3 font-mono text-xs">{t.number}</td>
                    <td className="px-4 py-3">{t.standard}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.issuedBy}</td>
                    <td className="px-4 py-3">{t.issueDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.products}</td>
                    <td className="px-4 py-3">{t.buyer}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={tcBadge(t.status)}>{t.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      <div ref={uploaderRef}>
        <ReportUploader entity={entity} />
      </div>

      <AuditDetailSheet audit={activeAudit} open={auditOpen} onOpenChange={setAuditOpen} />
      <TcDetailSheet tc={activeTc} open={tcOpen} onOpenChange={setTcOpen} />
    </div>
  );
}
