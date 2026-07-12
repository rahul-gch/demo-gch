import { useRef } from "react";
import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReportUploader } from "@/components/ReportUploader";
import {
  getMockSocialAudits,
  getMockTransactionCerts,
  daysUntil,
  expiryTone,
  type ExpiryTone,
  type AuditStatus,
  type TCStatus,
} from "@/seed/compliance";
import { ShieldCheck, AlertTriangle, Clock, ClipboardCheck, Upload, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function toneClass(t: ExpiryTone) {
  if (t === "expired") return "border-red-200 bg-red-50 text-red-700";
  if (t === "soon") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function toneLabel(dateStr: string) {
  const d = daysUntil(dateStr);
  if (d < 0) return `Expired ${-d}d ago`;
  if (d < 90) return `in ${d}d`;
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

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "ok" | "amber" | "red" | "slate";
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

export function CompliancePage({ entity }: { entity: Entity }) {
  const uploaderRef = useRef<HTMLDivElement | null>(null);
  const scrollToUpload = () => uploaderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const audits = getMockSocialAudits(entity);
  const tcs = getMockTransactionCerts(entity);
  const certs = entity.certificationDetails ?? [];

  const validCount = certs.filter((c) => c.status === "Verified" && daysUntil(c.expiryDate) >= 0).length;
  const expiringSoon = certs.filter((c) => {
    const t = expiryTone(c.expiryDate);
    return t === "soon";
  }).length;
  const expired = certs.filter((c) => expiryTone(c.expiryDate) === "expired" || c.status === "Expired").length;
  const pendingAudits = audits.filter((a) => a.status === "Minor NC" || a.status === "Major NC").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compliance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Social audits, product certifications, transaction certificates and compliance uploads.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Valid certificates" value={validCount} icon={ShieldCheck} tone="ok" />
        <Kpi label="Expiring in 90 days" value={expiringSoon} icon={Clock} tone="amber" />
        <Kpi label="Expired" value={expired} icon={AlertTriangle} tone="red" />
        <Kpi label="Audit non-conformities" value={pendingAudits} icon={ClipboardCheck} tone="slate" />
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Standard</th>
                  <th className="px-4 py-2 text-left font-medium">Auditor</th>
                  <th className="px-4 py-2 text-left font-medium">Scope</th>
                  <th className="px-4 py-2 text-left font-medium">Audit date</th>
                  <th className="px-4 py-2 text-left font-medium">Next due</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {audits.map((a) => (
                  <tr key={a.id}>
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
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={auditBadge(a.status)}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={scrollToUpload}>
                        <Upload className="mr-1 h-3.5 w-3.5" /> Evidence
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    <th className="px-4 py-2 text-right font-medium">Actions</th>
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
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" onClick={scrollToUpload}>
                            <Upload className="mr-1 h-3.5 w-3.5" /> Replace
                          </Button>
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
              Shipment-level certificates linking specific orders to certified inputs.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={scrollToUpload}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload TC
          </Button>
        </CardHeader>
        <CardContent className="p-0">
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
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tcs.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-mono text-xs">{t.number}</td>
                    <td className="px-4 py-3">{t.standard}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.issuedBy}</td>
                    <td className="px-4 py-3">{t.issueDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.products}</td>
                    <td className="px-4 py-3">{t.buyer}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={tcBadge(t.status)}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div ref={uploaderRef}>
        <ReportUploader entity={entity} />
      </div>
    </div>
  );
}
