import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Sparkles, Plus, Globe2, Network, Loader2, ArrowUpRight, Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { Entity, EntityType } from "@/seed/types";
import { ALL_ENTITIES } from "@/seed/all-entities";
import { runAiResearch } from "@/lib/research.functions";
import {
  createRun,
  deleteRun,
  getRunsForOrg,
  updateRun,
  type ResearchCandidate,
  type ResearchRun,
} from "@/seed/research-runs";

const ENTITY_TYPES: EntityType[] = [
  "Brand",
  "Farmer",
  "Ginner",
  "Spinner",
  "Fabric Mill",
  "Dye House",
  "Garment Factory",
  "Logistics Provider",
  "Certification Body",
  "Sustainability Partner",
];

const COUNTERPART: Record<EntityType, EntityType> = {
  "Brand": "Garment Factory",
  "Garment Factory": "Fabric Mill",
  "Fabric Mill": "Spinner",
  "Spinner": "Ginner",
  "Ginner": "Farmer",
  "Farmer": "Ginner",
  "Dye House": "Fabric Mill",
  "Logistics Provider": "Garment Factory",
  "Certification Body": "Garment Factory",
  "Sustainability Partner": "Brand",
};

// ---------------- Search profiles per entity type ----------------

type RowData = {
  name: string;
  entityType: string;
  country: string;
  city?: string;
  materials?: string[];
  capabilities?: string[];
  certifications?: string[];
  moq?: string;
  leadTimeDays?: number;
  capacity?: string;
  onTimeRate?: number;
  description?: string;
  rationale?: string;
  matchScore?: number;
};

type ColumnDef = {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (r: RowData) => React.ReactNode;
};

type QuickFilter = {
  label: string;
  apply: (f: FilterState) => FilterState;
};

type FilterState = {
  search: string;
  etype: string;
  country: string;
  minOtr: string;
  maxLead: string;
  certContains: string;
  materialContains: string;
};

type SearchProfile = {
  defaultCounterpart: EntityType;
  introVerb: string;
  columns: ColumnDef[];
  quickFilters: QuickFilter[];
  promptSuggestions: string[];
  emptyHint: string;
};

const chips = (xs?: string[], n = 3) =>
  !xs || xs.length === 0 ? (
    <span className="text-xs text-muted-foreground">—</span>
  ) : (
    <div className="flex flex-wrap gap-1">
      {xs.slice(0, n).map((x) => (
        <Badge key={x} variant="outline" className="text-[10px] font-normal">{x}</Badge>
      ))}
    </div>
  );

const txt = (v?: string | number | null, suffix = "") =>
  v === undefined || v === null || v === "" ? "—" : `${v}${suffix}`;

const NAME_COL: ColumnDef = {
  key: "name",
  label: "Organization",
  render: (r) => (
    <div>
      <div className="font-medium">{r.name}</div>
      <div className="text-[11px] text-muted-foreground">
        {r.entityType}
        {r.matchScore ? ` · ${r.matchScore}% match` : ""}
      </div>
    </div>
  ),
};
const LOC_COL: ColumnDef = {
  key: "loc",
  label: "Location",
  render: (r) => (
    <span className="text-xs text-muted-foreground">
      {[r.city, r.country].filter(Boolean).join(", ") || "—"}
    </span>
  ),
};
const MOQ_COL: ColumnDef = { key: "moq", label: "MOQ", render: (r) => <span className="text-xs">{txt(r.moq)}</span> };
const LEAD_COL: ColumnDef = {
  key: "lead", label: "Lead",
  render: (r) => <span className="text-xs">{r.leadTimeDays ? `${r.leadTimeDays}d` : "—"}</span>,
};
const OTR_COL: ColumnDef = {
  key: "otr", label: "On-time",
  render: (r) => <span className="text-xs">{r.onTimeRate != null ? `${r.onTimeRate}%` : "—"}</span>,
};
const CAP_COL: ColumnDef = { key: "cap", label: "Capacity", render: (r) => <span className="text-xs">{txt(r.capacity)}</span> };
const MAT_COL: ColumnDef = { key: "mat", label: "Materials", render: (r) => chips(r.materials) };
const CAPB_COL: ColumnDef = { key: "capb", label: "Capabilities", render: (r) => chips(r.capabilities) };
const CERT_COL: ColumnDef = { key: "cert", label: "Certifications", render: (r) => chips(r.certifications) };

