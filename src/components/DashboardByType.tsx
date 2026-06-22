import type { Entity } from "@/seed/types";
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
  Scissors,
} from "lucide-react";

function reliabilityOf(e: Entity) {
  const otr = e.onTimeRate ?? Math.max(70, 95 - ((e.leadTimeDays ?? 30) % 25));
  const delay = e.avgDelayDays ?? Math.max(0, Math.round(((e.leadTimeDays ?? 30) % 9) - 2));
  const timeframe = e.deliveryTimeframeDays ?? e.leadTimeDays ?? 30;
  return { otr, delay, timeframe };
}

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

function FarmerDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Sprout className="h-3.5 w-3.5 text-emerald-600" />} label="Primary crop" value={e.materials[0] || "—"} />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="Annual capacity" value={e.capacity || "—"} />
        <StatTile icon={<Droplet className="h-3.5 w-3.5 text-sky-600" />} label="Region" value={e.region || e.country} />
        <StatTile icon={<Leaf className="h-3.5 w-3.5 text-emerald-600" />} label="Certifications" value={e.certifications.length} hint="BCI · Organic · Fairtrade" />
      </div>
      <ReliabilityCard e={e} />
      <ChipsCard e={e} title="Crops & fibers" source="materials" />
      <ChipsCard e={e} title="Capabilities" source="capabilities" />
      <ChipsCard e={e} title="Certifications" source="certifications" />
    </div>
  );
}

function GinnerDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Boxes className="h-3.5 w-3.5" />} label="Bale capacity" value={e.capacity || "—"} />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="MOQ" value={e.moq || "—"} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Throughput lead" value={`${e.leadTimeDays || 14} d`} />
        <StatTile icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Contamination control" value={e.verifiedCertCount} hint="USTER / SCS" />
      </div>
      <ReliabilityCard e={e} />
      <ChipsCard e={e} title="Fiber sources" source="materials" />
      <ChipsCard e={e} title="Capabilities" source="capabilities" />
    </div>
  );
}

function SpinnerDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Factory className="h-3.5 w-3.5" />} label="Spindle capacity" value={e.capacity || "—"} />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="MOQ" value={e.moq || "—"} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time" value={`${e.leadTimeDays || 30} d`} />
        <StatTile icon={<Award className="h-3.5 w-3.5" />} label="Yarn counts" value={(e.capabilities[0] || "Ne 20–60")} />
      </div>
      <ReliabilityCard e={e} />
      <ChipsCard e={e} title="Fibers & blends" source="materials" />
      <ChipsCard e={e} title="Capabilities" source="capabilities" />
      <ChipsCard e={e} title="Certifications" source="certifications" />
    </div>
  );
}

function FabricMillDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Factory className="h-3.5 w-3.5" />} label="Monthly capacity" value={e.capacity || "—"} hint="meters / month" />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="MOQ" value={e.moq || "—"} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time" value={`${e.leadTimeDays || 35} d`} />
        <StatTile icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Certifications" value={e.certifications.length} hint="GOTS · OEKO-TEX" />
      </div>
      <ReliabilityCard e={e} />
      <ChipsCard e={e} title="Fabric types" source="materials" />
      <ChipsCard e={e} title="Finishing & capabilities" source="capabilities" />
      <ChipsCard e={e} title="Certifications" source="certifications" />
    </div>
  );
}

function DyeHouseDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Droplet className="h-3.5 w-3.5 text-sky-600" />} label="Daily capacity" value={e.capacity || "—"} hint="kg / day" />
        <StatTile icon={<Recycle className="h-3.5 w-3.5 text-emerald-600" />} label="Water reuse" value={`${Math.min(95, 30 + (e.profileCompleteness % 60))}%`} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time" value={`${e.leadTimeDays || 18} d`} />
        <StatTile icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Chemistry" value={e.certifications.length} hint="ZDHC · bluesign" />
      </div>
      <ReliabilityCard e={e} />
      <ChipsCard e={e} title="Processes" source="capabilities" />
      <ChipsCard e={e} title="Substrates" source="materials" />
      <ChipsCard e={e} title="Certifications" source="certifications" />
    </div>
  );
}

function GarmentFactoryDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Shirt className="h-3.5 w-3.5" />} label="Monthly units" value={e.capacity || "—"} />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="MOQ" value={e.moq || "—"} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time" value={`${e.leadTimeDays || 45} d`} />
        <StatTile icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Social audits" value={e.verifiedCertCount} hint="SA8000 · WRAP · BSCI" />
      </div>
      <ReliabilityCard e={e} />
      <ChipsCard e={e} title="Product categories" source="materials" />
      <ChipsCard e={e} title="Sewing & capabilities" source="capabilities" />
      <ChipsCard e={e} title="Certifications" source="certifications" />
    </div>
  );
}

function LogisticsDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Globe2 className="h-3.5 w-3.5" />} label="Coverage" value={e.region || e.country} />
        <StatTile icon={<Truck className="h-3.5 w-3.5" />} label="Modes" value={(e.capabilities[0] || "Sea · Air · Road")} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Avg transit" value={`${e.leadTimeDays || 12} d`} />
        <StatTile icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />} label="On-time rate" value={`${e.onTimeRate ?? 92}%`} />
      </div>
      <ReliabilityCard e={e} />
      <ChipsCard e={e} title="Services" source="capabilities" />
      <ChipsCard e={e} title="Accreditations" source="certifications" />
    </div>
  );
}

function CertificationBodyDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Award className="h-3.5 w-3.5" />} label="Schemes audited" value={e.certifications.length} />
        <StatTile icon={<Globe2 className="h-3.5 w-3.5" />} label="Region coverage" value={e.region || e.country} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Avg turnaround" value={`${e.leadTimeDays || 21} d`} />
        <StatTile icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Active audits" value={e.evidenceCount} />
      </div>
      <ReliabilityCard e={e} />
      <ChipsCard e={e} title="Schemes & standards" source="certifications" />
      <ChipsCard e={e} title="Capabilities" source="capabilities" />
    </div>
  );
}

function SustainabilityPartnerDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Leaf className="h-3.5 w-3.5 text-emerald-600" />} label="Service areas" value={e.capabilities.length} hint="LCA · CFV · Training" />
        <StatTile icon={<GraduationCap className="h-3.5 w-3.5" />} label="Frameworks" value={e.certifications.length} hint="GRI · SBTi · CDP" />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Avg engagement" value={`${e.leadTimeDays || 30} d`} />
        <StatTile icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />} label="Profile completeness" value={`${e.profileCompleteness}%`} />
      </div>
      <ReliabilityCard e={e} />
      <ChipsCard e={e} title="Services" source="capabilities" />
      <ChipsCard e={e} title="Frameworks" source="certifications" />
    </div>
  );
}

function BrandDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <MiniDashboard entity={e} />
      <ReliabilityCard e={e} />
    </div>
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
      return <BrandDashboard e={entity} />;
  }
}
// keep import for Scissors reference avoidance
void Scissors;
