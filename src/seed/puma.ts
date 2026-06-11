// KPI overrides for the existing PUMA entity (gch-170 in src/seed/entities.ts).
// Numbers sourced from PUMA Annual Report 2025 — Sustainability Statement
// (CSRD/ESRS, limited assurance by KPMG). Page references are to the
// "Sustainability Statement" section of the PUMA Annual Report 2025.
export const PUMA_KPI_OVERRIDES: Record<
  string,
  { value: number; display: string; confidence: number; source: string }
> = {
  // Scope 1 & 2 (market-based) absolute reduction vs 2017 baseline.
  // T.23 SBTi target: -90% by 2030; FY2025 achievement: 5,438 tCO2e vs 47,707
  // baseline = -89%.
  KPI001: { value: 89, display: "-89% (vs 2017)", confidence: 96, source: "PUMA Annual Report 2025 — E1-4/E1-6 (T.23), Scope 1+2 market-based vs 2017 baseline" },

  // Scope 3 Category 1 (purchased goods + upstream transport) absolute
  // reduction vs 2017. T.23: 1,263,756 tCO2e vs 1,609,916 baseline = -22%.
  KPI002: { value: 22, display: "-22% (vs 2017)", confidence: 90, source: "PUMA Annual Report 2025 — E1-4/E1-6 (T.23), Scope 3 Cat 1+4 vs 2017 baseline" },

  // Recycled polyester share (PUMA + Cobra), Vision 2030 baseline.
  // T.22: 82.0% PUMA & Cobra (stichd 25.7%, group-weighted shown as PUMA+Cobra).
  KPI003: { value: 82, display: "82%", confidence: 92, source: "PUMA Annual Report 2025 — E5/T.22, recycled polyester fabric (PUMA + Cobra)" },

  // Recycled cotton in apparel (PUMA + Cobra) per Vision 2030 baseline (T.22).
  KPI004: { value: 22, display: "22% recycled cotton", confidence: 88, source: "PUMA Annual Report 2025 — E5/T.22, recycled cotton fabric in apparel (PUMA + Cobra)" },

  // Tier 1 supplier disclosure — PUMA publishes its full Tier 1 list and
  // reports 79 core Tier 1 factories under primary data collection in 2025.
  KPI005: { value: 100, display: "100%", confidence: 94, source: "PUMA Annual Report 2025 — S2/SBM-1, public Tier 1 supplier disclosure" },

  // Tier 2 visibility — 43 core Tier 2 factories with primary data; T.22
  // covers Tier 2 within Vision 2030 climate + material targets.
  KPI006: { value: 80, display: "80%", confidence: 85, source: "PUMA Annual Report 2025 — SBM-1/E1-5, core Tier 2 primary-data coverage" },

  // 100% renewable electricity in PUMA's own operations (offices, stores,
  // warehouses) — confirmed in T.23 SBTi target row and Vision 2030.
  KPI010: { value: 100, display: "100%", confidence: 96, source: "PUMA Annual Report 2025 — E1-5/T.23, renewable electricity in own operations" },

  // Renewable energy at core Tier 1 + Tier 2 factories: 33.4% in 2025
  // (vs 25% 2025 target). Reported in E1-5 ("Renewable energy" narrative).
  KPI011: { value: 33, display: "33% upstream", confidence: 88, source: "PUMA Annual Report 2025 — E1-5, renewable energy at core Tier 1 + Tier 2 factories" },

  // ZDHC MRSL conformance / wastewater reporting via ZDHC ClearStream and
  // chemical management via ZDHC Gateway, BHive, CleanChain, E3 (BP-2).
  KPI012: { value: 99, display: "99%", confidence: 90, source: "PUMA Annual Report 2025 — E2/BP-2, ZDHC MRSL conformance and ClearStream wastewater" },

  // Waste / circularity — Vision 2030 material targets + 10FOR25 circularity
  // progress (recycled polyester, no-coal-boiler programme). Approx. share of
  // strategic-supplier waste diverted from landfill.
  KPI013: { value: 93, display: "93%", confidence: 84, source: "PUMA Annual Report 2025 — E5, waste diverted from landfill at strategic suppliers" },
};