const COMMON_FILTERS: QuickFilter[] = [
  { label: "Lead < 30d", apply: (f) => ({ ...f, maxLead: "30" }) },
  { label: "On-time ≥ 90%", apply: (f) => ({ ...f, minOtr: "90" }) },
];

const SEARCH_PROFILES: Record<EntityType, SearchProfile> = {
  "Brand": {
    defaultCounterpart: "Garment Factory",
    introVerb: "Source compliant manufacturing partners",
    columns: [NAME_COL, LOC_COL, CAPB_COL, CAP_COL, MOQ_COL, LEAD_COL, OTR_COL, CERT_COL],
    quickFilters: [
      ...COMMON_FILTERS,
      { label: "GOTS certified", apply: (f) => ({ ...f, certContains: "GOTS" }) },
      { label: "MOQ-friendly", apply: (f) => ({ ...f, search: "small batch" }) },
    ],
    promptSuggestions: [
      "Tier 2 spinners in Türkiye with GOTS and MOQ under 500 kg",
      "Cut & sew factories in Portugal under 30 day lead and SA8000",
      "Knit fabric mills in India with OEKO-TEX and recycled cotton",
      "Garment factories in Egypt with monthly capacity above 100k units",
    ],
    emptyHint: "No factories match. Try a New Research run to expand with AI.",
  },
  "Garment Factory": {
    defaultCounterpart: "Fabric Mill",
    introVerb: "Find upstream fabric, trims and dye partners",
    columns: [NAME_COL, LOC_COL, MAT_COL, CAP_COL, MOQ_COL, LEAD_COL, CERT_COL],
    quickFilters: [
      ...COMMON_FILTERS,
      { label: "OEKO-TEX", apply: (f) => ({ ...f, certContains: "OEKO" }) },
      { label: "Knit fabric", apply: (f) => ({ ...f, materialContains: "knit" }) },
    ],
    promptSuggestions: [
      "Knit fabric mills in Bangladesh shipping within 21 days",
      "Trim and accessory suppliers in South Asia with low MOQ",
      "Dye houses with ZDHC compliance in Vietnam",
      "Woven fabric mills with GOTS in Türkiye",
    ],
    emptyHint: "No mills or trim partners match. Run a new AI research.",
  },
  "Fabric Mill": {
    defaultCounterpart: "Spinner",
    introVerb: "Source yarn and dye partners",
    columns: [NAME_COL, LOC_COL, MAT_COL, CAP_COL, MOQ_COL, LEAD_COL, CERT_COL],
    quickFilters: [
      ...COMMON_FILTERS,
      { label: "Combed cotton", apply: (f) => ({ ...f, materialContains: "combed" }) },
      { label: "Organic", apply: (f) => ({ ...f, materialContains: "organic" }) },
    ],
    promptSuggestions: [
      "Spinners offering combed cotton Ne 30+ with OEKO-TEX",
      "Open-end spinners in India for recycled cotton blends",
      "Dye houses with low water-use in Portugal",
      "Yarn mills with GOTS supplying under 30 days",
    ],
    emptyHint: "No spinners match. Try New Research for AI suggestions.",
  },
  "Spinner": {
    defaultCounterpart: "Ginner",
    introVerb: "Source seed cotton bales from gins",
    columns: [NAME_COL, LOC_COL, MAT_COL, CAP_COL, MOQ_COL, LEAD_COL, CERT_COL],
    quickFilters: [
      ...COMMON_FILTERS,
      { label: "BCI cotton", apply: (f) => ({ ...f, certContains: "BCI" }) },
      { label: "Organic", apply: (f) => ({ ...f, materialContains: "organic" }) },
    ],
    promptSuggestions: [
      "Ginners in India with BCI-certified seed cotton",
      "Organic gins in Türkiye with HVI testing",
      "Gins in Egypt with monthly bale capacity above 5000",
      "Ginners offering recycled cotton input streams",
    ],
    emptyHint: "No ginners match. Run new AI research.",
  },
  "Ginner": {
    defaultCounterpart: "Farmer",
    introVerb: "Source seed cotton from farms",
    columns: [NAME_COL, LOC_COL, MAT_COL, CAP_COL, CERT_COL],
    quickFilters: [
      { label: "Organic", apply: (f) => ({ ...f, materialContains: "organic" }) },
      { label: "Fairtrade", apply: (f) => ({ ...f, certContains: "Fairtrade" }) },
      { label: "BCI", apply: (f) => ({ ...f, certContains: "BCI" }) },
    ],
    promptSuggestions: [
      "Organic cotton farmers within 300 km of our gin",
      "Smallholder farmer co-ops with Fairtrade certification",
      "BCI farmers in Maharashtra with 100+ hectares",
      "Regenerative cotton farms in West Africa",
    ],
    emptyHint: "No farmers match. Try a new AI research run.",
  },
  "Farmer": {
    defaultCounterpart: "Ginner",
    introVerb: "Find ginners that accept your harvest",
    columns: [NAME_COL, LOC_COL, MAT_COL, CAP_COL, CERT_COL],
    quickFilters: [
      { label: "Accepts organic", apply: (f) => ({ ...f, materialContains: "organic" }) },
      { label: "Fairtrade pricing", apply: (f) => ({ ...f, certContains: "Fairtrade" }) },
    ],
    promptSuggestions: [
      "Ginners accepting organic seed cotton with fair pricing",
      "Gins within 200 km offering premium for long-staple",
      "Ginners with traceability programs in our region",
    ],
    emptyHint: "No nearby gins match. Try a new AI research run.",
  },
  "Dye House": {
    defaultCounterpart: "Fabric Mill",
    introVerb: "Find fabric mill partners for finishing contracts",
    columns: [NAME_COL, LOC_COL, MAT_COL, CAP_COL, LEAD_COL, CERT_COL],
    quickFilters: [
      ...COMMON_FILTERS,
      { label: "GOTS", apply: (f) => ({ ...f, certContains: "GOTS" }) },
      { label: "Knit", apply: (f) => ({ ...f, materialContains: "knit" }) },
    ],
    promptSuggestions: [
      "Fabric mills sourcing low-impact reactive dyeing",
      "Knit mills in Vietnam needing finishing partners",
      "Mills requiring ZDHC-compliant dye houses",
    ],
    emptyHint: "No mills match. Run new AI research.",
  },
  "Logistics Provider": {
    defaultCounterpart: "Garment Factory",
    introVerb: "Find factories needing freight & customs partners",
    columns: [NAME_COL, LOC_COL, CAP_COL, CAPB_COL, LEAD_COL, CERT_COL],
    quickFilters: [
      { label: "EU bound", apply: (f) => ({ ...f, search: "EU export" }) },
      { label: "High volume", apply: (f) => ({ ...f, search: "high volume" }) },
    ],
    promptSuggestions: [
      "Garment factories shipping LCL to EU monthly",
      "Brands needing air freight from South Asia",
      "Factories with FCL volume to US west coast",
    ],
    emptyHint: "No matching shippers. Run new AI research.",
  },
  "Certification Body": {
    defaultCounterpart: "Garment Factory",
    introVerb: "Find facilities due for audit & recertification",
    columns: [NAME_COL, LOC_COL, CERT_COL, MAT_COL, OTR_COL],
    quickFilters: [
      { label: "GOTS scope", apply: (f) => ({ ...f, certContains: "GOTS" }) },
      { label: "OEKO-TEX scope", apply: (f) => ({ ...f, certContains: "OEKO" }) },
      { label: "SA8000", apply: (f) => ({ ...f, certContains: "SA8000" }) },
    ],
    promptSuggestions: [
      "Mills and factories due for GOTS recertification this quarter",
      "Spinners without OEKO-TEX seeking certification",
      "Facilities in Türkiye scheduled for social audits",
    ],
    emptyHint: "No facilities match. Run new AI research.",
  },
  "Sustainability Partner": {
    defaultCounterpart: "Brand",
    introVerb: "Find brands seeking traceability & ESG support",
    columns: [NAME_COL, LOC_COL, CAPB_COL, CERT_COL],
    quickFilters: [
      { label: "Tier 2 visibility", apply: (f) => ({ ...f, search: "tier 2" }) },
      { label: "GOTS", apply: (f) => ({ ...f, certContains: "GOTS" }) },
    ],
    promptSuggestions: [
      "Brands publishing Tier 2 traceability roadmaps",
      "Brands without LCA programs in EU market",
      "Apparel companies committed to SBTi targets",
    ],
    emptyHint: "No brands match. Run new AI research.",
  },
};

