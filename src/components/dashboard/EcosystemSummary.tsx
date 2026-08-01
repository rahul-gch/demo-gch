import { useMemo, useState } from "react";
import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { buildEcosystemCounts } from "@/lib/dashboard-derive";
import { EcosystemGoogleMap } from "@/components/EcosystemGoogleMap";
import { getEcosystemConnections } from "@/seed/showcase";
import {
  ArrowUpRight,
  Building2,
  Globe2,
  Factory,
  FlaskConical,
  HeartHandshake,
  ShieldCheck,
  BadgeCheck,
  ChevronDown,
} from "lucide-react";

type MetricKey =
  | "organizations"
  | "countries"
  | "suppliers"
  | "research"
  | "ngos"
  | "auditors"
  | "certifiers";

const METRIC_META: Record<
  MetricKey,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; ring: string }
> = {
  organizations: { label: "Organizations", icon: Building2, color: "text-sky-600", ring: "hover:ring-sky-300" },
  countries: { label: "Countries", icon: Globe2, color: "text-indigo-600", ring: "hover:ring-indigo-300" },
  suppliers: { label: "Suppliers", icon: Factory, color: "text-cyan-600", ring: "hover:ring-cyan-300" },
  research: { label: "Research", icon: FlaskConical, color: "text-violet-600", ring: "hover:ring-violet-300" },
  ngos: { label: "NGOs", icon: HeartHandshake, color: "text-rose-600", ring: "hover:ring-rose-300" },
  auditors: { label: "Auditors", icon: ShieldCheck, color: "text-amber-600", ring: "hover:ring-amber-300" },
  certifiers: { label: "Certifiers", icon: BadgeCheck, color: "text-emerald-600", ring: "hover:ring-emerald-300" },
};

function MetricPill({
  active,
  value,
  metric,
  onClick,
}: {
  active: boolean;
  value: number;
  metric: MetricKey;
  onClick: () => void;
}) {
  const meta = METRIC_META[metric];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`group flex min-w-0 items-center gap-2 rounded-lg border bg-white p-2.5 text-left transition hover:shadow-sm ring-1 ring-transparent ${meta.ring} ${
        active ? "border-slate-900 ring-slate-900/10 bg-slate-50" : "border-slate-200"
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-50 ${meta.color}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {meta.label}
        </span>
        <span className="block text-base font-semibold tabular-nums text-slate-900">{value}</span>
      </span>
      <ChevronDown
        className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition ${active ? "rotate-180" : ""}`}
      />
    </button>
  );
}

export function EcosystemSummary({ entity }: { entity: Entity }) {
  const c = buildEcosystemCounts(entity);
  const hasData = c.organizations > 0;
  const conns = useMemo(() => getEcosystemConnections(entity).map((x) => x.entity), [entity]);
  const [open, setOpen] = useState<MetricKey | null>(null);

  const filtered = useMemo(() => {
    if (!open) return [];
    switch (open) {
      case "organizations":
        return conns;
      case "suppliers":
        return conns.filter((x) => x.actorType !== "Tier 0");
      case "research":
      case "ngos":
        return conns.filter((x) => x.entityType === "Sustainability Partner");
      case "auditors":
      case "certifiers":
        return conns.filter((x) => x.entityType === "Certification Body");
      case "countries":
        return [];
      default:
        return [];
    }
  }, [open, conns]);

  const countryCounts = useMemo(() => {
    const m = new Map<string, number>();
    conns.forEach((c) => m.set(c.country, (m.get(c.country) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [conns]);

  const metrics: [MetricKey, number][] = [
    ["organizations", c.organizations],
    ["countries", c.countries],
    ["suppliers", c.suppliers],
    ["research", c.research],
    ["ngos", c.ngos],
    ["auditors", c.auditors],
    ["certifiers", c.certifiers],
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          <Globe2 className="mr-1.5 -mt-0.5 inline h-4 w-4 text-sky-600" />
          Ecosystem network
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to="/organizations/$id/supply-chain" params={{ id: entity.id }}>
            Open network <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
          {metrics.map(([k, v]) => (
            <MetricPill
              key={k}
              metric={k}
              value={v}
              active={open === k}
              onClick={() => setOpen(open === k ? null : k)}
            />
          ))}
        </div>

        <div
          className={`grid overflow-hidden transition-all duration-300 ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <div className="rounded-lg border bg-slate-50/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                  {open ? METRIC_META[open].label : ""}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {open === "countries" ? `${countryCounts.length} regions` : `${filtered.length} listed`}
                </div>
              </div>

              {open === "countries" ? (
                <div className="flex flex-wrap gap-1.5">
                  {countryCounts.map(([country, n]) => (
                    <Badge key={country} variant="secondary" className="text-[11px]">
                      {country} · {n}
                    </Badge>
                  ))}
                  {countryCounts.length === 0 && (
                    <span className="text-xs text-muted-foreground">No countries yet.</span>
                  )}
                </div>
              ) : (
                <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.slice(0, 12).map((e) => (
                    <Link
                      key={e.id}
                      to="/organizations/$id"
                      params={{ id: e.id }}
                      className="group flex items-center justify-between gap-2 rounded-md border bg-white px-2.5 py-2 hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-slate-900">{e.name}</div>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px]">{e.entityType}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{e.country}</Badge>
                        </div>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  ))}
                  {filtered.length === 0 && (
                    <span className="text-xs text-muted-foreground">No connections in this category.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <EcosystemGoogleMap
            entities={[entity, ...conns]}
            selectedId={entity.id}
            height={220}
            center={{ lat: entity.latitude, lng: entity.longitude }}
            zoom={3}
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}
