/**
 * Single source of truth for Global Chain Hub entity types, their onboarding
 * questionnaires, and the weighting used to score a profile.
 *
 * Every field carries a `bucket` (scoring category) and, when the answer maps
 * onto an existing `orgs` column, a `column` key so the value keeps powering
 * the directory, matchmaking and settings screens. Answers without a column
 * live in `orgs.profile_answers` keyed by field id.
 */

export const ENTITY_TYPES = [
  "Seed",
  "Farmer",
  "Research Institute",
  "Ginner",
  "Spinner",
  "Mill",
  "Dye House",
  "Supplier",
  "Trims / Accessories",
  "Agent",
  "Recycling Company",
  "Manufacturer",
  "Brand",
  "Retailer",
  "Logistics",
  "Certifier",
  "Auditor",
  "NGO",
  "Government",
  "Investor",
  "Clothing Banks",
] as const;

export type EntityTypeName = (typeof ENTITY_TYPES)[number];

/** New registrations exclude retired choices; existing records keep their definitions. */
export const SIGNUP_ENTITY_TYPES = ENTITY_TYPES.filter((type) => type !== "Seed" && type !== "Supplier");

/** Older / imported type labels mapped onto canonical entity types. */
const LEGACY_TYPE_MAP: Record<string, EntityTypeName> = {
  "fabric mill": "Mill",
  mill: "Mill",
  "garment factory": "Manufacturer",
  manufacturer: "Manufacturer",
  "dye house / processing": "Dye House",
  "dye house": "Dye House",
  "printing unit": "Dye House",
  knitter: "Mill",
  weaver: "Mill",
  spinner: "Spinner",
  ginner: "Ginner",
  farmer: "Farmer",
  seed: "Seed",
  brand: "Brand",
  retailer: "Retailer",
  "trader / agent": "Agent",
  agent: "Agent",
  "trims & accessories supplier": "Trims / Accessories",
  "trims / accessories": "Trims / Accessories",
  "trims & accessories": "Trims / Accessories",
  supplier: "Supplier",
  recycler: "Recycling Company",
  "recycling company": "Recycling Company",
  "recycling companies": "Recycling Company",
  "clothing banks": "Clothing Banks",
  "logistics provider": "Logistics",
  logistics: "Logistics",
  "certification body": "Certifier",
  certifier: "Certifier",
  "auditor / inspection body": "Auditor",
  auditor: "Auditor",
  "ngo / non-profit": "NGO",
  ngo: "NGO",
  "government / regulator": "Government",
  government: "Government",
  "research / academia": "Research Institute",
  "research institute": "Research Institute",
  "technology provider": "Research Institute",
  "sustainability partner": "NGO",
  "industry association": "NGO",
  investor: "Investor",
};

export function normalizeEntityType(raw: string | undefined | null): EntityTypeName {
  const key = (raw ?? "").trim().toLowerCase();
  return LEGACY_TYPE_MAP[key] ?? "Supplier";
}

export type Bucket =
  | "basic"
  | "offering"
  | "capabilities"
  | "capacity"
  | "markets"
  | "certifications"
  | "sustainability"
  | "needs";

export const BUCKET_LABELS: Record<Bucket, string> = {
  basic: "About your organization",
  offering: "What you offer",
  capabilities: "Your capabilities",
  capacity: "Capacity, MOQ & lead time",
  markets: "Markets & locations",
  certifications: "Certifications & verification",
  sustainability: "Sustainability",
  needs: "What you're looking for",
};

export const BUCKET_ORDER: Bucket[] = [
  "basic",
  "offering",
  "capabilities",
  "capacity",
  "markets",
  "certifications",
  "sustainability",
  "needs",
];

export type FieldKind = "text" | "textarea" | "number" | "single" | "multi" | "locations";

/** Org columns an answer can be mirrored into. */
export type OrgColumn =
  | "materials"
  | "capabilities"
  | "certifications"
  | "productCategories"
  | "productTypes"
  | "specializations"
  | "capacity"
  | "moq"
  | "leadTimeDays";

export interface ProfileField {
  id: string;
  label: string;
  kind: FieldKind;
  bucket: Bucket;
  options?: string[];
  placeholder?: string;
  suffix?: string;
  column?: OrgColumn;
}

export interface EntityProfileDef {
  fields: ProfileField[];
  /** Bucket weights (sum normalized at scoring time). */
  weights: Partial<Record<Bucket, number>>;
}

/* ---------------------------------- option pools --------------------------------- */

const YES_NO = ["Yes", "No"];
const ORGANIC = ["Organic", "Conventional", "Both"];
const CERTS = [
  "GOTS",
  "OEKO-TEX",
  "GRS",
  "RCS",
  "Fairtrade",
  "BCI",
  "OCS",
  "ISO 9001",
  "ISO 14001",
  "SA8000",
  "BSCI",
  "WRAP",
  "Cradle to Cradle",
  "Other",
];
const MATERIALS = [
  "Cotton",
  "Organic cotton",
  "Recycled cotton",
  "Polyester",
  "Recycled polyester",
  "Wool",
  "Linen",
  "Hemp",
  "Viscose",
  "Lyocell / Tencel",
  "Silk",
  "Nylon",
  "Elastane",
  "Leather",
  "Blends",
];
/** Merges option lists, keeping order and skipping case-insensitive duplicates. */
export function mergeOptions(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const o of lists.flat()) {
    const k = o.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(o);
  }
  return out;
}

