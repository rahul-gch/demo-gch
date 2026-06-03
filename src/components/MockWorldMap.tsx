import { useState } from "react";
import type { Entity } from "@/seed/types";
import { cn } from "@/lib/utils";

// Equirectangular projection (lon/lat -> x/y in 0..100)
function project(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

function pinTone(e: Entity) {
  if (e.verificationStatus === "Verified") return "bg-slate-900 ring-slate-300";
  if (e.verificationStatus === "Pending") return "bg-slate-500 ring-slate-300";
  if (e.riskLevel === "High") return "bg-red-600 ring-red-200";
  return "bg-slate-300 ring-slate-200";
}

interface Props {
  entities: Entity[];
  onSelect?: (e: Entity) => void;
  selectedId?: string;
  height?: number;
  compact?: boolean;
}

export function MockWorldMap({ entities, onSelect, selectedId, height = 480, compact }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border bg-[oklch(0.98_0.005_240)]"
      style={{ height }}
    >
      {/* Subtle grid */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" className="text-slate-200" />
      </svg>
      {/* Continents silhouette - very rough abstract */}
      <svg
        className="absolute inset-0 h-full w-full text-slate-200"
        viewBox="0 0 100 50"
        preserveAspectRatio="none"
      >
        <path
          d="M15,18 Q22,12 30,14 Q35,10 42,14 L44,20 Q40,24 35,22 Q28,28 22,24 Q16,26 15,18 Z"
          fill="currentColor"
        />
        <path
          d="M45,18 Q52,12 58,14 L62,20 Q60,30 56,32 Q50,30 48,24 Q44,22 45,18 Z"
          fill="currentColor"
        />
        <path
          d="M60,18 Q70,14 80,18 Q86,22 84,30 Q78,34 70,30 Q62,28 60,18 Z"
          fill="currentColor"
        />
        <path d="M75,32 Q82,30 86,36 Q82,42 76,40 Q72,36 75,32 Z" fill="currentColor" />
        <path
          d="M28,30 Q34,30 36,38 Q34,46 28,46 Q22,42 24,36 Q24,30 28,30 Z"
          fill="currentColor"
        />
      </svg>

      {/* Pins */}
      {entities.map((e) => {
        const { x, y } = project(e.latitude, e.longitude);
        const active = selectedId === e.id || hover === e.id;
        return (
          <button
            key={e.id}
            type="button"
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-offset-1 transition-transform",
              compact ? "h-2.5 w-2.5" : "h-3 w-3",
              pinTone(e),
              active && "scale-150 z-10",
            )}
            style={{ left: `${x}%`, top: `${y}%` }}
            onMouseEnter={() => setHover(e.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSelect?.(e)}
            aria-label={e.name}
          />
        );
      })}

      {hover && !compact && (
        <div
          className="pointer-events-none absolute z-20 rounded-md border bg-card px-2 py-1 text-xs shadow"
          style={{
            left: `${project(entities.find((e) => e.id === hover)!.latitude, entities.find((e) => e.id === hover)!.longitude).x}%`,
            top: `${project(entities.find((e) => e.id === hover)!.latitude, entities.find((e) => e.id === hover)!.longitude).y}%`,
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
        >
          <div className="font-medium">{entities.find((e) => e.id === hover)!.name}</div>
          <div className="text-muted-foreground">
            {entities.find((e) => e.id === hover)!.entityType} ·{" "}
            {entities.find((e) => e.id === hover)!.country}
          </div>
        </div>
      )}
    </div>
  );
}
