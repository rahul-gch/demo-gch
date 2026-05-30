import { useMemo } from "react";
import { ORGS, EDGES, type EcosystemOrg, type OrgType } from "@/lib/ecosystem-data";

export type GraphFilters = {
  types?: OrgType[];
  region?: string | "all";
  onlyRisk?: boolean;
  onlyMissingEvidence?: boolean;
};

const TYPE_COLOR: Record<OrgType, string> = {
  brand:     "#f59e0b",
  supplier:  "#38bdf8",
  verifier:  "#34d399",
  regulator: "#a78bfa",
};

const SIZE_R: Record<EcosystemOrg["size"], number> = { S: 1.4, M: 1.9, L: 2.4 };

// Curated 6-node anchor set for the calm "core" view
const CORE_IDS = ["acme", "lumon", "northwind", "tyrell", "starkv", "ngo1"] as const;
const CORE_POS: Record<string, { x: number; y: number }> = {
  acme:      { x: 50, y: 52 },
  lumon:     { x: 24, y: 38 },
  northwind: { x: 40, y: 26 },
  tyrell:    { x: 70, y: 30 },
  starkv:    { x: 76, y: 60 },
  ngo1:      { x: 46, y: 78 },
};

export function EcosystemGraph({
  filters,
  selectedId,
  onSelect,
  coreOnly = false,
}: {
  filters?: GraphFilters;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  coreOnly?: boolean;
}) {
  const visible = useMemo(() => {
    const base = coreOnly
      ? ORGS.filter((o) => (CORE_IDS as readonly string[]).includes(o.id))
                .map((o) => ({ ...o, ...CORE_POS[o.id] }))
      : ORGS;
    return base.filter((o) => {
      if (filters?.types && filters.types.length > 0 && !filters.types.includes(o.type)) return false;
      if (filters?.region && filters.region !== "all" && o.region !== filters.region) return false;
      if (filters?.onlyRisk && o.risk <= 0.5) return false;
      return true;
    });
  }, [filters, coreOnly]);

  const visibleIds = useMemo(() => new Set(visible.map((o) => o.id)), [visible]);

  const edges = useMemo(() => {
    return EDGES.filter((e) => {
      if (!visibleIds.has(e.from) || !visibleIds.has(e.to)) return false;
      if (filters?.onlyMissingEvidence && e.evidenceCount > 0) return false;
      return true;
    });
  }, [visibleIds, filters?.onlyMissingEvidence]);

  const map = useMemo(
    () => Object.fromEntries(visible.map((n) => [n.id, n])),
    [visible],
  );

  const labelFont = coreOnly ? 1.6 : 1.4;

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="gbg" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        <filter id="gglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.35" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glabel" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="0.4" floodColor="#020617" floodOpacity="0.95" />
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
            strokeOpacity={missing ? 0.45 : 0.25 + e.strength * 0.35}
            strokeWidth={0.12 + e.strength * 0.3}
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
          <g key={n.id} className="cursor-pointer" onClick={() => onSelect?.(n.id)}>
            {high && (
              <circle cx={n.x} cy={n.y} r={r + 1.1} fill="none" stroke="#f43f5e" strokeOpacity={0.55} strokeWidth={0.25} />
            )}
            <g filter="url(#gglow)">
              <circle
                cx={n.x} cy={n.y} r={r}
                fill={TYPE_COLOR[n.type]}
                opacity={0.4 + n.confidence * 0.5}
              />
              <circle cx={n.x} cy={n.y} r={r * 0.45} fill={TYPE_COLOR[n.type]} />
            </g>
            {isSel && (
              <circle cx={n.x} cy={n.y} r={r + 0.7} fill="none" stroke="#fff" strokeWidth={0.3} />
            )}
            <text
              x={n.x} y={n.y + r + 2.1}
              textAnchor="middle"
              fontSize={labelFont}
              fill="#cbd5e1"
              filter="url(#glabel)"
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
