export const ORG_TYPES = [
  "Brand",
  "Retailer",
  "Manufacturer",
  "Farmer",
  "Ginner",
  "Spinner",
  "Weaver",
  "Knitter",
  "Fabric Mill",
  "Dye House / Processing",
  "Printing Unit",
  "Garment Factory",
  "Trims & Accessories Supplier",
  "Trader / Agent",
  "Recycler",
  "Logistics Provider",
  "Certification Body",
  "Auditor / Inspection Body",
  "NGO / Non-profit",
  "Government / Regulator",
  "Industry Association",
  "Research / Academia",
  "Technology Provider",
  "Sustainability Partner",
  "Other",
] as const;

export const MANUFACTURER_TYPES = new Set<string>([
  "Manufacturer",
  "Farmer",
  "Ginner",
  "Spinner",
  "Weaver",
  "Knitter",
  "Fabric Mill",
  "Dye House / Processing",
  "Printing Unit",
  "Garment Factory",
  "Trims & Accessories Supplier",
  "Recycler",
]);

export const BRAND_TYPES = new Set<string>(["Brand", "Retailer", "Trader / Agent"]);

/**
 * True when the organization makes or supplies physical goods, i.e. it can
 * publish sample products in the showroom.
 */
export function isManufacturerOrg(org: {
  organizationType?: string | null;
  entityType?: string | null;
}): boolean {
  const candidates = [org.organizationType, org.entityType].filter(Boolean) as string[];
  if (candidates.some((c) => MANUFACTURER_TYPES.has(c))) return true;
  return candidates.some((c) =>
    /manufact|farm|gin|spin|weav|knit|mill|dye|print|garment|trims|recycl/i.test(c),
  );
}

export const SPECIALIZATION_SUGGESTIONS: Record<string, string[]> = {
  Brand: [
    "Sportswear",
    "Womenswear",
    "Menswear",
    "Kidswear",
    "Denim",
    "Luxury",
    "Fast fashion",
    "Outdoor",
    "Loungewear",
    "Footwear",
  ],
  Retailer: ["Multi-brand", "Private label", "E-commerce", "Department store"],
  Manufacturer: ["Knitwear", "Denim", "Activewear", "Outerwear", "Home textiles"],
  "Garment Factory": [
    "Knitwear",
    "Denim",
    "Activewear",
    "Outerwear",
    "T-shirts",
    "Formalwear",
    "Underwear",
  ],
  "Fabric Mill": ["Denim", "Jersey Knits", "Woven", "Performance Fabrics", "Selvedge"],
  "Dye House / Processing": ["Reactive Dyeing", "Indigo", "Pigment", "Digital Print"],
  "Printing Unit": ["Screen Print", "Digital Print", "Sublimation"],
  Spinner: ["Ring-spun", "Open-end", "Compact", "Organic"],
  Weaver: ["Denim", "Shirting", "Bottomweight"],
  Knitter: ["Circular Knit", "Flat Knit", "Seamless"],
  Ginner: ["Organic Cotton", "BCI Cotton", "Recycled Cotton"],
  Farmer: ["Organic", "Regenerative", "Fair Trade", "BCI"],
  Recycler: ["Mechanical Recycling", "Chemical Recycling", "Textile Waste Collection"],
  "Trims & Accessories Supplier": ["Buttons", "Zippers", "Labels", "Packaging"],
  "Logistics Provider": ["Ocean Freight", "Air Freight", "Warehousing", "Customs"],
  "Sustainability Partner": ["Traceability", "Carbon Accounting", "Audit", "LCA"],
  "Certification Body": ["GOTS", "OEKO-TEX", "GRS", "Social Audit"],
  "Auditor / Inspection Body": ["Social Audit", "Quality Inspection", "Environmental Audit"],
  "NGO / Non-profit": ["Worker Rights", "Environment", "Capacity Building"],
  "Government / Regulator": ["Trade Policy", "Compliance", "Export Promotion"],
  "Industry Association": ["Advocacy", "Standards", "Training"],
  "Research / Academia": ["Material Science", "Circularity", "Policy Research"],
  "Technology Provider": ["Traceability", "ERP", "AI / Analytics", "Digital Product Passport"],
};