const PRODUCT_CATEGORIES = [
  "T-shirts",
  "Knitwear",
  "Denim",
  "Outerwear",
  "Activewear",
  "Underwear",
  "Formalwear",
  "Kidswear",
  "Home textiles",
  "Footwear",
  "Accessories",
];
const REGIONS = [
  "Europe",
  "North America",
  "South America",
  "Africa",
  "Middle East",
  "South Asia",
  "Southeast Asia",
  "East Asia",
  "Oceania",
];
const PARTNER_TYPES = [...ENTITY_TYPES] as string[];
const SUSTAINABILITY = [
  "Renewable energy",
  "Water recycling",
  "Chemical management (ZDHC)",
  "Carbon measurement",
  "Waste reduction",
  "Living wage programme",
  "Circular / take-back",
  "Traceability system",
];

/* Shared field builders */
const fCerts: ProfileField = {
  id: "certifications",
  label: "Certifications held",
  kind: "multi",
  bucket: "certifications",
  options: CERTS,
  column: "certifications",
};
const fMarkets: ProfileField = {
  id: "marketsServed",
  label: "Markets served",
  kind: "multi",
  bucket: "markets",
  options: REGIONS,
};
const fNeeds: ProfileField = {
  id: "lookingFor",
  label: "What are you looking for?",
  kind: "multi",
  bucket: "needs",
  options: [
    "New buyers",
    "New suppliers",
    "Certification support",
    "Funding / investment",
    "Logistics partners",
    "Technology partners",
    "Research collaboration",
    "Training / capacity building",
  ],
};
const fPartnerTypes: ProfileField = {
  id: "partnerTypes",
  label: "Organization types you want to connect with",
  kind: "multi",
  bucket: "needs",
  options: PARTNER_TYPES,
};
const fSustain: ProfileField = {
  id: "sustainabilityPractices",
  label: "Sustainability practices in place",
  kind: "multi",
  bucket: "sustainability",
  options: SUSTAINABILITY,
};
const fLocations: ProfileField = {
  id: "locations",
  label: "Production locations",
  kind: "locations",
  bucket: "markets",
};
const monthlyCapacity = (label: string, suffix: string): ProfileField => ({
  id: "monthlyCapacity",
  label,
  kind: "number",
  bucket: "capacity",
  suffix,
});
const multi = (id: string, label: string, bucket: Bucket, options: string[], column?: OrgColumn): ProfileField => ({
  id,
  label,
  kind: "multi",
  bucket,
  options,
  ...(column ? { column } : {}),
});
const fMoq: ProfileField = {
  id: "moq",
  label: "Minimum order quantity (MOQ)",
  kind: "text",
  bucket: "capacity",
  placeholder: "e.g. 500 pcs / style",
  column: "moq",
};
const fLead: ProfileField = {
  id: "leadTimeDays",
  label: "Production lead time",
  kind: "number",
  bucket: "capacity",
  suffix: "days",
  column: "leadTimeDays",
};
const fCapacity: ProfileField = {
  id: "capacity",
  label: "Production capacity",
  kind: "text",
  bucket: "capacity",
  placeholder: "e.g. 120,000 pcs / month",
  column: "capacity",
};
const fMaterials: ProfileField = {
  id: "materials",
  label: "Materials handled",
  kind: "multi",
  bucket: "offering",
  options: MATERIALS,
  column: "materials",
};

/* ------------------------------- entity definitions ------------------------------ */

