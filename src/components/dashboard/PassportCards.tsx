import type { Entity } from "@/seed/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { computeNhri, bandBadgeClasses } from "@/lib/nhri";
import { buildEcosystemCounts, buildSupplyChainSnapshot } from "@/lib/dashboard-derive";
import { ShieldCheck, Recycle, Sparkles, Globe2, ArrowUpRight } from "lucide-react";

function PassportCard({
  title,
  stripe,
  metric,
  metricLabel,
  subStats,
  href,
  entity,
  tone,
}: {
  title: string;
  stripe: React.ReactNode;
  metric: string;
  metricLabel: string;
  subStats: { label: string; value: string | number }[];
  href: string;
  entity: Entity;
  tone: string;
}) {
  return (
    <Link
      to={href}
      params={{ id: entity.id }}
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md"
    >
      <div className={`flex items-center justify-between px-4 py-2 text-white ${tone}`}>
        <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
          {stripe}
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 opacity-70 transition group-hover:opacity-100" />
      </div>
      <div className="flex-1 space-y-3 p-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-semibold tabular-nums">{metric}</span>
            <span className="text-xs text-muted-foreground">{metricLabel}</span>
          </div>
        </div>
        <ul className="space-y-1 text-xs text-slate-700">
          {subStats.map((s) => (
            <li key={s.label} className="flex items-center justify-between">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-medium tabular-nums">{s.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}

export function PassportCards({ entity }: { entity: Entity }) {
  const nhri = computeNhri(entity);
  const eco = buildEcosystemCounts(entity);
  const sc = buildSupplyChainSnapshot(entity);
  const compliance = Math.round(nhri.pillars.find((p) => p.key === "compliance")?.value ?? 0);
  const circularity = Math.min(99, Math.round(compliance * 0.75 + 8));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <PassportCard
        entity={entity}
        href="/organizations/$id"
        title="Identity"
        stripe={
          <>
            <Globe2 className="h-3 w-3" /> Passport
          </>
        }
        tone="bg-slate-900"
        metric={entity.actorType.replace("Tier ", "T")}
        metricLabel={entity.country}
        subStats={[
          { label: "Entity", value: entity.entityType },
          { label: "Verification", value: entity.verificationStatus },
          { label: "Rank", value: `#${nhri.globalRank}` },
        ]}
      />
      <PassportCard
        entity={entity}
        href="/organizations/$id/supply-chain"
        title="Supply chain"
        stripe={
          <>
            <Globe2 className="h-3 w-3" /> Network
          </>
        }
        tone="bg-sky-700"
        metric={String(sc.suppliers)}
        metricLabel="suppliers"
        subStats={[
          { label: "Countries", value: sc.countries },
          { label: "Risks", value: sc.risks },
          { label: "Certified", value: sc.certified },
        ]}
      />
      <PassportCard
        entity={entity}
        href="/organizations/$id/compliance"
        title="Compliance"
        stripe={
          <>
            <ShieldCheck className="h-3 w-3" /> Trust
          </>
        }
        tone="bg-emerald-700"
        metric={`${compliance}%`}
        metricLabel="verified"
        subStats={[
          { label: "Verified certs", value: entity.verifiedCertCount },
          { label: "Expired", value: entity.expiredCertCount },
          { label: "Circularity", value: `${circularity}%` },
        ]}
      />
      <PassportCard
        entity={entity}
        href="/organizations/$id"
        title="AI Health"
        stripe={
          <>
            <Sparkles className="h-3 w-3" /> NHRI
          </>
        }
        tone="bg-amber-600"
        metric={String(nhri.score)}
        metricLabel={nhri.band}
        subStats={[
          { label: "Confidence", value: `${entity.confidenceScore}%` },
          { label: "vs peers", value: `${nhri.deltaVsPeers >= 0 ? "+" : ""}${nhri.deltaVsPeers}` },
          { label: "Reach", value: eco.organizations },
        ]}
      />
    </div>
  );
}

export function PassportBandBadge({ entity }: { entity: Entity }) {
  const nhri = computeNhri(entity);
  return (
    <Badge variant="outline" className={bandBadgeClasses(nhri.bandTone)}>
      {nhri.band}
    </Badge>
  );
}

// Silence unused import warnings for the icons used only in some builds.
export const _icons = { Recycle };
