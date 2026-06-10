// KPI overrides for the existing Zalando entity (gch-123 in src/seed/entities.ts).
// Numbers sourced from Zalando SE Sustainability Progress Report 2023 and
// the Zalando SE CSRD Digest 2024 (corporate.zalando.com).
export const ZALANDO_KPI_OVERRIDES: Record<
  string,
  { value: number; display: string; confidence: number; source: string }
> = {
  KPI001: { value: 80, display: "80% reduction", confidence: 92, source: "Zalando CSRD Digest 2024 — Scope 1 & 2 vs 2017 baseline" },
  KPI002: { value: 15, display: "15% reduction", confidence: 80, source: "Zalando CSRD Digest 2024 — Scope 3 vs 2017 baseline" },
  KPI003: { value: 30, display: "30%", confidence: 82, source: "Zalando 2023 Progress — Recycled material share (private labels)" },
  KPI004: { value: 60, display: "60%", confidence: 84, source: "Zalando 2023 Progress — Preferred / certified materials in private labels" },
  KPI005: { value: 100, display: "100%", confidence: 92, source: "Zalando 2023 — Public Tier 1 private-label supplier list" },
  KPI006: { value: 65, display: "65%", confidence: 80, source: "Zalando 2024 — Tier 2 visibility (Fashion Leap & factory programme)" },
  KPI008: { value: 86, display: "86/100", confidence: 84, source: "Zalando 2024 — SDI / supplier sustainability audit average" },
  KPI010: { value: 100, display: "100%", confidence: 94, source: "Zalando 2023 — Renewable electricity in operations" },
  KPI016: { value: 92, display: "92%", confidence: 90, source: "Zalando CSRD Digest 2024 — Verified vs self-declared data share" },
};