export const ENTITY_PROFILES: Record<EntityTypeName, EntityProfileDef> = {
  Seed: {
    weights: {
      offering: 25,
      capabilities: 10,
      capacity: 15,
      markets: 15,
      certifications: 15,
      sustainability: 5,
      needs: 15,
    },
    fields: [
      {
        id: "seedTypes",
        label: "Seed types",
        kind: "multi",
        bucket: "offering",
        options: ["Cotton", "Hemp", "Flax / Linen", "Jute", "Ramie", "Other"],
        column: "productTypes",
      },
      {
        id: "cropTypes",
        label: "Crop types",
        kind: "multi",
        bucket: "offering",
        options: ["Cotton", "Hemp", "Flax", "Jute", "Kenaf", "Other"],
        column: "productCategories",
      },
      {
        id: "varieties",
        label: "Varieties offered",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "Long staple",
          "Extra-long staple",
          "Short staple",
          "Hybrid",
          "Heirloom",
          "GM-free",
        ],
        column: "specializations",
      },
      {
        id: "origin",
        label: "Origin / breeding region",
        kind: "text",
        bucket: "markets",
        placeholder: "e.g. Gujarat, India",
      },
      {
        id: "productionCapacity",
        label: "Production capacity",
        kind: "text",
        bucket: "capacity",
        placeholder: "e.g. 400 tonnes / season",
        column: "capacity",
      },
      {
        id: "farmingMethod",
        label: "Organic or conventional",
        kind: "single",
        bucket: "sustainability",
        options: ORGANIC,
      },
      fCerts,
      fMarkets,
      fNeeds,
      fPartnerTypes,
    ],
  },

  Farmer: {
    weights: {
      offering: 20,
      capabilities: 10,
      capacity: 20,
      markets: 15,
      certifications: 15,
      sustainability: 10,
      needs: 10,
    },
    fields: [
      {
        id: "crops",
        label: "Crops grown",
        kind: "multi",
        bucket: "offering",
        options: ["Cotton", "Organic cotton", "Hemp", "Flax", "Jute", "Wool", "Silk", "Other"],
        column: "productCategories",
      },
      {
        id: "farmSize",
        label: "Farm size",
        kind: "text",
        bucket: "capabilities",
        placeholder: "e.g. 120 hectares",
      },
      {
        id: "farmLocation",
        label: "Farm location",
        kind: "text",
        bucket: "markets",
        placeholder: "District, region",
      },
      {
        id: "productionCapacity",
        label: "Annual production",
        kind: "text",
        bucket: "capacity",
        placeholder: "e.g. 300 tonnes / year",
        column: "capacity",
      },
      {
        id: "farmingMethodDetail",
        label: "Farming method",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "Rainfed",
          "Irrigated",
          "Regenerative",
          "Agroforestry",
          "Drip irrigation",
          "No-till",
        ],
        column: "capabilities",
      },
      {
        id: "farmingMethod",
        label: "Organic or conventional",
        kind: "single",
        bucket: "sustainability",
        options: ORGANIC,
      },
      {
        id: "harvestSeason",
        label: "Harvest season",
        kind: "multi",
        bucket: "capacity",
        options: ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"],
      },
      fCerts,
      {
        id: "currentBuyers",
        label: "Current buyers",
        kind: "textarea",
        bucket: "needs",
        placeholder: "Ginners, cooperatives, traders you already sell to",
      },
      fMarkets,
      fNeeds,
    ],
  },

  "Research Institute": {
    weights: {
      offering: 20,
      capabilities: 25,
      capacity: 5,
      markets: 10,
      certifications: 10,
      sustainability: 10,
      needs: 20,
    },
    fields: [
      {
        id: "researchAreas",
        label: "Research areas",
        kind: "multi",
        bucket: "offering",
        options: [
          "Material science",
          "Circularity",
          "Dyeing & finishing",
          "Recycling",
          "Bio-based fibres",
          "Traceability",
          "Social impact",
          "Policy",
        ],
        column: "specializations",
      },
      {
        id: "textileFocus",
        label: "Textile / fashion focus",
        kind: "textarea",
        bucket: "offering",
        placeholder: "Where your work applies in the value chain",
      },
      {
        id: "technologies",
        label: "Technologies",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "Chemical recycling",
          "Mechanical recycling",
          "Enzymatic processing",
          "Waterless dyeing",
          "AI / data",
          "Blockchain traceability",
          "LCA modelling",
        ],
        column: "capabilities",
      },
      fMaterials,
      { id: "projects", label: "Notable projects", kind: "textarea", bucket: "offering" },
      {
        id: "testingCapabilities",
        label: "Testing capabilities",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "Fibre testing",
          "Chemical testing",
          "Colour fastness",
          "Physical performance",
          "LCA",
          "Microplastics",
        ],
      },
      { id: "equipment", label: "Key equipment / labs", kind: "textarea", bucket: "capabilities" },
      {
        id: "partnershipsNeeded",
        label: "Partnerships needed",
        kind: "multi",
        bucket: "needs",
        options: [
          "Industry pilots",
          "Funding",
          "Data access",
          "Co-publication",
          "Material samples",
          "Scale-up partners",
        ],
      },
      {
        id: "countriesCovered",
        label: "Countries / markets",
        kind: "multi",
        bucket: "markets",
        options: REGIONS,
      },
      fCerts,
    ],
  },

  Ginner: {
    weights: {
      offering: 20,
      capabilities: 20,
      capacity: 20,
      markets: 10,
      certifications: 15,
      sustainability: 5,
      needs: 10,
    },
    fields: [
      {
        id: "cottonTypes",
        label: "Cotton types processed",
        kind: "multi",
        bucket: "offering",
        options: [
          "Conventional",
          "Organic",
          "BCI",
          "Recycled",
          "Fairtrade",
          "Long staple",
          "Extra-long staple",
        ],
        column: "productTypes",
      },
      {
        id: "ginningCapabilities",
        label: "Ginning capabilities",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "Saw ginning",
          "Roller ginning",
          "Baling",
          "Lint cleaning",
          "Seed separation",
          "Contamination control",
        ],
        column: "capabilities",
      },
      {
        id: "capacity",
        label: "Annual / monthly capacity",
        kind: "text",
        bucket: "capacity",
        placeholder: "e.g. 20,000 bales / year",
        column: "capacity",
      },
      {
        id: "sourcingRegions",
        label: "Cotton sourcing regions",
        kind: "textarea",
        bucket: "markets",
        placeholder: "Regions / farmer groups you buy from",
      },
      {
        id: "qualityCapabilities",
        label: "Quality capabilities",
        kind: "multi",
        bucket: "capabilities",
        options: ["HVI testing", "Trash analysis", "Moisture control", "Grading", "Traceable lots"],
      },
      fCerts,
      fMarkets,
      fNeeds,
    ],
  },

  Spinner: {
    weights: {
      offering: 20,
      capabilities: 15,
      capacity: 20,
      markets: 10,
      certifications: 15,
      sustainability: 5,
      needs: 15,
    },
    fields: [
      {
        id: "yarnTypes",
        label: "Yarn types",
        kind: "multi",
        bucket: "offering",
        options: ["Ring-spun", "Open-end", "Compact", "Vortex", "Slub", "Core-spun", "Melange"],
        column: "productTypes",
      },
      fMaterials,
      {
        id: "yarnSpecs",
        label: "Yarn specifications",
        kind: "textarea",
        bucket: "capabilities",
        placeholder: "Counts (Ne), twist, ply, quality grades",
      },
      fCapacity,
      fMoq,
      fLead,
      fCerts,
      fMarkets,
      fNeeds,
    ],
  },

  Mill: {
    weights: {
      offering: 20,
      capabilities: 20,
      capacity: 20,
      markets: 10,
      certifications: 15,
      sustainability: 5,
      needs: 10,
    },
    fields: [
      {
        id: "fabricTypes",
        label: "Fabric types",
        kind: "multi",
        bucket: "offering",
        options: [
          "Jersey knit",
          "Rib",
          "Fleece",
          "Denim",
          "Twill",
          "Poplin",
          "Canvas",
          "Performance",
          "Interlock",
          "Chambray", "Oxford", "Twill / chino", "Canvas / duck", "Corduroy", "Velvet / velour", "Seersucker", "Jersey", "Piqué", "French terry",
        ],
        column: "productTypes",
      },
      multi("millFacilityType", "Facility type", "offering", ["Weaving mill", "Circular-knitting mill", "Flat-knitting mill", "Warp-knitting mill", "Nonwovens producer", "Vertical mill (yarn → finished fabric)"], "specializations"),
      {
        id: "fabricConstruction",
        label: "Fabric construction",
        kind: "multi",
        bucket: "capabilities",
        options: ["Woven – plain", "Woven – jacquard", "Knit – single jersey", "Knit – interlock", "Knit – rib", "Knit – piqué", "Knit – fleece / terry", "Knit – jacquard", "Warp knit – tricot / raschel / mesh", "Nonwoven – spunbond / spunlace / needlepunch / meltblown"],
        column: "capabilities",
      },
      multi("millMaterials", "Materials handled", "offering", ["Cotton (conventional)", "Organic cotton", "In-conversion cotton", "Better Cotton", "Regenerative cotton", "Recycled cotton (pre-consumer)", "Recycled cotton (post-consumer)", "Pima / Supima / ELS cotton", "Giza cotton", "Linen / Flax", "Hemp", "Jute", "Ramie"], "materials"),
      multi("inHouseServices", "In-house services", "capabilities", ["Yarn dyeing", "Piece dyeing", "Printing", "Finishing", "Lab dips", "Fabric testing lab", "Design studio / CAD", "Greige stock", "Ready-stock / stock-service fabrics", "Small-run / sampling yardage"], "capabilities"),
      {
        id: "gsmWidth",
        label: "GSM range / width",
        kind: "text",
        bucket: "capabilities",
        placeholder: "e.g. 120-320 GSM, 150-180 cm",
      },
      fCapacity,
      monthlyCapacity("Monthly fabric capacity", "metres / month"),
      fMoq,
      fLead,
      {
        id: "manufacturingCapabilities",
        label: "Manufacturing capabilities",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "In-house dyeing",
          "Printing",
          "Finishing",
          "Lab dips",
          "Sampling",
          "Yarn dyeing",
        ],
      },
      fLocations,
      fCerts,
      fMarkets,
    ],
  },

  "Dye House": {
    weights: {
      offering: 20,
      capabilities: 20,
      capacity: 15,
      markets: 10,
      certifications: 15,
      sustainability: 10,
      needs: 10,
    },
    fields: [
      {
        id: "dyeingTypes",
        label: "Dyeing types",
        kind: "multi",
        bucket: "offering",
        options: [
          "Reactive",
          "Indigo",
          "Pigment",
          "Disperse",
          "Vat",
          "Garment dye",
          "Yarn dye",
          "Digital print",
        ],
        column: "productTypes",
      },
      multi("dyeFacilityType", "Facility type", "offering", ["Fibre / yarn dye house", "Fabric dye house", "Garment dye & wash house", "Denim laundry", "Printing house", "Finishing plant", "Coating / laminating", "Embellishment (embroidery, sequins, transfers)"], "specializations"),
      multi("printingTypes", "Printing types", "capabilities", ["Rotary screen", "Flatbed screen", "Digital – reactive / pigment", "Digital – sublimation", "Heat-transfer", "Discharge", "Burn-out (devoré)", "Foil / puff", "Garment screen (plastisol / water-based)", "DTG", "DTF"], "capabilities"),
      multi("mechanicalFinishing", "Mechanical finishing", "capabilities", ["Sanforising / compacting", "Calendering", "Raising / brushing", "Peaching / sanding", "Shearing"], "capabilities"),
      multi("chemicalFinishing", "Chemical & functional finishing", "capabilities", ["Mercerising", "Softening", "Enzyme / bio-polish", "Water-repellent (PFAS-free)", "Anti-microbial"], "capabilities"),
      multi("garmentWashing", "Garment washing", "capabilities", ["Stone wash", "Enzyme wash", "Ozone", "Laser", "Bleach", "Acid wash", "Low-water / eco-wash", "Garment-dye overdye", "Destroy / vintage effects"], "capabilities"),
      fMaterials,
      {
        id: "dyeingCapacity",
        label: "Dyeing capacity",
        kind: "text",
        bucket: "capacity",
        placeholder: "e.g. 15 tonnes / day",
        column: "capacity",
      },
      monthlyCapacity("Monthly processing capacity", "kg / month"),
      {
        id: "finishingCapabilities",
        label: "Finishing capabilities",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "Softening",
          "Peaching",
          "Anti-pilling",
          "Water repellent",
          "Enzyme wash",
          "Sanforizing",
          "Mercerizing",
        ],
        column: "capabilities",
      },
      fMoq,
      fLead,
      {
        id: "sustainabilityProcesses",
        label: "Sustainable processes",
        kind: "multi",
        bucket: "sustainability",
        options: [
          "Water recycling",
          "ZDHC compliant chemistry",
          "Low-liquor dyeing",
          "Waterless dyeing",
          "Effluent treatment plant",
          "Heat recovery",
        ],
      },
      multi("environmentalInfrastructure", "Environmental infrastructure", "sustainability", ["Effluent treatment plant (ETP)", "Zero liquid discharge (ZLD)", "Water recycling", "Low-liquor-ratio machines", "Heat recovery", "Renewable energy on site", "Biomass / electric boiler", "Rainwater harvesting", "Chemical inventory list (CIL)", "Sludge management"]),
      fLocations,
      fCerts,
      fMarkets,
    ],
  },

  "Trims / Accessories": {
    weights: { offering: 25, capabilities: 20, capacity: 20, markets: 10, certifications: 15, sustainability: 5, needs: 5 },
    fields: [
      { id: "productsSupplied", label: "Trims / accessories produced", kind: "multi", bucket: "offering", options: ["Buttons", "Zippers", "Labels", "Threads", "Elastics", "Tapes", "Buckles", "Packaging", "Other"], column: "productTypes" },
      fMaterials,
      { id: "trimCapabilities", label: "Production capabilities", kind: "multi", bucket: "capabilities", options: ["Custom design", "Dyeing", "Printing", "Embroidery", "Metal finishing", "Moulding", "Private label"], column: "capabilities" },
      fMoq, fCapacity, fLead, fMarkets, fCerts, fSustain, fNeeds,
    ],
  },
  Agent: {
    weights: { offering: 25, capabilities: 25, capacity: 5, markets: 20, certifications: 10, sustainability: 5, needs: 10 },
    fields: [
      { id: "productsSupplied", label: "Products / materials represented", kind: "multi", bucket: "offering", options: ["Fibres", "Yarns", "Fabrics", "Garments", "Trims & accessories", "Packaging"], column: "productTypes" },
      { id: "brandsProducts", label: "Organizations / product lines represented", kind: "textarea", bucket: "offering" },
      { id: "agentServices", label: "Services offered", kind: "multi", bucket: "capabilities", options: ["Sourcing", "Sales representation", "Supplier coordination", "Quality inspection", "Order management", "Export support"], column: "capabilities" },
      { id: "representationModel", label: "Representation model", kind: "single", bucket: "capabilities", options: ["Buyer representative", "Supplier representative", "Both"] },
      fMarkets, fCerts, fSustain, fNeeds, fPartnerTypes,
    ],
  },
  "Recycling Company": {
    weights: { offering: 25, capabilities: 25, capacity: 20, markets: 10, certifications: 10, sustainability: 5, needs: 5 },
    fields: [
      fMaterials,
      { id: "wasteSources", label: "Textile waste accepted", kind: "multi", bucket: "offering", options: ["Pre-consumer waste", "Post-consumer textiles", "Cutting scraps", "Yarn waste", "Blended textiles"], column: "productCategories" },
      { id: "recyclingProcesses", label: "Recycling processes", kind: "multi", bucket: "capabilities", options: ["Mechanical recycling", "Chemical recycling", "Fibre-to-fibre recycling", "Sorting", "Shredding", "Downcycling"], column: "capabilities" },
      { id: "recyclingOutputs", label: "Recycled outputs", kind: "multi", bucket: "capabilities", options: ["Recycled fibres", "Recycled yarns", "Recycled fabrics", "Nonwovens", "Industrial materials"], column: "productTypes" },
      { id: "collectionCapacity", label: "Processing capacity", kind: "text", bucket: "capacity", placeholder: "e.g. 80 tonnes / month", column: "capacity" },
      fMoq, fLead, fMarkets, fCerts, fSustain, fNeeds,
    ],
  },
  Supplier: {
    weights: {
      offering: 25,
      capabilities: 10,
      capacity: 20,
      markets: 10,
      certifications: 15,
      sustainability: 5,
      needs: 15,
    },
    fields: [
      {
        id: "productsSupplied",
        label: "Products / materials supplied",
        kind: "multi",
        bucket: "offering",
        options: [...MATERIALS, "Buttons", "Zippers", "Labels", "Threads", "Packaging", "Trims"],
        column: "productTypes",
      },
      {
        id: "categories",
        label: "Categories",
        kind: "multi",
        bucket: "offering",
        options: [
          "Raw materials",
          "Fabrics",
          "Yarns",
          "Trims & accessories",
          "Packaging",
          "Finished goods",
        ],
        column: "productCategories",
      },
      {
        id: "brandsProducts",
        label: "Brands / product lines carried",
        kind: "textarea",
        bucket: "capabilities",
      },
      {
        id: "stockAvailability",
        label: "Stock availability",
        kind: "single",
        bucket: "capacity",
        options: ["Ready stock", "Made to order", "Both"],
      },
      fMoq,
      fCapacity,
      fLead,
      fMarkets,
      fCerts,
      fNeeds,
    ],
  },

  Manufacturer: {
    weights: {
      offering: 15,
      capabilities: 20,
      capacity: 25,
      markets: 10,
      certifications: 15,
      sustainability: 5,
      needs: 10,
    },
    fields: [
      {
        id: "productsManufactured",
        label: "Products manufactured",
        kind: "multi",
        bucket: "offering",
        options: mergeOptions(PRODUCT_CATEGORIES, ["Polo shirts", "Shirts & blouses", "Dresses", "Skirts", "Trousers & chinos", "Sweatshirts & hoodies", "Shorts"]),
        column: "productCategories",
      },
      multi("processCapabilities", "Process capabilities", "capabilities", ["Pattern making", "Grading", "Marker making (CAD)", "Sampling", "3D sampling (CLO / Browzwear)", "Automatic cutting", "Bonding / seam taping / welding", "Fully-fashioned / whole-garment knitting", "Embroidery", "Screen / DTG / DTF printing", "Garment washing", "Garment dyeing", "Pressing & finishing", "In-house quality lab"], "capabilities"),
      {
        id: "manufacturingCapabilities",
        label: "Manufacturing capabilities",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "Cut & sew",
          "Knitting",
          "Embroidery",
          "Printing",
          "Washing",
          "Sampling",
          "Pattern making",
          "Quality control",
        ],
        column: "capabilities",
      },
      fMaterials,
      fCapacity,
      monthlyCapacity("Monthly production capacity", "pcs / month"),
      fMoq,
      {
        id: "sampleLeadTimeDays",
        label: "Sample lead time",
        kind: "number",
        bucket: "capacity",
        suffix: "days",
      },
      fLead,
      {
        id: "businessModel",
        label: "Business model",
        kind: "multi",
        bucket: "capabilities",
        options: ["OEM", "ODM", "Private label", "Full package (FOB)", "CMT"],
        column: "specializations",
      },
      fLocations,
      fCerts,
      fMarkets,
    ],
  },

  Brand: {
    weights: {
      offering: 20,
      capabilities: 10,
      capacity: 15,
      markets: 10,
      certifications: 10,
      sustainability: 10,
      needs: 25,
    },
    fields: [
      {
        id: "productCategories",
        label: "Product categories",
        kind: "multi",
        bucket: "offering",
        options: PRODUCT_CATEGORIES,
        column: "productCategories",
      },
      {
        id: "targetMarket",
        label: "Target market",
        kind: "multi",
        bucket: "markets",
        options: ["Womenswear", "Menswear", "Kidswear", "Unisex", "Sports", "Outdoor", "Workwear"],
        column: "specializations",
      },
      {
        id: "priceSegment",
        label: "Price segment",
        kind: "single",
        bucket: "offering",
        options: ["Value", "Mid-market", "Premium", "Luxury"],
      },
      {
        id: "annualVolume",
        label: "Annual sourcing volume",
        kind: "text",
        bucket: "capacity",
        placeholder: "e.g. 500,000 units / year",
        column: "capacity",
      },
      {
        id: "materialsRequired",
        label: "Materials required",
        kind: "multi",
        bucket: "offering",
        options: MATERIALS,
        column: "materials",
      },
      {
        id: "supplierRequirements",
        label: "Supplier requirements",
        kind: "multi",
        bucket: "needs",
        options: [
          "Audited factory",
          "Traceable supply chain",
          "Sampling capability",
          "Small MOQ",
          "Vertical integration",
          "Nearshoring",
        ],
      },
      {
        id: "targetMoq",
        label: "Target MOQ",
        kind: "text",
        bucket: "capacity",
        placeholder: "e.g. up to 1,000 pcs",
        column: "moq",
      },
      {
        id: "targetLeadTimeDays",
        label: "Target lead time",
        kind: "number",
        bucket: "capacity",
        suffix: "days",
        column: "leadTimeDays",
      },
      {
        id: "sourcingCountries",
        label: "Preferred sourcing countries",
        kind: "multi",
        bucket: "markets",
        options: [
          "Turkey",
          "Portugal",
          "India",
          "Bangladesh",
          "Vietnam",
          "China",
          "Pakistan",
          "Morocco",
          "Egypt",
          "Italy",
          "Spain",
          "Ethiopia",
        ],
      },
      {
        id: "requiredCertifications",
        label: "Required certifications",
        kind: "multi",
        bucket: "certifications",
        options: CERTS,
        column: "certifications",
      },
      {
        id: "sustainabilityRequirements",
        label: "Sustainability requirements",
        kind: "multi",
        bucket: "sustainability",
        options: SUSTAINABILITY,
      },
      fNeeds,
    ],
  },

  Retailer: {
    weights: {
      offering: 20,
      capabilities: 10,
      capacity: 15,
      markets: 15,
      certifications: 10,
      sustainability: 5,
      needs: 25,
    },
    fields: [
      {
        id: "productCategories",
        label: "Product categories",
        kind: "multi",
        bucket: "offering",
        options: PRODUCT_CATEGORIES,
        column: "productCategories",
      },
      {
        id: "market",
        label: "Markets you sell in",
        kind: "multi",
        bucket: "markets",
        options: REGIONS,
      },
      {
        id: "retailModel",
        label: "Retail model",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "Physical stores",
          "E-commerce",
          "Marketplace",
          "Wholesale",
          "Department store",
          "Private label",
        ],
        column: "capabilities",
      },
      {
        id: "sourcingRequirements",
        label: "Sourcing requirements",
        kind: "multi",
        bucket: "needs",
        options: [
          "Small MOQ",
          "Fast replenishment",
          "Drop shipping",
          "Private label",
          "Certified sustainable",
          "Local production",
        ],
      },
      {
        id: "expectedVolume",
        label: "Expected volume",
        kind: "text",
        bucket: "capacity",
        placeholder: "e.g. 50,000 units / season",
        column: "capacity",
      },
      {
        id: "preferredSuppliers",
        label: "Preferred supplier types",
        kind: "multi",
        bucket: "needs",
        options: PARTNER_TYPES,
      },
      {
        id: "preferredCountries",
        label: "Preferred countries",
        kind: "multi",
        bucket: "markets",
        options: [
          "Turkey",
          "Portugal",
          "India",
          "Bangladesh",
          "Vietnam",
          "China",
          "Italy",
          "Spain",
          "Morocco",
          "Egypt",
        ],
      },
      {
        id: "requiredCertifications",
        label: "Required certifications",
        kind: "multi",
        bucket: "certifications",
        options: CERTS,
        column: "certifications",
      },
      fNeeds,
    ],
  },

  Logistics: {
    weights: {
      offering: 20,
      capabilities: 20,
      capacity: 15,
      markets: 20,
      certifications: 10,
      sustainability: 5,
      needs: 10,
    },
    fields: [
      {
        id: "logisticsServices",
        label: "Logistics services",
        kind: "multi",
        bucket: "offering",
        options: [
          "Freight forwarding",
          "Warehousing",
          "Distribution",
          "Customs brokerage",
          "Last mile",
          "Reverse logistics",
          "Cross-docking",
        ],
        column: "capabilities",
      },
      {
        id: "transportModes",
        label: "Transport modes",
        kind: "multi",
        bucket: "capabilities",
        options: ["Ocean", "Air", "Road", "Rail", "Multimodal"],
        column: "specializations",
      },
      {
        id: "routesCovered",
        label: "Countries / routes covered",
        kind: "multi",
        bucket: "markets",
        options: REGIONS,
      },
      {
        id: "warehouseLocations",
        label: "Warehouse locations",
        kind: "textarea",
        bucket: "markets",
      },
      {
        id: "capacity",
        label: "Capacity",
        kind: "text",
        bucket: "capacity",
        placeholder: "e.g. 12,000 sqm, 400 TEU / month",
        column: "capacity",
      },
      {
        id: "shipmentSize",
        label: "Typical shipment size",
        kind: "single",
        bucket: "capacity",
        options: ["Parcel", "LCL", "FCL", "Bulk", "All sizes"],
      },
      {
        id: "transitTimeDays",
        label: "Typical transit time",
        kind: "number",
        bucket: "capacity",
        suffix: "days",
        column: "leadTimeDays",
      },
      {
        id: "customsServices",
        label: "Customs services offered",
        kind: "single",
        bucket: "capabilities",
        options: YES_NO,
      },
      {
        id: "trackingCapabilities",
        label: "Tracking capabilities",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "Real-time GPS",
          "EDI / API integration",
          "Customer portal",
          "Milestone alerts",
          "Carbon reporting",
        ],
      },
      fCerts,
      fNeeds,
    ],
  },

  Certifier: {
    weights: {
      offering: 20,
      capabilities: 20,
      capacity: 5,
      markets: 15,
      certifications: 25,
      sustainability: 5,
      needs: 10,
    },
    fields: [
      {
        id: "certificationTypes",
        label: "Certification types issued",
        kind: "multi",
        bucket: "offering",
        options: CERTS,
        column: "productTypes",
      },
      {
        id: "industriesCovered",
        label: "Industries covered",
        kind: "multi",
        bucket: "capabilities",
        options: ["Textiles", "Apparel", "Agriculture", "Footwear", "Home textiles", "Chemicals"],
        column: "productCategories",
      },
      {
        id: "standards",
        label: "Standards operated",
        kind: "multi",
        bucket: "certifications",
        options: [...CERTS, "ISO 17065", "ISO 17021"],
        column: "certifications",
      },
      {
        id: "geographicCoverage",
        label: "Geographic coverage",
        kind: "multi",
        bucket: "markets",
        options: REGIONS,
      },
      {
        id: "auditTestingCapabilities",
        label: "Audit / testing capabilities",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "On-site audits",
          "Remote audits",
          "Lab testing",
          "Transaction certificates",
          "Chain of custody",
          "Surveillance audits",
        ],
        column: "capabilities",
      },
      {
        id: "accreditation",
        label: "Accreditation bodies",
        kind: "textarea",
        bucket: "certifications",
        placeholder: "e.g. IOAS, ANAB, DAkkS",
      },
      fNeeds,
    ],
  },

  Auditor: {
    weights: {
      offering: 20,
      capabilities: 20,
      capacity: 5,
      markets: 15,
      certifications: 25,
      sustainability: 5,
      needs: 10,
    },
    fields: [
      {
        id: "auditTypes",
        label: "Audit types",
        kind: "multi",
        bucket: "offering",
        options: [
          "Social compliance",
          "Environmental",
          "Quality",
          "Health & safety",
          "Chemical management",
          "Traceability",
          "Factory capability",
        ],
        column: "productTypes",
      },
      {
        id: "expertiseAreas",
        label: "Areas of expertise",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "Labour rights",
          "Wages & hours",
          "Wastewater",
          "Energy",
          "Chemicals",
          "Fire & building safety",
        ],
        column: "specializations",
      },
      {
        id: "standards",
        label: "Standards audited against",
        kind: "multi",
        bucket: "certifications",
        options: [...CERTS, "SMETA", "Higg FEM", "amfori BSCI"],
        column: "certifications",
      },
      {
        id: "geographicCoverage",
        label: "Geographic coverage",
        kind: "multi",
        bucket: "markets",
        options: REGIONS,
      },
      {
        id: "industriesCovered",
        label: "Industries covered",
        kind: "multi",
        bucket: "capabilities",
        options: ["Textiles", "Apparel", "Agriculture", "Footwear", "Logistics"],
        column: "productCategories",
      },
      {
        id: "accreditation",
        label: "Certifications / accreditation",
        kind: "textarea",
        bucket: "certifications",
      },
      fNeeds,
    ],
  },

  NGO: {
    weights: {
      offering: 20,
      capabilities: 15,
      capacity: 5,
      markets: 20,
      certifications: 5,
      sustainability: 15,
      needs: 20,
    },
    fields: [
      {
        id: "focusAreas",
        label: "Focus areas",
        kind: "multi",
        bucket: "offering",
        options: [
          "Worker rights",
          "Living wages",
          "Gender equity",
          "Environment",
          "Circularity",
          "Child labour",
          "Capacity building",
          "Policy advocacy",
        ],
        column: "specializations",
      },
      { id: "programs", label: "Programs run", kind: "textarea", bucket: "capabilities" },
      {
        id: "geographicCoverage",
        label: "Geographic coverage",
        kind: "multi",
        bucket: "markets",
        options: REGIONS,
      },
      { id: "communitiesServed", label: "Communities served", kind: "textarea", bucket: "markets" },
      {
        id: "textileInitiatives",
        label: "Fashion / textile initiatives",
        kind: "textarea",
        bucket: "offering",
      },
      {
        id: "impactAreas",
        label: "Sustainability / social impact areas",
        kind: "multi",
        bucket: "sustainability",
        options: SUSTAINABILITY,
      },
      {
        id: "partnershipsNeeded",
        label: "Partnerships needed",
        kind: "multi",
        bucket: "needs",
        options: ["Brands", "Manufacturers", "Funders", "Researchers", "Government", "Certifiers"],
      },
      fPartnerTypes,
    ],
  },

  Government: {
    weights: { basic: 20, offering: 20, capabilities: 15, markets: 20, needs: 25 },
    fields: [
      { id: "countryRegion", label: "Country / region represented", kind: "text", bucket: "basic" },
      {
        id: "departmentType",
        label: "Department / organization type",
        kind: "single",
        bucket: "basic",
        options: [
          "Ministry",
          "Trade agency",
          "Export promotion",
          "Regulator",
          "Municipality",
          "Development agency",
        ],
      },
      {
        id: "textilePrograms",
        label: "Textile / fashion programs",
        kind: "textarea",
        bucket: "offering",
      },
      {
        id: "responsibilities",
        label: "Areas of responsibility",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "Trade policy",
          "Compliance & enforcement",
          "Export promotion",
          "Skills & training",
          "Environmental regulation",
          "Investment attraction",
        ],
        column: "capabilities",
      },
      {
        id: "industryInitiatives",
        label: "Industry initiatives",
        kind: "textarea",
        bucket: "offering",
      },
      {
        id: "regionsCovered",
        label: "Regions covered",
        kind: "multi",
        bucket: "markets",
        options: REGIONS,
      },
      {
        id: "partnershipRequirements",
        label: "Partnership requirements",
        kind: "textarea",
        bucket: "needs",
      },
      fPartnerTypes,
    ],
  },

  Investor: {
    weights: {
      basic: 15,
      offering: 20,
      capabilities: 10,
      capacity: 15,
      markets: 15,
      sustainability: 10,
      needs: 15,
    },
    fields: [
      {
        id: "investorType",
        label: "Investor type",
        kind: "single",
        bucket: "basic",
        options: [
          "Venture capital",
          "Private equity",
          "Angel",
          "Family office",
          "Impact fund",
          "Corporate venture",
          "Development finance",
        ],
      },
      {
        id: "investmentFocus",
        label: "Investment focus",
        kind: "multi",
        bucket: "offering",
        options: [
          "Materials innovation",
          "Manufacturing",
          "Retail & brands",
          "Supply chain tech",
          "Recycling & circularity",
          "Traceability",
          "Logistics",
        ],
        column: "specializations",
      },
      {
        id: "textileInterests",
        label: "Fashion / textile interests",
        kind: "textarea",
        bucket: "capabilities",
      },
      { id: "geography", label: "Geographies", kind: "multi", bucket: "markets", options: REGIONS },
      {
        id: "investmentStage",
        label: "Investment stage",
        kind: "multi",
        bucket: "capabilities",
        options: ["Pre-seed", "Seed", "Series A", "Series B+", "Growth", "Buyout"],
      },
      {
        id: "ticketSize",
        label: "Typical investment size",
        kind: "text",
        bucket: "capacity",
        placeholder: "e.g. EUR 0.5M - 5M",
        column: "capacity",
      },
      {
        id: "sustainabilityInterests",
        label: "Sustainability interests",
        kind: "multi",
        bucket: "sustainability",
        options: SUSTAINABILITY,
      },
      {
        id: "opportunitiesSought",
        label: "Opportunities you're seeking",
        kind: "textarea",
        bucket: "needs",
      },
    ],
  },

  "Clothing Banks": {
    weights: {
      offering: 20,
      capabilities: 20,
      capacity: 15,
      markets: 15,
      certifications: 5,
      sustainability: 15,
      needs: 10,
    },
    fields: [
      {
        id: "collectionLocations",
        label: "Collection locations",
        kind: "textarea",
        bucket: "markets",
        placeholder: "Cities / drop-off points",
      },
      {
        id: "clothingCategories",
        label: "Clothing categories collected",
        kind: "multi",
        bucket: "offering",
        options: [
          "Menswear",
          "Womenswear",
          "Kidswear",
          "Footwear",
          "Home textiles",
          "Accessories",
          "Damaged / rags",
        ],
        column: "productCategories",
      },
      {
        id: "collectionCapacity",
        label: "Collection capacity",
        kind: "text",
        bucket: "capacity",
        placeholder: "e.g. 80 tonnes / month",
        column: "capacity",
      },
      {
        id: "reuseCapabilities",
        label: "Reuse / recycling capabilities",
        kind: "multi",
        bucket: "capabilities",
        options: [
          "Sorting",
          "Grading",
          "Repair",
          "Resale",
          "Mechanical recycling",
          "Fibre shredding",
          "Downcycling",
        ],
        column: "capabilities",
      },
      {
        id: "geographicCoverage",
        label: "Geographic coverage",
        kind: "multi",
        bucket: "markets",
        options: REGIONS,
      },
      {
        id: "donationRequirements",
        label: "Donation requirements",
        kind: "textarea",
        bucket: "needs",
      },
      {
        id: "impactFocus",
        label: "Sustainability / social impact focus",
        kind: "multi",
        bucket: "sustainability",
        options: SUSTAINABILITY,
      },
      {
        id: "partnersNeeded",
        label: "Partners needed",
        kind: "multi",
        bucket: "needs",
        options: PARTNER_TYPES,
      },
      fCerts,
    ],
  },
};

