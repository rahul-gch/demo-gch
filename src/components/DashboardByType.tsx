import type { Entity, EntityType } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MiniDashboard } from "@/components/MiniDashboard";
import {
  Sprout,
  Factory,
  Shirt,
  Truck,
  ShieldCheck,
  Globe2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Package,
  Droplet,
  Leaf,
  Recycle,
  Boxes,
  Award,
  GraduationCap,
  Gauge,
  Link2,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldAlert,
  FileCheck2,
} from "lucide-react";

// ---------- helpers ----------

function reliabilityOf(e: Entity) {
  const otr = e.onTimeRate ?? Math.max(70, 95 - ((e.leadTimeDays ?? 30) % 25));
  const delay = e.avgDelayDays ?? Math.max(0, Math.round(((e.leadTimeDays ?? 30) % 9) - 2));
  const timeframe = e.deliveryTimeframeDays ?? e.leadTimeDays ?? 30;
  return { otr, delay, timeframe };
}

const SOUTHERN = new Set([
  "Australia", "Argentina", "Brazil", "Peru", "Chile", "South Africa", "Zambia", "Zimbabwe",
  "Tanzania", "Uruguay", "Paraguay", "New Zealand", "Mozambique", "Madagascar",
]);
function harvestWindow(country?: string) {
  if (country && SOUTHERN.has(country)) return "Mar–Jul";
  return "Sep–Jan";
}
const WATER_STRESS = new Set([
  "Egypt", "Pakistan", "India", "Türkiye", "Turkey", "Uzbekistan", "Syria", "Iran", "Morocco",
]);

const TIER_MAP: Record<EntityType, { tier: string; upstream: string[]; downstream: string[] }> = {
  "Brand": { tier: "Tier 0", upstream: ["Garment Factory"], downstream: ["Retail / DTC"] },
  "Farmer": { tier: "Tier 4", upstream: ["Seed & inputs"], downstream: ["Ginner"] },
  "Ginner": { tier: "Tier 3", upstream: ["Farmer"], downstream: ["Spinner"] },
  "Spinner": { tier: "Tier 3", upstream: ["Ginner"], downstream: ["Fabric Mill"] },
  "Fabric Mill": { tier: "Tier 2", upstream: ["Spinner"], downstream: ["Dye House", "Garment Factory"] },
  "Dye House": { tier: "Tier 2", upstream: ["Fabric Mill"], downstream: ["Garment Factory"] },
  "Garment Factory": { tier: "Tier 1", upstream: ["Fabric Mill", "Dye House", "Trims"], downstream: ["Brand"] },
  "Logistics Provider": { tier: "Cross-tier", upstream: ["Any tier"], downstream: ["Any tier"] },
  "Certification Body": { tier: "Independent", upstream: ["Auditees"], downstream: ["Brands · Buyers"] },
  "Sustainability Partner": { tier: "Advisory", upstream: ["Engagements"], downstream: ["Brands · Suppliers"] },
};

function matches(list: string[] | undefined, re: RegExp) {
  return (list ?? []).filter((x) => re.test(x));
}

// ---------- primitives ----------

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function KpiRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

function ReliabilityCard({ e }: { e: Entity }) {
  const r = reliabilityOf(e);
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Delivery & reliability</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-4">
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time" value={`${e.leadTimeDays || r.timeframe} d`} />
        <StatTile icon={<Truck className="h-3.5 w-3.5" />} label="Delivery timeframe" value={`${r.timeframe} d`} />
        <StatTile
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
          label="On-time rate"
          value={`${r.otr}%`}
          hint={<Progress value={r.otr} className="h-1.5" />}
        />
        <StatTile
          icon={
            r.delay > 3 ? (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            )
          }
          label="Avg delay"
          value={`${r.delay} d`}
          hint={r.delay > 3 ? "Monitor" : "Within target"}
        />
      </CardContent>
    </Card>
  );
}

