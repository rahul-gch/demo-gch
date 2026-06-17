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

function MaterialsCard({ e, title = "Materials & fabrics" }: { e: Entity; title?: string }) {
  if (!e.materials.length) return null;
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {e.materials.map((m) => (
          <Badge key={m} variant="outline" className="font-normal">{m}</Badge>
        ))}
      </CardContent>
    </Card>
  );
}

function CapabilitiesCard({ e }: { e: Entity }) {
  if (!e.capabilities.length) return null;
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Capabilities</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {e.capabilities.map((c) => (
          <Badge key={c} variant="secondary" className="font-normal">{c}</Badge>
        ))}
      </CardContent>
    </Card>
  );
}

function FarmerDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Sprout className="h-3.5 w-3.5 text-emerald-600" />} label="Crop / output" value={e.materials[0] || "—"} hint="Primary fiber" />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="Annual capacity" value={e.capacity || "—"} />
        <StatTile icon={<Droplet className="h-3.5 w-3.5 text-sky-600" />} label="Region" value={e.region || e.country} />
        <StatTile icon={<Leaf className="h-3.5 w-3.5 text-emerald-600" />} label="Certifications" value={e.certifications.length} hint="BCI · Organic · Fairtrade" />
      </div>
      <ReliabilityCard e={e} />
      <MaterialsCard e={e} title="Crops & fibers" />
      <CapabilitiesCard e={e} />
    </div>
  );
}

function MillDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Factory className="h-3.5 w-3.5" />} label="Capacity" value={e.capacity || "—"} />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="MOQ" value={e.moq || "—"} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time" value={`${e.leadTimeDays || 30} d`} />
        <StatTile icon={<ShieldCheck className="h-3.5 w-3.5 text-slate-600" />} label="Certifications" value={e.certifications.length} hint="ZDHC · GOTS · OEKO-TEX" />
      </div>
      <ReliabilityCard e={e} />
      <MaterialsCard e={e} title="Fibers & fabrics handled" />
      <CapabilitiesCard e={e} />
    </div>
  );
}

function FactoryDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Shirt className="h-3.5 w-3.5" />} label="Capacity" value={e.capacity || "—"} />
        <StatTile icon={<Package className="h-3.5 w-3.5" />} label="MOQ" value={e.moq || "—"} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Lead time" value={`${e.leadTimeDays || 45} d`} />
        <StatTile icon={<ShieldCheck className="h-3.5 w-3.5 text-slate-600" />} label="Social audits" value={e.verifiedCertCount} hint="SA8000 · WRAP · BSCI" />
      </div>
      <ReliabilityCard e={e} />
      <CapabilitiesCard e={e} />
      <MaterialsCard e={e} title="Product categories" />
    </div>
  );
}

function ServiceProviderDashboard({ e }: { e: Entity }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Globe2 className="h-3.5 w-3.5" />} label="Coverage" value={e.region || e.country} />
        <StatTile icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Accreditations" value={e.certifications.length} />
        <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Avg turnaround" value={`${e.leadTimeDays || 14} d`} />
        <StatTile icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />} label="Profile completeness" value={`${e.profileCompleteness}%`} />
      </div>
      <ReliabilityCard e={e} />
      <CapabilitiesCard e={e} />
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
    case "Ginner":
      return <FarmerDashboard e={entity} />;
    case "Spinner":
    case "Fabric Mill":
    case "Dye House":
      return <MillDashboard e={entity} />;
    case "Garment Factory":
      return <FactoryDashboard e={entity} />;
    case "Logistics Provider":
    case "Certification Body":
    case "Sustainability Partner":
      return <ServiceProviderDashboard e={entity} />;
    default:
      return <BrandDashboard e={entity} />;
  }
}
