import type { Entity } from "../types";
import { KPI_LIBRARY, HEADLINE_KPI_IDS, type KpiDef } from "./kpi-library";
import { COMPANY_BENCHMARK, type BenchmarkRow } from "./company-benchmark";
import { getConfidenceBand, confidenceClasses, CONFIDENCE_BANDS, type ConfidenceBand } from "./confidence-rules";
import { NIKE_KPI_OVERRIDES } from "../nike";

export { KPI_LIBRARY, HEADLINE_KPI_IDS, COMPANY_BENCHMARK, CONFIDENCE_BANDS, getConfidenceBand, confidenceClasses };
export type { KpiDef, BenchmarkRow, ConfidenceBand };

const ENTITY_KPI_OVERRIDES: Record<string, typeof NIKE_KPI_OVERRIDES> = {
  "gch-nike": NIKE_KPI_OVERRIDES,
};

export interface EntityKpi {
  kpi: KpiDef;
  value: number;        // normalized numeric value
  displayValue: string; // formatted with unit
  confidence: number;   // 0-100
  band: ConfidenceBand;
  source: string;
  reported: boolean;    // false if not reported / missing
}

function seedFn(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

// Bias profile that nudges KPI numbers based on entity type / tier / certs.
function entityBias(e: Entity) {
  const certBoost = Math.min(20, e.certifications.length * 4);
  const tierMap: Record<string, number> = {
    "Tier 0": 6, "Tier 1": 4, "Tier 2": 2, "Tier 3": 0, "Tier 4": -2,
  };
  const matBoost = Math.min(10, e.materials.length * 2);
  return {
    climate: certBoost + (tierMap[e.actorType] ?? 0),
    materials: matBoost + certBoost,
    traceability: certBoost + (tierMap[e.actorType] ?? 0) * 2,
    social: certBoost,
    quality: certBoost,
  };
}

function categoryBucket(cat: string): keyof ReturnType<typeof entityBias> {
  switch (cat) {
    case "Climate": return "climate";
    case "Water": case "Chemicals": case "Waste": return "climate";
    case "Materials": return "materials";
    case "Traceability": case "Regulatory": return "traceability";
    case "Social": case "Risk": return "social";
    case "Data Quality": default: return "quality";
  }
}

function fmt(v: number, unit: string): string {
  if (unit.includes("0-100")) return v.toFixed(0);
  if (unit.includes("%")) return `${v.toFixed(0)}%`;
  if (unit.includes("tCO2e")) return `${Math.round(v).toLocaleString()} tCO2e`;
  return `${v.toFixed(0)} ${unit}`;
}

export function getKpisForEntity(e: Entity): EntityKpi[] {
  const rand = seedFn(e.id + ":kpi");
  const bias = entityBias(e);

  return KPI_LIBRARY.map((kpi) => {
    // Each entity reports ~80% of KPIs; rest are missing.
    const reported = rand() > 0.18;
    const bucket = bias[categoryBucket(kpi.category)];
    // Base value 35..78 nudged by bias and KPI priority.
    const base = 35 + rand() * 43 + bucket + (kpi.priority === "High" ? 4 : 0);
    const value = Math.max(0, Math.min(100, Math.round(base)));
    const confidence = Math.max(15, Math.min(96, Math.round(40 + rand() * 50 + bucket * 0.5)));
    const band = getConfidenceBand(confidence);
    return {
      kpi,
      value,
      displayValue: reported ? fmt(value, kpi.unit) : "—",
      confidence: reported ? confidence : 0,
      band: reported ? band : getConfidenceBand(0),
      source: reported ? "Reported by org" : "Not reported",
      reported,
    };
  });
}

export function getHeadlineKpis(e: Entity): EntityKpi[] {
  const all = getKpisForEntity(e);
  return HEADLINE_KPI_IDS.map((id) => all.find((k) => k.kpi.id === id)).filter(Boolean) as EntityKpi[];
}

export interface SectorBenchmark {
  kpiId: string;
  kpiName: string;
  unit: string;
  values: { company: string; value: number; raw: string; confidence: number; sourceUrl: string }[];
  min: number;
  max: number;
  median: number;
}

export function getSectorBenchmark(kpiId: string): SectorBenchmark | null {
  const rows = COMPANY_BENCHMARK.filter((r) => r.kpiId === kpiId);
  const numeric = rows
    .map((r) => ({ row: r, n: parseFloat(String(r.normalizedValue).replace(/[^0-9.\-]/g, "")) }))
    .filter((x) => !isNaN(x.n));
  if (numeric.length === 0) return null;
  const vals = numeric.map((x) => x.n).sort((a, b) => a - b);
  const median = vals[Math.floor(vals.length / 2)];
  return {
    kpiId,
    kpiName: rows[0].kpiName,
    unit: rows[0].unit,
    values: numeric.map((x) => ({
      company: x.row.company, value: x.n, raw: x.row.reportedValue,
      confidence: x.row.confidence, sourceUrl: x.row.sourceUrl,
    })),
    min: vals[0], max: vals[vals.length - 1], median,
  };
}

export function getAvgConfidence(e: Entity): number {
  const ks = getKpisForEntity(e).filter((k) => k.reported);
  if (!ks.length) return 0;
  return Math.round(ks.reduce((a, k) => a + k.confidence, 0) / ks.length);
}

export function getKpiCoverage(e: Entity): number {
  const ks = getKpisForEntity(e);
  return Math.round((ks.filter((k) => k.reported).length / ks.length) * 100);
}
