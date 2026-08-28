import { useMemo, useState } from "react";
import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { buildSupplyChainSnapshot } from "@/lib/dashboard-derive";
import { getEcosystemConnections } from "@/seed/showcase";
import {
  Truck,
  Users,
  Globe2,
  AlertTriangle,
  Clock,
  BadgeCheck,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";

type TileKey = "suppliers" | "countries" | "risks" | "delays" | "certified";

const TILE_META: Record<
  TileKey,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
    iconColor: string;
    valueColor: string;
  }
> = {
  suppliers: {
    label: "Suppliers",
    icon: Users,
    tone: "border-slate-200 bg-slate-50 hover:bg-slate-100",
    iconColor: "text-slate-600",
    valueColor: "text-slate-900",
  },
  countries: {
    label: "Countries",
    icon: Globe2,
    tone: "border-indigo-200 bg-indigo-50 hover:bg-indigo-100",
    iconColor: "text-indigo-600",
    valueColor: "text-indigo-900",
  },
  risks: {
    label: "Risks",
    icon: AlertTriangle,
    tone: "border-red-200 bg-red-50 hover:bg-red-100",
    iconColor: "text-red-600",
    valueColor: "text-red-800",
  },
  delays: {
    label: "Delays",
    icon: Clock,
    tone: "border-amber-200 bg-amber-50 hover:bg-amber-100",
    iconColor: "text-amber-600",
    valueColor: "text-amber-800",
  },
  certified: {
    label: "Certified",
    icon: BadgeCheck,
    tone: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
    iconColor: "text-emerald-600",
    valueColor: "text-emerald-800",
  },
};

function Tile({
  tile,
  value,
  active,
  onClick,
}: {
  tile: TileKey;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  const meta = TILE_META[tile];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`flex flex-col rounded-lg border p-3 text-left transition ${meta.tone} ${
        active ? "ring-2 ring-slate-900/10" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-md bg-white/70 ${meta.iconColor}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition ${active ? "rotate-180" : ""}`}
        />
      </div>
      <div className={`mt-2 text-xl font-semibold tabular-nums ${meta.valueColor}`}>{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {meta.label}
      </div>
    </button>
  );
}

export function SupplyChainSnapshot({ entity }: { entity: Entity }) {
  const s = buildSupplyChainSnapshot(entity);
  const hasData = s.suppliers > 0;
  const conns = useMemo(() => getEcosystemConnections(entity).map((x) => x.entity), [entity]);
  const [open, setOpen] = useState<TileKey | null>(null);
  const max = Math.max(...s.tiers.map((t) => t.value), 1);

  const list = useMemo(() => {
    switch (open) {
      case "suppliers":
        return conns.filter((c) => c.actorType !== "Tier 0");
      case "risks":
        return conns.filter((c) => c.riskLevel !== "Low");
      case "delays":
        return conns.slice(0, Math.max(1, Math.round(conns.length / 3)));
      case "certified":
        return conns.filter((c) => c.verificationStatus === "Verified");
      default:
        return [];
    }
  }, [open, conns]);

  const countryCounts = useMemo(() => {
    const m = new Map<string, number>();
    conns.forEach((c) => m.set(c.country, (m.get(c.country) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [conns]);

  const tiles: [TileKey, number][] = [
    ["suppliers", s.suppliers],
    ["countries", s.countries],
    ["risks", s.risks],
    ["delays", s.delays],
    ["certified", s.certified],
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          <Truck className="mr-1.5 -mt-0.5 inline h-4 w-4 text-slate-600" />
          Supply chain snapshot
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to="/organizations/$id/supply-chain" params={{ id: entity.id }}>
            View full <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData && (
          <p className="rounded-lg border border-dashed bg-slate-50/60 p-6 text-center text-sm text-muted-foreground">
            No supply chain mapped yet. Upload your supplier list to see suppliers, risks and
            certifications here.
          </p>
        )}
        {hasData && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map(([k, v]) => (
              <Tile
                key={k}
                tile={k}
                value={v}
                active={open === k}
                onClick={() => setOpen(open === k ? null : k)}
              />
            ))}
          </div>
        )}

        <div
          className={`grid overflow-hidden transition-all duration-300 ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <div className="rounded-lg border bg-slate-50/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                  {open ? TILE_META[open].label : ""}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {open === "countries"
                    ? `${countryCounts.length} regions`
                    : `${list.length} listed`}
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
                    <span className="text-xs text-muted-foreground">No countries.</span>
                  )}
                </div>
              ) : (
                <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {list.slice(0, 12).map((e) => (
                    <Link
                      key={e.id}
                      to="/directory/$id"
                      params={{ id: e.id }}
                      className="group flex items-center justify-between gap-2 rounded-md border bg-white px-2.5 py-2 hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-slate-900">{e.name}</div>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px]">
                            {e.actorType}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {e.country}
                          </Badge>
                        </div>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  ))}
                  {list.length === 0 && (
                    <span className="text-xs text-muted-foreground">Nothing to show here.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {s.tiers.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Tier distribution
              </div>
              <div className="text-[10px] text-muted-foreground">
                Total {s.tiers.reduce((a, b) => a + b.value, 0)}
              </div>
            </div>
            <div className="flex h-28 items-end gap-3 rounded-lg border bg-slate-50/60 p-3">
              {s.tiers.map((t) => {
                const pct = Math.max(12, Math.round((t.value / max) * 100));
                return (
                  <div key={t.label} className="flex flex-1 flex-col items-center gap-1">
                    <div className="text-[10px] font-semibold tabular-nums text-slate-700">
                      {t.value}
                    </div>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-slate-800 to-slate-500 transition-all"
                      style={{ height: `${pct}%` }}
                      title={`${t.label}: ${t.value}`}
                    />
                    <div className="text-[10px] font-medium text-muted-foreground">{t.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
