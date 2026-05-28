import { useMemo } from "react";

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  cluster: "core" | "partner" | "prospect" | "risk";
  confidence: number;
};

const NODES: Node[] = [
  { id: "n1", label: "Acme Corp", x: 50, y: 50, r: 26, cluster: "core", confidence: 0.94 },
  { id: "n2", label: "Northwind", x: 22, y: 30, r: 16, cluster: "partner", confidence: 0.82 },
  { id: "n3", label: "Globex", x: 78, y: 28, r: 18, cluster: "partner", confidence: 0.71 },
  { id: "n4", label: "Initech", x: 18, y: 70, r: 14, cluster: "prospect", confidence: 0.58 },
  { id: "n5", label: "Umbrella", x: 80, y: 75, r: 20, cluster: "risk", confidence: 0.39 },
  { id: "n6", label: "Soylent", x: 35, y: 82, r: 12, cluster: "prospect", confidence: 0.62 },
  { id: "n7", label: "Tyrell", x: 65, y: 15, r: 13, cluster: "partner", confidence: 0.77 },
  { id: "n8", label: "Wayne Ent.", x: 90, y: 50, r: 14, cluster: "prospect", confidence: 0.66 },
  { id: "n9", label: "Stark Ind.", x: 10, y: 50, r: 14, cluster: "partner", confidence: 0.81 },
  { id: "n10", label: "Hooli", x: 50, y: 88, r: 11, cluster: "risk", confidence: 0.44 },
];

const EDGES: [string, string, number][] = [
  ["n1", "n2", 0.9], ["n1", "n3", 0.85], ["n1", "n4", 0.5], ["n1", "n5", 0.35],
  ["n1", "n7", 0.78], ["n1", "n9", 0.8], ["n1", "n8", 0.6], ["n2", "n9", 0.55],
  ["n3", "n7", 0.7], ["n3", "n8", 0.5], ["n4", "n6", 0.45], ["n5", "n10", 0.6],
  ["n6", "n10", 0.4], ["n8", "n5", 0.3],
];

const clusterColor: Record<Node["cluster"], string> = {
  core: "var(--graph-core)",
  partner: "var(--graph-partner)",
  prospect: "var(--graph-prospect)",
  risk: "var(--graph-risk)",
};

export function EcosystemGraph() {
  const map = useMemo(() => Object.fromEntries(NODES.map((n) => [n.id, n])), []);
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="var(--graph-bg-inner)" />
          <stop offset="100%" stopColor="var(--graph-bg-outer)" />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="100" height="100" fill="url(#bg)" />
      {EDGES.map(([a, b, w], i) => {
        const A = map[a], B = map[b];
        return (
          <line
            key={i}
            x1={A.x} y1={A.y} x2={B.x} y2={B.y}
            stroke="var(--graph-edge)"
            strokeOpacity={0.25 + w * 0.5}
            strokeWidth={0.25 + w * 0.4}
          />
        );
      })}
      {NODES.map((n) => (
        <g key={n.id} filter="url(#glow)">
          <circle
            cx={n.x} cy={n.y} r={n.r / 8}
            fill={clusterColor[n.cluster]}
            opacity={0.35 + n.confidence * 0.5}
          />
          <circle
            cx={n.x} cy={n.y} r={n.r / 14}
            fill={clusterColor[n.cluster]}
          />
          <text
            x={n.x} y={n.y + n.r / 8 + 2.4}
            textAnchor="middle"
            fontSize="1.8"
            fill="var(--graph-label)"
            style={{ fontWeight: 500 }}
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
