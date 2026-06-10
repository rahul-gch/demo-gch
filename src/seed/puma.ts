// KPI overrides for the existing PUMA entity (gch-170 in src/seed/entities.ts).
// Numbers sourced from PUMA Annual Report 2025 (Sustainability Statement, ESRS-aligned).
export const PUMA_KPI_OVERRIDES: Record<
  string,
  { value: number; display: string; confidence: number; source: string }
> = {
  KPI001: { value: 90, display: "90% reduction", confidence: 95, source: "PUMA Annual Report 2025 — Scope 1 & 2 vs 2017 baseline" },
  KPI002: { value: 25, display: "25% reduction", confidence: 86, source: "PUMA Annual Report 2025 — Scope 3 vs 2017 baseline" },
  KPI003: { value: 62, display: "62%", confidence: 88, source: "PUMA Annual Report 2025 — Recycled polyester share" },
  KPI004: { value: 99, display: "99%", confidence: 92, source: "PUMA Annual Report 2025 — More sustainable cotton (Better Cotton / organic / recycled)" },
  KPI005: { value: 100, display: "100%", confidence: 94, source: "PUMA Annual Report 2025 — Public Tier 1 supplier list" },
  KPI006: { value: 78, display: "78%", confidence: 84, source: "PUMA Annual Report 2025 — Tier 2 supplier visibility" },
  KPI010: { value: 100, display: "100%", confidence: 95, source: "PUMA Annual Report 2025 — Renewable electricity in core suppliers" },
  KPI012: { value: 99, display: "99%", confidence: 90, source: "PUMA Annual Report 2025 — ZDHC MRSL conformance" },
  KPI013: { value: 93, display: "93%", confidence: 88, source: "PUMA Annual Report 2025 — Waste diverted from landfill at strategic suppliers" },
};