function ReadinessCard({ e }: { e: Entity }) {
  const rows: Array<{ label: string; value: number }> = [
    { label: "KPI readiness", value: e.kpiReadiness ?? 0 },
    { label: "Traceability readiness", value: e.traceabilityReadiness ?? 0 },
    { label: "Matchmaking readiness", value: e.matchmakingReadiness ?? 0 },
    { label: "Profile completeness", value: e.profileCompleteness ?? 0 },
  ];
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="tabular-nums font-medium">{r.value}%</span>
            </div>
            <Progress value={r.value} className="h-1.5 mt-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RiskCard({ e }: { e: Entity }) {
  const riskTone =
    e.riskLevel === "High" ? "text-red-600" :
    e.riskLevel === "Medium" ? "text-amber-600" : "text-emerald-600";
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Risk & evidence</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-4">
        <StatTile icon={<Gauge className="h-3.5 w-3.5" />} label="Confidence" value={`${e.confidenceScore}%`} hint={<Progress value={e.confidenceScore} className="h-1.5" />} />
        <StatTile icon={<ShieldAlert className={`h-3.5 w-3.5 ${riskTone}`} />} label="Risk level" value={<span className={riskTone}>{e.riskLevel}</span>} />
        <StatTile icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />} label="Verified certs" value={e.verifiedCertCount} hint={e.expiredCertCount ? `${e.expiredCertCount} expired` : "All current"} />
        <StatTile icon={<FileCheck2 className="h-3.5 w-3.5" />} label="Evidence on file" value={e.evidenceCount} />
      </CardContent>
    </Card>
  );
}

