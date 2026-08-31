import type { Entity } from "@/seed/types";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { computeNhri } from "@/lib/nhri";
import { buildEcosystemCounts } from "@/lib/dashboard-derive";
import { ShieldCheck, UserRound, BadgeCheck, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  caption?: string;
  icon: LucideIcon;
  tone?: "emerald" | "sky" | "amber" | "red" | "slate";
  captionClass?: string;
}

const RING: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-500",
};

function KpiCard({ label, value, unit, caption, icon: Icon, tone = "slate" }: KpiCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-semibold leading-none tabular-nums text-slate-900">
              {value}
            </span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          <div className="mt-2 min-h-[1rem] truncate text-xs text-muted-foreground">
            {caption ?? ""}
          </div>
        </div>
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full",
            RING[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}

/** Four core KPIs — the single primary home for each of these numbers. */
export function KpiRow({ entity: e }: { entity: Entity }) {
  const nhri = computeNhri(e);
  const eco = buildEcosystemCounts(e);
  const certs = e.certifications.length;
  const trust = certs ? Math.round((e.verifiedCertCount / certs) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Health Score"
        value={nhri.score}
        unit="/100"
        caption={nhri.band}
        icon={ShieldCheck}
        tone={nhri.bandTone}
      />
      <KpiCard
        label="Profile"
        value={`${e.profileCompleteness}%`}
        caption={e.profileCompleteness >= 100 ? "Complete" : "In progress"}
        icon={UserRound}
        tone={e.profileCompleteness >= 80 ? "emerald" : "amber"}
      />
      <KpiCard
        label="Trust & Compliance"
        value={`${trust}%`}
        caption={certs ? `${e.verifiedCertCount} of ${certs} verified` : "No certifications yet"}
        icon={BadgeCheck}
        tone={certs === 0 ? "slate" : trust >= 80 ? "emerald" : "amber"}
      />
      <KpiCard
        label="Network"
        value={eco.organizations}
        caption={
          eco.organizations
            ? `${eco.suppliers} suppliers · ${eco.countries} countries`
            : "No connections yet"
        }
        icon={Users2}
        tone={eco.organizations ? "sky" : "slate"}
      />
    </div>
  );
}
