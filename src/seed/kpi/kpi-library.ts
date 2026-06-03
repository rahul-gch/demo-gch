// Source: GCH_Benchmark_KPI_Intelligence_Dataset_v0.1 / KPI_Library
export type KpiCategory =
  | "Climate" | "Materials" | "Traceability" | "Social"
  | "Water" | "Chemicals" | "Waste" | "Regulatory" | "Risk" | "Data Quality";

export interface KpiDef {
  id: string;
  name: string;
  category: KpiCategory;
  definition: string;
  unit: string;
  priority: "High" | "Medium" | "Low";
  confidenceRule: string;
}

export const KPI_LIBRARY: KpiDef[] = [
  { id: "KPI001", name: "Scope 1 & 2 emissions reduction", category: "Climate", unit: "% reduction", priority: "Medium", definition: "Absolute or intensity reduction in direct and purchased energy emissions versus a baseline.", confidenceRule: "High if assured report/CDP; medium if report only" },
  { id: "KPI002", name: "Scope 3 emissions reduction", category: "Climate", unit: "% reduction / tCO2e", priority: "High", definition: "Reduction in value-chain emissions, preferably split by purchased goods, transport, manufacturing, use/end-of-life.", confidenceRule: "Medium unless operational evidence exists" },
  { id: "KPI003", name: "Recycled material share", category: "Materials", unit: "%", priority: "High", definition: "Share of material input or products containing recycled materials.", confidenceRule: "High if certificate/product linked; medium if company report" },
  { id: "KPI004", name: "Certified / preferred material share", category: "Materials", unit: "%", priority: "High", definition: "Share of material input that is certified, preferred, organic, regenerative, responsibly sourced or otherwise defined by company policy.", confidenceRule: "Medium until GCH standardizes definitions" },
  { id: "KPI005", name: "Tier 1 supplier visibility", category: "Traceability", unit: "%", priority: "High", definition: "Percentage of direct finished-goods suppliers mapped/disclosed/known.", confidenceRule: "High if supplier list/facility data uploaded" },
  { id: "KPI006", name: "Tier 2 supplier visibility", category: "Traceability", unit: "%", priority: "High", definition: "Percentage of mills, laundries, dye houses, material suppliers mapped/disclosed/known.", confidenceRule: "Medium; often incomplete in reports" },
  { id: "KPI007", name: "Traceability completeness score", category: "Traceability", unit: "0-100", priority: "High", definition: "Composite score measuring how complete the chain is from raw material to brand/product.", confidenceRule: "Calculated with explicit missing-data penalty" },
  { id: "KPI008", name: "Supplier audit score", category: "Social", unit: "0-100", priority: "High", definition: "Normalized social/environmental audit score for factory/facility.", confidenceRule: "High if audit uploaded; medium if report aggregated" },
  { id: "KPI009", name: "Corrective action closure rate", category: "Social", unit: "%", priority: "High", definition: "Share of audit findings closed by due date.", confidenceRule: "High with CAP tracker; medium if aggregated" },
  { id: "KPI010", name: "Renewable electricity at supplier", category: "Climate", unit: "%", priority: "Medium", definition: "Share of supplier/facility electricity consumption from renewable sources.", confidenceRule: "Medium unless facility evidence exists" },
  { id: "KPI011", name: "Water use / wet processing reduction", category: "Water", unit: "% or L/kg", priority: "High", definition: "Reduction or intensity in freshwater/water use in wet processing or material manufacturing.", confidenceRule: "Medium unless facility/process data verified" },
  { id: "KPI012", name: "Chemical compliance", category: "Chemicals", unit: "% / pass-fail", priority: "Medium", definition: "Compliance with MRSL/RSL/ZDHC requirements or chemical inventory completeness.", confidenceRule: "High if third-party verified; low if missing CAS/volume" },
  { id: "KPI013", name: "Waste diverted from landfill", category: "Waste", unit: "%", priority: "Medium", definition: "Share of operational waste diverted from landfill/reused/recycled.", confidenceRule: "Medium if report only; high if facility evidence" },
  { id: "KPI014", name: "DPP readiness score", category: "Regulatory", unit: "0-100", priority: "High", definition: "Composite readiness for digital product passport data requirements.", confidenceRule: "GCH-calculated confidence score" },
  { id: "KPI015", name: "Certificate expiry risk", category: "Risk", unit: "% / count", priority: "High", definition: "Share of required certificates expired or expiring within defined period.", confidenceRule: "High if certificate uploaded" },
  { id: "KPI016", name: "Verified vs self-declared data share", category: "Data Quality", unit: "%", priority: "High", definition: "Share of KPI inputs backed by third-party or document evidence vs declarations/estimates.", confidenceRule: "GCH confidence engine output" },
  { id: "KPI017", name: "Supplier data response rate", category: "Data Quality", unit: "%", priority: "Medium", definition: "Share of suppliers responding to data requests within period.", confidenceRule: "High if platform workflow exists" },
  { id: "KPI018", name: "High-risk supplier exposure", category: "Risk", unit: "% spend/volume", priority: "High", definition: "Share of spend/volume linked to suppliers with high country/audit/environmental risk.", confidenceRule: "GCH-calculated; depends on PO data" },
];

export const HEADLINE_KPI_IDS = ["KPI001", "KPI002", "KPI003", "KPI005"];

export function getKpiDef(id: string): KpiDef | undefined {
  return KPI_LIBRARY.find((k) => k.id === id);
}
