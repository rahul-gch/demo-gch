import { useMemo, useState } from "react";
import type { Entity } from "@/seed/types";
import { cn } from "@/lib/utils";

// Equirectangular projection (lon/lat -> x/y in 0..100)
function project(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

const STATUS_COLOR: Record<string, string> = {
  Verified: "bg-slate-900",
  Pending: "bg-amber-500",
  Incomplete: "bg-slate-300",
  Flagged: "bg-red-600",
};

interface Props {
  entities: Entity[];
  onSelect?: (e: Entity) => void;
  selectedId?: string;
  height?: number;
  compact?: boolean;
  showRegions?: boolean;
  showLegend?: boolean;
}

export function MockWorldMap({
  entities,
  onSelect,
  selectedId,
  height = 520,
  compact,
  showRegions = true,
  showLegend = true,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const regions = useMemo(() => {
    if (!showRegions) return [];
    const map = new Map<string, { lat: number; lng: number; count: number }>();
    entities.forEach((e) => {
      const k = e.country || "Unknown";
      const cur = map.get(k);
      if (cur) {
        cur.lat += e.latitude;
        cur.lng += e.longitude;
        cur.count += 1;
      } else {
        map.set(k, { lat: e.latitude, lng: e.longitude, count: 1 });
      }
    });
    return Array.from(map.entries())
      .map(([country, v]) => ({
        country,
        count: v.count,
        lat: v.lat / v.count,
        lng: v.lng / v.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [entities, showRegions]);

  const topRegions = regions.slice(0, 6);

  const hovered = hover ? entities.find((e) => e.id === hover) : null;

  return (
    <div className="relative">
      <div
        className="relative w-full overflow-hidden rounded-xl border bg-[oklch(0.985_0.003_240)]"
        style={{ height }}
      >
        {/* Subtle grid */}
        <svg className="absolute inset-0 h-full w-full text-slate-200" preserveAspectRatio="none">
          <defs>
            <pattern id="gch-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gch-grid)" />
        </svg>

        {/* Continents silhouette */}
        <svg
          className="absolute inset-0 h-full w-full text-slate-200"
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
        >
          {/* North America */}
          <path
            d="M8,12 Q18,8 26,12 Q30,16 28,22 Q22,26 18,24 Q12,22 10,18 Q6,16 8,12 Z"
            fill="currentColor"
          />
          {/* South America */}
          <path
            d="M24,26 Q30,26 32,32 Q32,42 28,46 Q24,44 22,38 Q22,30 24,26 Z"
            fill="currentColor"
          />
          {/* Europe */}
          <path
            d="M46,12 Q54,10 58,14 Q58,18 54,20 Q50,20 46,18 Q44,14 46,12 Z"
            fill="currentColor"
          />
          {/* Africa */}
          <path
            d="M48,22 Q56,20 60,26 Q60,36 56,40 Q50,40 48,34 Q46,28 48,22 Z"
            fill="currentColor"
          />
          {/* Asia */}
          <path
            d="M58,12 Q72,8 84,14 Q88,20 84,24 Q76,26 70,24 Q64,22 60,18 Q58,16 58,12 Z"
            fill="currentColor"
          />
          {/* SE Asia + India */}
          <path
            d="M66,22 Q74,22 78,28 Q76,32 72,32 Q66,30 64,26 Q64,22 66,22 Z"
            fill="currentColor"
          />
          {/* Australia */}
          <path
            d="M80,34 Q88,32 90,38 Q88,42 82,42 Q78,40 80,34 Z"
            fill="currentColor"
          />
        </svg>

        {/* Region bubbles */}
        {showRegions &&
          regions.map((r) => {
            const { x, y } = project(r.lat, r.lng);
            const radius = Math.min(56, 14 + Math.sqrt(r.count) * 6);
            return (
              <div
                key={r.country}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900/5 ring-1 ring-slate-300/60"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: radius,
                  height: radius,
                }}
              />
            );
          })}

        {/* Region labels for top countries */}
        {showRegions &&
          !compact &&
          topRegions.map((r) => {
            const { x, y } = project(r.lat, r.lng);
            return (
              <div
                key={`l-${r.country}`}
                className="pointer-events-none absolute -translate-x-1/2 translate-y-3 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {r.country} · {r.count}
              </div>
            );
          })}

        {/* Pins */}
        {entities.map((e) => {
          const { x, y } = project(e.latitude, e.longitude);
          const active = selectedId === e.id || hover === e.id;
          return (
            <button
              key={e.id}
              type="button"
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white shadow transition-transform",
                compact ? "h-2 w-2" : "h-2.5 w-2.5",
                STATUS_COLOR[e.verificationStatus] ?? "bg-slate-400",
                active && "z-20 scale-[2] ring-slate-900/40",
              )}
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={() => setHover(e.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(e)}
              aria-label={e.name}
            />
          );
        })}

        {/* Tooltip */}
        {hovered && !compact && (
          <div
            className="pointer-events-none absolute z-30 rounded-md border bg-white px-2 py-1 text-xs shadow-md"
            style={{
              left: `${project(hovered.latitude, hovered.longitude).x}%`,
              top: `${project(hovered.latitude, hovered.longitude).y}%`,
              transform: "translate(-50%, calc(-100% - 14px))",
            }}
          >
            <div className="font-medium">{hovered.name}</div>
            <div className="text-muted-foreground">
              {hovered.entityType} · {hovered.country}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && !compact && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <Legend dot="bg-slate-900" label="Verified" />
            <Legend dot="bg-amber-500" label="Pending" />
            <Legend dot="bg-slate-300" label="Incomplete" />
            <Legend dot="bg-red-600" label="Flagged" />
          </div>
          {topRegions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <span className="font-medium text-slate-700">Top regions:</span>
              {topRegions.map((r) => (
                <span
                  key={r.country}
                  className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-700"
                >
                  {r.country} · {r.count}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
