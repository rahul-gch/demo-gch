export interface NormalizationEntry {
  term: string;
  kpi: string;
  notes: string;
  examples: string;
}

export const NORMALIZATION_MAP: NormalizationEntry[] = [
  {
    term: "preferred materials",
    kpi: "Certified / preferred material share",
    notes:
      "Company definitions differ; GCH should store the source definition and standardize sub-types.",
    examples: "H&M, Primark, Patagonia, M&S",
  },
  {
    term: "recycled or sustainably sourced",
    kpi: "Certified / preferred material share",
    notes: "May combine recycled, organic, certified, responsible sourcing. Split where possible.",
    examples: "H&M, Primark",
  },
  {
    term: "recycled polyester",
    kpi: "Recycled material share",
    notes: "Material-specific: polyester only, not total materials.",
    examples: "Adidas",
  },
  {
    term: "strategic finished goods suppliers",
    kpi: "Supplier coverage subset",
    notes: "Not all suppliers; boundary must be stored.",
    examples: "Nike",
  },
  {
    term: "core Tier 1 / Tier 2 factories",
    kpi: "Supplier KPI coverage",
    notes: "Boundary metadata: core suppliers, excluded entities, time period/extrapolation.",
    examples: "PUMA",
  },
  {
    term: "brand partners with SBTs",
    kpi: "Partner climate maturity",
    notes: "Marketplace/platform model; not equivalent to factory decarbonization.",
    examples: "Zalando",
  },
  {
    term: "supply-chain environmental transformation plan",
    kpi: "Supplier environmental KPI program",
    notes: "Policy/program maturity; not necessarily performance result.",
    examples: "Inditex",
  },
];