function getProfile(et: EntityType): SearchProfile {
  return SEARCH_PROFILES[et] ?? SEARCH_PROFILES["Brand"];
}

const QUERY_PROMPTS: Record<EntityType, string> = Object.fromEntries(
  ENTITY_TYPES.map((t) => [t, getProfile(t).promptSuggestions[0] ?? ""]),
) as Record<EntityType, string>;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function searchInternal(params: {
  query: string;
  countries: string;
  entityType: string;
  industry: string;
  excludeId: string;
}): ResearchCandidate[] {
  const q = params.query.toLowerCase();
  const countries = params.countries
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  const etype = params.entityType.trim().toLowerCase();
  const industry = params.industry.trim().toLowerCase();

  const tokens = q.split(/[\s,]+/).filter((t) => t.length > 2);
  const leadMatch = q.match(/lead\s*(?:time)?\s*(?:<=?|under|less than)?\s*(\d+)/);
  const maxLead = leadMatch ? parseInt(leadMatch[1], 10) : 0;

  return ALL_ENTITIES.filter((e) => e.id !== params.excludeId)
    .map((e) => {
      let score = 0;
      const hay = [
        e.name, e.entityType, e.country, e.region, e.city,
        ...(e.materials || []), ...(e.capabilities || []), ...(e.certifications || []),
        e.description,
      ].join(" ").toLowerCase();

      if (countries.length && countries.some((c) => e.country.toLowerCase().includes(c))) score += 30;
      if (etype && e.entityType.toLowerCase().includes(etype)) score += 25;
      if (industry && hay.includes(industry)) score += 15;
      for (const t of tokens) if (hay.includes(t)) score += 6;
      if (maxLead && e.leadTimeDays && e.leadTimeDays <= maxLead) score += 15;

      return { e, score };
    })
    .filter((r) => r.score >= 25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 25)
    .map<ResearchCandidate>(({ e, score }) => ({
      source: "network",
      id: e.id,
      name: e.name,
      country: e.country,
      city: e.city,
      entityType: e.entityType,
      materials: e.materials,
      capabilities: e.capabilities,
      moq: e.moq,
      leadTimeDays: e.leadTimeDays,
      certifications: e.certifications,
      matchScore: Math.min(99, score),
      rationale: "Matched from GCH network",
    }));
}