export interface LocationRow {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
}
export type ProfileAnswerValue = string | number | string[] | LocationRow[] | null | undefined;
export type ProfileAnswers = Record<string, ProfileAnswerValue>;

export function getProfileDef(type: string | undefined | null): EntityProfileDef {
  return ENTITY_PROFILES[normalizeEntityType(type)];
}

/** Wizard steps: fields grouped by bucket, in canonical order. */
export function getProfileSteps(type: string | undefined | null) {
  const def = getProfileDef(type);
  return BUCKET_ORDER.map((bucket) => ({
    bucket,
    title: BUCKET_LABELS[bucket],
    fields: def.fields.filter((f) => f.bucket === bucket),
  })).filter((s) => s.fields.length > 0);
}

export function isAnswered(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value))
    return value.some((v) =>
      typeof v === "string" ? v.trim().length > 0 : !!v && typeof v === "object" && !!((v as LocationRow).city?.trim() || (v as LocationRow).country?.trim()),
    );
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  return String(value).trim().length > 0;
}

/** Carries the retired single "factoryLocations" text into the locations list when none exist yet. */
export function withLegacyLocations(answers: ProfileAnswers): ProfileAnswers {
  const legacy = answers?.factoryLocations;
  const locs = answers?.locations;
  if (typeof legacy === "string" && legacy.trim() && (!Array.isArray(locs) || locs.length === 0)) {
    return { ...answers, locations: [{ address: legacy.trim().slice(0, 255) }] };
  }
  return answers;
}