function RelationshipsCard({ e }: { e: Entity }) {
  const t = TIER_MAP[e.entityType];
  if (!t) return null;
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Link2 className="h-4 w-4" /> Supply-chain position
          <Badge variant="outline" className="ml-2 font-normal">{t.tier}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            <ArrowDownToLine className="h-3.5 w-3.5" /> Sources from
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {t.upstream.map((x) => <Badge key={x} variant="outline" className="font-normal">{x}</Badge>)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            <ArrowUpFromLine className="h-3.5 w-3.5" /> Sells to
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {t.downstream.map((x) => <Badge key={x} variant="secondary" className="font-normal">{x}</Badge>)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChipsCard({ e, title, source }: { e: Entity; title: string; source: "materials" | "capabilities" | "certifications" }) {
  const items = e[source];
  if (!items || !items.length) return null;
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {items.map((m) => (
          <Badge key={m} variant={source === "capabilities" ? "secondary" : "outline"} className="font-normal">
            {m}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

// ---------- per-type dashboards ----------

function FarmerDashboard({ e }: { e: Entity }) {
  const waterStress = WATER_STRESS.has(e.country);
  return (
    <Shell>
      <KpiRow>
        <StatTile icon={<Sprout className="h-3.5 w-3.5 text-emerald-600" />} label="Primary crop" value={e.materials[0] || "—"} hint={e.materials.slice(1, 3).join(" · ") || undefined} />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="Annual capacity" value={e.capacity || "—"} />
        <StatTile icon={<Leaf className="h-3.5 w-3.5 text-emerald-600" />} label="Harvest window" value={harvestWindow(e.country)} hint={e.region || e.country} />
        <StatTile
          icon={<Droplet className={`h-3.5 w-3.5 ${waterStress ? "text-amber-600" : "text-sky-600"}`} />}
          label="Water stress"
          value={waterStress ? "Elevated" : "Moderate"}
          hint={waterStress ? "Monitor irrigation" : "Within norms"}
        />
      </KpiRow>
      <ReliabilityCard e={e} />
      <ReadinessCard e={e} />
      <RiskCard e={e} />
      <RelationshipsCard e={e} />
      <ChipsCard e={e} title="Crops & fibers" source="materials" />
      <ChipsCard e={e} title="Practices" source="capabilities" />
      <ChipsCard e={e} title="Certifications" source="certifications" />
    </Shell>
  );
}

function GinnerDashboard({ e }: { e: Entity }) {
  const testing = matches(e.certifications, /USTER|HVI|SCS/i).length > 0;
  return (
    <Shell>
      <KpiRow>
        <StatTile icon={<Boxes className="h-3.5 w-3.5" />} label="Bale capacity" value={e.capacity || "—"} />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="MOQ" value={e.moq || "—"} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Throughput lead" value={`${e.leadTimeDays || 14} d`} />
        <StatTile
          icon={<ShieldCheck className={`h-3.5 w-3.5 ${testing ? "text-emerald-600" : "text-muted-foreground"}`} />}
          label="Fiber testing"
          value={testing ? "USTER / HVI" : "Not declared"}
          hint={`${e.verifiedCertCount} verified certs`}
        />
      </KpiRow>
      <ReliabilityCard e={e} />
      <ReadinessCard e={e} />
      <RiskCard e={e} />
      <RelationshipsCard e={e} />
      <ChipsCard e={e} title="Fiber sources" source="materials" />
      <ChipsCard e={e} title="Capabilities" source="capabilities" />
      <ChipsCard e={e} title="Certifications" source="certifications" />
    </Shell>
  );
}

function SpinnerDashboard({ e }: { e: Entity }) {
  const spinTypes = matches(e.capabilities, /compact|ring|open[- ]end|rotor|vortex|airjet/i);
  return (
    <Shell>
      <KpiRow>
        <StatTile icon={<Factory className="h-3.5 w-3.5" />} label="Spindle capacity" value={e.capacity || "—"} />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="MOQ" value={e.moq || "—"} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time" value={`${e.leadTimeDays || 30} d`} />
        <StatTile icon={<Award className="h-3.5 w-3.5" />} label="Yarn counts" value={e.capabilities[0] || "Ne 20–60"} hint={spinTypes.slice(0, 2).join(" · ") || undefined} />
      </KpiRow>
      <ReliabilityCard e={e} />
      <ReadinessCard e={e} />
      <RiskCard e={e} />
      <RelationshipsCard e={e} />
      <ChipsCard e={e} title="Fibers & blends" source="materials" />
      <ChipsCard e={e} title="Capabilities" source="capabilities" />
      <ChipsCard e={e} title="Certifications" source="certifications" />
    </Shell>
  );
}

function FabricMillDashboard({ e }: { e: Entity }) {
  const gsm = matches(e.capabilities, /\d+\s*g/i)[0];
  const constructions = matches(e.capabilities, /knit|woven|jersey|twill|denim|interlock|pique/i);
  return (
    <Shell>
      <KpiRow>
        <StatTile icon={<Factory className="h-3.5 w-3.5" />} label="Monthly capacity" value={e.capacity || "—"} hint="meters / month" />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="MOQ" value={e.moq || "—"} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time" value={`${e.leadTimeDays || 35} d`} />
        <StatTile icon={<Award className="h-3.5 w-3.5" />} label="GSM / construction" value={gsm || "—"} hint={constructions.slice(0, 2).join(" · ") || undefined} />
      </KpiRow>
      <ReliabilityCard e={e} />
      <ReadinessCard e={e} />
      <RiskCard e={e} />
      <RelationshipsCard e={e} />
      <ChipsCard e={e} title="Fabric types" source="materials" />
      <ChipsCard e={e} title="Finishing & capabilities" source="capabilities" />
      <ChipsCard e={e} title="Certifications" source="certifications" />
    </Shell>
  );
}

function DyeHouseDashboard({ e }: { e: Entity }) {
  const waterReuse = Math.min(95, 30 + (e.profileCompleteness % 60));
  const processes = matches(e.capabilities, /reactive|pigment|digital|disperse|vat|sulphur/i);
  const zdhc = matches(e.certifications, /ZDHC|bluesign/i).length > 0;
  return (
    <Shell>
      <KpiRow>
        <StatTile icon={<Droplet className="h-3.5 w-3.5 text-sky-600" />} label="Daily capacity" value={e.capacity || "—"} hint="kg / day" />
        <StatTile icon={<Recycle className="h-3.5 w-3.5 text-emerald-600" />} label="Water reuse" value={`${waterReuse}%`} hint={<Progress value={waterReuse} className="h-1.5" />} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time" value={`${e.leadTimeDays || 18} d`} />
        <StatTile
          icon={<ShieldCheck className={`h-3.5 w-3.5 ${zdhc ? "text-emerald-600" : "text-muted-foreground"}`} />}
          label="Chemistry"
          value={zdhc ? "ZDHC / bluesign" : "Not declared"}
          hint={processes.slice(0, 2).join(" · ") || undefined}
        />
      </KpiRow>
      <ReliabilityCard e={e} />
      <ReadinessCard e={e} />
      <RiskCard e={e} />
      <RelationshipsCard e={e} />
      <ChipsCard e={e} title="Processes" source="capabilities" />
      <ChipsCard e={e} title="Substrates" source="materials" />
      <ChipsCard e={e} title="Certifications" source="certifications" />
    </Shell>
  );
}

function GarmentFactoryDashboard({ e }: { e: Entity }) {
  const audits = matches(e.certifications, /SA8000|WRAP|BSCI|Sedex|SMETA|amfori/i).length;
  return (
    <Shell>
      <KpiRow>
        <StatTile icon={<Shirt className="h-3.5 w-3.5" />} label="Monthly units" value={e.capacity || "—"} />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="MOQ" value={e.moq || "—"} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time" value={`${e.leadTimeDays || 45} d`} />
        <StatTile
          icon={<ShieldCheck className={`h-3.5 w-3.5 ${audits ? "text-emerald-600" : "text-amber-600"}`} />}
          label="Social audits"
          value={audits || "—"}
          hint={audits ? "SA8000 · WRAP · BSCI" : "None on file"}
        />
      </KpiRow>
      <ReliabilityCard e={e} />
      {e.expiredCertCount > 0 && (
        <Card className="shadow-sm border-amber-300/50">
          <CardContent className="p-4 flex items-center gap-2 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            {e.expiredCertCount} compliance certificate{e.expiredCertCount === 1 ? "" : "s"} expired — request renewal.
          </CardContent>
        </Card>
      )}
      <ReadinessCard e={e} />
      <RiskCard e={e} />
      <RelationshipsCard e={e} />
      <ChipsCard e={e} title="Product categories" source="materials" />
      <ChipsCard e={e} title="Sewing & capabilities" source="capabilities" />
      <ChipsCard e={e} title="Certifications" source="certifications" />
    </Shell>
  );
}

function LogisticsDashboard({ e }: { e: Entity }) {
  const modes = matches(e.capabilities, /sea|ocean|air|road|rail|courier|FCL|LCL/i);
  const accreds = matches(e.certifications, /AEO|C-?TPAT|IATA|FIATA|TAPA/i);
  return (
    <Shell>
      <KpiRow>
        <StatTile icon={<Globe2 className="h-3.5 w-3.5" />} label="Coverage" value={e.region || e.country} />
        <StatTile icon={<Truck className="h-3.5 w-3.5" />} label="Modes" value={modes.slice(0, 3).join(" · ") || "Sea · Air · Road"} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Avg transit" value={`${e.leadTimeDays || 12} d`} />
        <StatTile icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />} label="On-time rate" value={`${e.onTimeRate ?? 92}%`} hint={accreds.length ? accreds.slice(0, 2).join(" · ") : undefined} />
      </KpiRow>
      <ReliabilityCard e={e} />
      <ReadinessCard e={e} />
      <RiskCard e={e} />
      <RelationshipsCard e={e} />
      <ChipsCard e={e} title="Services" source="capabilities" />
      <ChipsCard e={e} title="Accreditations" source="certifications" />
    </Shell>
  );
}

function CertificationBodyDashboard({ e }: { e: Entity }) {
  return (
    <Shell>
      <KpiRow>
        <StatTile icon={<Award className="h-3.5 w-3.5" />} label="Schemes audited" value={e.certifications.length} />
        <StatTile icon={<Globe2 className="h-3.5 w-3.5" />} label="Region coverage" value={e.region || e.country} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Avg turnaround" value={`${e.leadTimeDays || 21} d`} />
        <StatTile icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Active audits" value={e.evidenceCount} hint={`${e.confidenceScore}% avg confidence`} />
      </KpiRow>
      <ReliabilityCard e={e} />
      <ReadinessCard e={e} />
      <RiskCard e={e} />
      <RelationshipsCard e={e} />
      <ChipsCard e={e} title="Schemes & standards" source="certifications" />
      <ChipsCard e={e} title="Capabilities" source="capabilities" />
    </Shell>
  );
}

function SustainabilityPartnerDashboard({ e }: { e: Entity }) {
  return (
    <Shell>
      <KpiRow>
        <StatTile icon={<Leaf className="h-3.5 w-3.5 text-emerald-600" />} label="Service areas" value={e.capabilities.length} hint="LCA · CFV · Training" />
        <StatTile icon={<GraduationCap className="h-3.5 w-3.5" />} label="Frameworks" value={e.certifications.length} hint="GRI · SBTi · CDP" />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Avg engagement" value={`${e.leadTimeDays || 30} d`} />
        <StatTile icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />} label="Profile completeness" value={`${e.profileCompleteness}%`} hint={<Progress value={e.profileCompleteness} className="h-1.5" />} />
      </KpiRow>
      <ReliabilityCard e={e} />
      <ReadinessCard e={e} />
      <RiskCard e={e} />
      <RelationshipsCard e={e} />
      <ChipsCard e={e} title="Services" source="capabilities" />
      <ChipsCard e={e} title="Frameworks" source="certifications" />
      {e.recommendedNextAction && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold">Recommended next engagement</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">{e.recommendedNextAction}</CardContent>
        </Card>
      )}
    </Shell>
  );
}

function BrandDashboard({ e }: { e: Entity }) {
  return (
    <Shell>
      <KpiRow>
        <StatTile icon={<Boxes className="h-3.5 w-3.5" />} label="Sourcing tiers covered" value={e.materials.length || "—"} hint={e.materials.slice(0, 2).join(" · ") || undefined} />
        <StatTile icon={<Gauge className="h-3.5 w-3.5" />} label="Tier 2+ visibility" value={`${e.traceabilityReadiness}%`} hint={<Progress value={e.traceabilityReadiness} className="h-1.5" />} />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="Sourcing volume" value={e.capacity || "—"} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time SLA" value={`${e.leadTimeDays || 60} d`} />
      </KpiRow>
      <MiniDashboard entity={e} />
      <ReliabilityCard e={e} />
      <ReadinessCard e={e} />
      <RiskCard e={e} />
      <RelationshipsCard e={e} />
      <ChipsCard e={e} title="Materials sourced" source="materials" />
      <ChipsCard e={e} title="Capabilities" source="capabilities" />
      <ChipsCard e={e} title="Sustainability commitments" source="certifications" />
    </Shell>
  );
}

function GenericEntityDashboard({ e }: { e: Entity }) {
  const location = [e.city, e.region || e.country].filter(Boolean).join(", ");
  return (
    <Shell>
      <KpiRow>
        <StatTile icon={<Factory className="h-3.5 w-3.5" />} label="Entity type" value={e.entityType} hint={e.actorType} />
        <StatTile icon={<Globe2 className="h-3.5 w-3.5" />} label="Location" value={location || "—"} />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="Capacity" value={e.capacity || "—"} hint={e.moq ? `MOQ ${e.moq}` : undefined} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time" value={e.leadTimeDays ? `${e.leadTimeDays} d` : "—"} />
      </KpiRow>
      <ReliabilityCard e={e} />
      <ReadinessCard e={e} />
      <RiskCard e={e} />
      <RelationshipsCard e={e} />
      <ChipsCard e={e} title="Materials" source="materials" />
      <ChipsCard e={e} title="Capabilities" source="capabilities" />
      <ChipsCard e={e} title="Certifications" source="certifications" />
    </Shell>
  );
}

export function DashboardByType({ entity }: { entity: Entity }) {
  switch (entity.entityType) {
    case "Brand":
      return <BrandDashboard e={entity} />;
    case "Farmer":
      return <FarmerDashboard e={entity} />;
    case "Ginner":
      return <GinnerDashboard e={entity} />;
    case "Spinner":
      return <SpinnerDashboard e={entity} />;
    case "Fabric Mill":
      return <FabricMillDashboard e={entity} />;
    case "Dye House":
      return <DyeHouseDashboard e={entity} />;
    case "Garment Factory":
      return <GarmentFactoryDashboard e={entity} />;
    case "Logistics Provider":
      return <LogisticsDashboard e={entity} />;
    case "Certification Body":
      return <CertificationBodyDashboard e={entity} />;
    case "Sustainability Partner":
      return <SustainabilityPartnerDashboard e={entity} />;
    default:
      return <GenericEntityDashboard e={entity} />;
  }
}