export function ResearchWorkspace({ entity }: { entity: Entity }) {
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const runAi = useServerFn(runAiResearch);

  const profile = getProfile(entity.entityType);

  const refresh = () => setRuns(getRunsForOrg(entity.id));

  useEffect(() => {
    refresh();
    const onUpd = () => refresh();
    window.addEventListener("gch:research-runs", onUpd);
    return () => window.removeEventListener("gch:research-runs", onUpd);
  }, [entity.id]);

  const active = useMemo(
    () => runs.find((r) => r.id === activeId) ?? runs[0] ?? null,
    [runs, activeId],
  );

  const counterpart = profile.defaultCounterpart;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Sparkles className="h-6 w-6 text-primary" />
            Research Workspace
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {profile.introVerb} for{" "}
            <span className="font-medium">{entity.name}</span> ({entity.entityType}, {entity.country}).
            Ask in plain language — e.g. <em>{profile.promptSuggestions[0]}</em>.
          </p>
        </div>
        <NewResearchDialog
          open={open}
          onOpenChange={setOpen}
          entity={entity}
          counterpart={counterpart}
          suggestions={profile.promptSuggestions}
          onStart={async (params) => {
            const runId = uid();
            const networkResults = searchInternal({
              query: params.query,
              countries: params.countries,
              entityType: params.entityType,
              industry: params.industry,
              excludeId: entity.id,
            });
            const newRun: ResearchRun = {
              id: runId,
              orgId: entity.id,
              query: params.query,
              params,
              createdAt: Date.now(),
              status: "running",
              results: networkResults,
            };
            createRun(newRun);
            setActiveId(runId);
            setOpen(false);

            try {
              const { candidates } = await runAi({ data: params });
              const ai: ResearchCandidate[] = candidates.map((c) => ({ source: "ai", ...c }));
              updateRun(runId, { status: "done", results: [...networkResults, ...ai] });
              toast.success(`Found ${networkResults.length} in network + ${ai.length} AI suggestions`);
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Research failed";
              updateRun(runId, { status: "failed", error: msg });
              toast.error(msg);
            }
          }}
        />
      </header>

      <NetworkDirectoryCard entity={entity} profile={profile} />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Runs ({runs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 p-2">
            {runs.length === 0 && (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">No runs yet.</div>
            )}
            {runs.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveId(r.id)}
                className={`w-full rounded-md border px-3 py-2 text-left transition hover:bg-muted ${
                  active?.id === r.id ? "border-primary bg-muted" : "border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="line-clamp-1 text-sm font-medium">{r.query}</div>
                  <StatusDot status={r.status} />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                  <span>{r.results.length} results</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!active && (
            <Card className="flex h-[280px] items-center justify-center shadow-sm">
              <div className="text-center">
                <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
                <div className="mt-2 text-sm text-muted-foreground">No research run selected.</div>
                <Button className="mt-4" onClick={() => setOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Start your first research
                </Button>
              </div>
            </Card>
          )}
          {active && (
            <RunResults
              run={active}
              profile={profile}
              onDelete={() => { deleteRun(active.id); setActiveId(null); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function entityToRow(e: Entity): RowData {
  return {
    name: e.name,
    entityType: e.entityType,
    country: e.country,
    city: e.city,
    materials: e.materials,
    capabilities: e.capabilities,
    certifications: e.certifications,
    moq: e.moq,
    leadTimeDays: e.leadTimeDays,
    capacity: e.capacity,
    onTimeRate: e.onTimeRate,
    description: e.description,
  };
}

function candidateToRow(c: ResearchCandidate): RowData {
  return {
    name: c.name,
    entityType: c.entityType,
    country: c.country,
    city: c.city,
    materials: c.materials,
    capabilities: c.capabilities,
    certifications: c.certifications,
    moq: c.moq,
    leadTimeDays: c.leadTimeDays,
    matchScore: c.matchScore,
    rationale: c.rationale,
  };
}

function NetworkDirectoryCard({
  entity,
  profile,
}: {
  entity: Entity;
  profile: SearchProfile;
}) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    etype: profile.defaultCounterpart,
    country: "",
    minOtr: "",
    maxLead: "",
    certContains: "",
    materialContains: "",
  });
  const update = (patch: Partial<FilterState>) => setFilters((f) => ({ ...f, ...patch }));

  const rows = useMemo(() => {
    const s = filters.search.trim().toLowerCase();
    const c = filters.country.trim().toLowerCase();
    const otr = parseInt(filters.minOtr, 10);
    const lead = parseInt(filters.maxLead, 10);
    const cert = filters.certContains.trim().toLowerCase();
    const mat = filters.materialContains.trim().toLowerCase();
    return ALL_ENTITIES.filter((e) => e.id !== entity.id)
      .filter((e) => (filters.etype === "all" ? true : e.entityType === filters.etype))
      .filter((e) => (c ? e.country.toLowerCase().includes(c) : true))
      .filter((e) => (Number.isFinite(otr) ? (e.onTimeRate ?? 0) >= otr : true))
      .filter((e) => (Number.isFinite(lead) ? (e.leadTimeDays ?? 999) <= lead : true))
      .filter((e) =>
        cert ? (e.certifications ?? []).some((x) => x.toLowerCase().includes(cert)) : true,
      )
      .filter((e) =>
        mat ? (e.materials ?? []).some((x) => x.toLowerCase().includes(mat)) : true,
      )
      .filter((e) => {
        if (!s) return true;
        const hay = [e.name, e.country, e.city, ...e.materials, ...e.capabilities, ...e.certifications]
          .join(" ").toLowerCase();
        return hay.includes(s);
      })
      .slice(0, 50);
  }, [filters, entity.id]);

  const columns = profile.columns;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Network className="h-4 w-4" />
          {entity.entityType} sourcing directory
          <Badge variant="secondary" className="ml-1">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {profile.quickFilters.map((qf) => (
            <button
              key={qf.label}
              onClick={() => setFilters((f) => qf.apply(f))}
              className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              + {qf.label}
            </button>
          ))}
          <button
            onClick={() =>
              setFilters({
                search: "", etype: profile.defaultCounterpart, country: "",
                minOtr: "", maxLead: "", certContains: "", materialContains: "",
              })
            }
            className="rounded-full px-2.5 py-0.5 text-[11px] text-muted-foreground hover:underline"
          >
            Reset
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-[1fr_180px_140px_120px_120px_140px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Search name, material, certification…"
              className="pl-8"
            />
          </div>
          <Select value={filters.etype} onValueChange={(v) => update({ etype: v })}>
            <SelectTrigger><SelectValue placeholder="Entity type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entity types</SelectItem>
              {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={filters.country} onChange={(e) => update({ country: e.target.value })} placeholder="Country" />
          <Input value={filters.minOtr} onChange={(e) => update({ minOtr: e.target.value })} placeholder="Min OTR %" inputMode="numeric" />
          <Input value={filters.maxLead} onChange={(e) => update({ maxLead: e.target.value })} placeholder="Max lead d" inputMode="numeric" />
          <Input value={filters.certContains} onChange={(e) => update({ certContains: e.target.value })} placeholder="Cert contains" />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
            {profile.emptyHint}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => (
                    <TableHead key={c.key} className={c.align === "right" ? "text-right" : ""}>{c.label}</TableHead>
                  ))}
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => {
                  const row = entityToRow(e);
                  return (
                    <TableRow key={e.id}>
                      {columns.map((c) => (
                        <TableCell key={c.key} className={c.align === "right" ? "text-right" : ""}>
                          {c.render(row)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/organizations/$id" params={{ id: e.id }}>
                            Open <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: ResearchRun["status"] }) {
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
  if (status === "failed") return <span className="h-2 w-2 rounded-full bg-destructive" />;
  return <span className="h-2 w-2 rounded-full bg-emerald-500" />;
}

function RunResults({
  run, profile, onDelete,
}: {
  run: ResearchRun;
  profile: SearchProfile;
  onDelete: () => void;
}) {
  const network = run.results.filter((r) => r.source === "network");
  const ai = run.results.filter((r) => r.source === "ai");

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base font-semibold">{run.query}</CardTitle>
            <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
              {run.params.countries && <Badge variant="outline">{run.params.countries}</Badge>}
              {run.params.entityType && <Badge variant="outline">{run.params.entityType}</Badge>}
              {run.params.industry && <Badge variant="outline">{run.params.industry}</Badge>}
              <Badge variant="secondary">{run.results.length} results</Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDelete}>Delete run</Button>
        </CardHeader>
      </Card>

      {run.status === "failed" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {run.error || "Research failed."}
          </CardContent>
        </Card>
      )}

      <ResultsSection
        title="From your network"
        icon={<Network className="h-4 w-4" />}
        rows={network}
        columns={profile.columns}
        emptyText="No matching organizations in the GCH network."
        showRationale={false}
      />
      <ResultsSection
        title="Suggested by AI"
        icon={<Globe2 className="h-4 w-4" />}
        rows={ai}
        columns={profile.columns}
        emptyText={run.status === "running" ? "AI is researching…" : "No additional AI suggestions."}
        showRationale
      />
    </div>
  );
}

function ResultsSection({
  title, icon, rows, columns, emptyText, showRationale,
}: {
  title: string;
  icon: React.ReactNode;
  rows: ResearchCandidate[];
  columns: ColumnDef[];
  emptyText: string;
  showRationale: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {icon} {title}
          <Badge variant="secondary" className="ml-1">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyText}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key} className={c.align === "right" ? "text-right" : ""}>{c.label}</TableHead>
                ))}
                {showRationale && <TableHead>Why</TableHead>}
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => {
                const row = candidateToRow(r);
                return (
                  <TableRow key={(r.id ?? r.name) + i}>
                    {columns.map((c) => (
                      <TableCell key={c.key} className={c.align === "right" ? "text-right" : ""}>
                        {c.render(row)}
                      </TableCell>
                    ))}
                    {showRationale && (
                      <TableCell className="max-w-[260px] text-xs text-muted-foreground">
                        {r.rationale || "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {r.id ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/organizations/$id" params={{ id: r.id }}>
                            Open <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => toast.info(`Invite "${r.name}" — coming soon`)}>
                          Invite
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function NewResearchDialog({
  open, onOpenChange, entity, counterpart, suggestions, onStart,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entity: Entity;
  counterpart: EntityType;
  suggestions: string[];
  onStart: (p: {
    query: string;
    countries: string;
    industry: string;
    entityType: string;
    limit: number;
  }) => void;
}) {
  const [query, setQuery] = useState("");
  const [countries, setCountries] = useState("");
  const [industry, setIndustry] = useState("");
  const [entityType, setEntityType] = useState<string>(counterpart);
  const [limit, setLimit] = useState(20);

  const queryPlaceholder = QUERY_PROMPTS[entity.entityType];
  const materialsHint =
    entity.materials.slice(0, 2).join(", ") || "Cotton, polyester, trims";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          New research
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New research for {entity.name}</DialogTitle>
          <DialogDescription>
            Search the GCH network for partners that match{" "}
            <span className="font-medium">{entity.entityType}</span> sourcing needs.
            AI expands the pool beyond our network.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Search query *</Label>
            <Textarea
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={queryPlaceholder}
              className="mt-1 min-h-[80px]"
            />
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="rounded-full border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Countries</Label>
              <Input
                value={countries}
                onChange={(e) => setCountries(e.target.value)}
                placeholder={entity.country}
                className="mt-1"
              />
            </div>
            <div>
              <Label># Results</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 20)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Materials / focus</Label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder={materialsHint}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Entity type</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Searches {ALL_ENTITIES.length} organizations across the GCH network instantly.
            AI suggests additional candidates outside the network.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!query.trim()}
            onClick={() =>
              onStart({
                query: query.trim(),
                countries: countries.trim(),
                industry: industry.trim(),
                entityType: entityType.trim(),
                limit,
              })
            }
          >
            <Sparkles className="mr-1 h-4 w-4" />
            Start research
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Re-export COUNTERPART for potential external consumers
export { COUNTERPART };
