import { useMemo } from "react";
import { ORGS, EDGES, type EcosystemOrg, type OrgType } from "@/lib/ecosystem-data";

export type GraphFilters = {
  types?: OrgType[];
  region?: string | "all";
  onlyRisk?: boolean;
  onlyMissingEvidence?: boolean;
};

const TYPE_COLOR: Record<OrgType, string> = {
  brand:     "#f59e0b", // amber
  supplier:  "#38bdf8", // sky
  verifier:  "#34d399", // emerald
  regulator: "#a78bfa", // violet
};

const SIZE_R: Record<EcosystemOrg["size"], number> = { S: 2.2, M: 3.2, L: 4.2 };

export function EcosystemGraph({
  filters,
  selectedId,
  onSelect,
}: {
  filters?: GraphFilters;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const visible = useMemo(() => {
    return ORGS.filter((o) => {
      if (filters?.types && filters.types.length > 0 && !filters.types.includes(o.type)) return false;
      if (filters?.region && filters.region !== "all" && o.region !== filters.region) return false;
      if (filters?.onlyRisk && o.risk <= 0.5) return false;
      return true;
    });
  }, [filters]);

  const visibleIds = useMemo(() => new Set(visible.map((o) => o.id)), [visible]);

  const edges = useMemo(() => {
    return EDGES.filter((e) => {
      if (!visibleIds.has(e.from) || !visibleIds.has(e.to)) return false;
      if (filters?.onlyMissingEvidence && e.evidenceCount > 0) return false;
      return true;
    });
  }, [visibleIds, filters?.onlyMissingEvidence]);

  const map = useMemo(() => Object.fromEntries(ORGS.map((n) => [n.id, n])), []);

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="gbg" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        <filter id="gglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="100" height="100" fill="url(#gbg)" />

      {/* Edges */}
      {edges.map((e, i) => {
        const A = map[e.from]; const B = map[e.to];
        if (!A || !B) return null;
        const missing = e.evidenceCount === 0;
        const stroke =
          e.kind === "verification" ? "#34d399" :
          e.kind === "partnership"  ? "#a78bfa" :
                                       "#64748b";
        return (
          <line
            key={i}
            x1={A.x} y1={A.y} x2={B.x} y2={B.y}
            stroke={stroke}
            strokeOpacity={missing ? 0.55 : 0.3 + e.strength * 0.45}
            strokeWidth={0.18 + e.strength * 0.45}
            strokeDasharray={missing ? "0.8 0.8" : undefined}
          />
        );
      })}

      {/* Nodes */}
      {visible.map((n) => {
        const r = SIZE_R[n.size];
        const isSel = selectedId === n.id;
        const high = n.risk > 0.6;
        return (
          <g key={n.id} filter="url(#gglow)" className="cursor-pointer" onClick={() => onSelect?.(n.id)}>
            {high && (
              <circle cx={n.x} cy={n.y} r={r + 1.4} fill="none" stroke="#f43f5e" strokeOpacity={0.55} strokeWidth={0.35} />
            )}
            <circle
              cx={n.x} cy={n.y} r={r}
              fill={TYPE_COLOR[n.type]}
              opacity={0.35 + n.confidence * 0.55}
            />
            <circle cx={n.x} cy={n.y} r={r * 0.45} fill={TYPE_COLOR[n.type]} />
            {isSel && (
              <circle cx={n.x} cy={n.y} r={r + 0.8} fill="none" stroke="#fff" strokeWidth={0.35} />
            )}
            <text
              x={n.x} y={n.y + r + 2.2}
              textAnchor="middle"
              fontSize="1.7"
              fill="#e2e8f0"
              style={{ fontWeight: 500, pointerEvents: "none" }}
            >
              {n.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export { TYPE_COLOR };
