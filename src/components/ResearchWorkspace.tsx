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

const QUERY_PROMPTS: Record<EntityType, string> = {
  "Brand": "Tier 2 spinners in Türkiye with GOTS and MOQ under 500 kg",
  "Garment Factory": "Trim and accessory suppliers in South Asia delivering within 21 days",
  "Fabric Mill": "Spinners offering combed cotton Ne 30+ with OEKO-TEX",
  "Spinner": "Ginners in India with BCI-certified seed cotton",
  "Ginner": "Organic cotton farmers within 300 km of our gin",
  "Farmer": "Ginners accepting organic seed cotton with fair pricing",
  "Dye House": "Fabric mills sourcing low-impact reactive dyeing",
  "Logistics Provider": "Garment factories shipping LCL to EU monthly",
  "Certification Body": "Mills and factories due for GOTS recertification this quarter",
  "Sustainability Partner": "Brands publishing Tier 2 traceability roadmaps",
};

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

  const counterpart = COUNTERPART[entity.entityType] ?? "Garment Factory";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Sparkles className="h-6 w-6 text-primary" />
            Research Workspace
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Search the GCH network for partners that match{" "}
            <span className="font-medium">{entity.name}</span> ({entity.entityType}, {entity.country}).
            Ask in plain language — e.g. <em>{QUERY_PROMPTS[entity.entityType]}</em>.
          </p>
        </div>
        <NewResearchDialog
          open={open}
          onOpenChange={setOpen}
          entity={entity}
          counterpart={counterpart}
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

      <NetworkDirectoryCard entity={entity} defaultEntityType={counterpart} />

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
          {active && <RunResults run={active} onDelete={() => { deleteRun(active.id); setActiveId(null); }} />}
        </div>
      </div>
    </div>
  );
}

function NetworkDirectoryCard({
  entity,
  defaultEntityType,
}: {
  entity: Entity;
  defaultEntityType: EntityType;
}) {
  const [search, setSearch] = useState("");
  const [etype, setEtype] = useState<string>(defaultEntityType);
  const [country, setCountry] = useState<string>(entity.country);
  const [minOtr, setMinOtr] = useState<string>("");
  const [maxLead, setMaxLead] = useState<string>("");

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    const c = country.trim().toLowerCase();
    const otr = parseInt(minOtr, 10);
    const lead = parseInt(maxLead, 10);
    return ALL_ENTITIES.filter((e) => e.id !== entity.id)
      .filter((e) => (etype === "all" ? true : e.entityType === etype))
      .filter((e) => (c ? e.country.toLowerCase().includes(c) : true))
      .filter((e) => (Number.isFinite(otr) ? (e.onTimeRate ?? 0) >= otr : true))
      .filter((e) => (Number.isFinite(lead) ? (e.leadTimeDays ?? 999) <= lead : true))
      .filter((e) => {
        if (!s) return true;
        const hay = [e.name, e.country, e.city, ...e.materials, ...e.capabilities, ...e.certifications]
          .join(" ").toLowerCase();
        return hay.includes(s);
      })
      .slice(0, 50);
  }, [search, etype, country, minOtr, maxLead, entity.id]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Network className="h-4 w-4" />
          GCH network directory
          <Badge variant="secondary" className="ml-1">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-[1fr_180px_160px_140px_140px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, material, certification…"
              className="pl-8"
            />
          </div>
          <Select value={etype} onValueChange={setEtype}>
            <SelectTrigger><SelectValue placeholder="Entity type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entity types</SelectItem>
              {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
          />
          <Input
            value={minOtr}
            onChange={(e) => setMinOtr(e.target.value)}
            placeholder="Min on-time %"
            inputMode="numeric"
          />
          <Input
            value={maxLead}
            onChange={(e) => setMaxLead(e.target.value)}
            placeholder="Max lead days"
            inputMode="numeric"
          />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
            No GCH organizations match these filters. Try a New Research run to expand with AI.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Materials</TableHead>
                  <TableHead>MOQ</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>On-time</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="font-medium">{e.name}</div>
                      <div className="text-[11px] text-muted-foreground">{e.gchNumber}</div>
                    </TableCell>
                    <TableCell className="text-xs">{e.entityType}</TableCell>
                    <TableCell className="text-xs">{[e.city, e.country].filter(Boolean).join(", ")}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(e.materials ?? []).slice(0, 3).map((m) => (
                          <Badge key={m} variant="outline" className="text-[10px] font-normal">{m}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{e.moq || "—"}</TableCell>
                    <TableCell className="text-xs">{e.leadTimeDays ? `${e.leadTimeDays}d` : "—"}</TableCell>
                    <TableCell className="text-xs">{e.onTimeRate != null ? `${e.onTimeRate}%` : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/organizations/$id" params={{ id: e.id }}>
                          Open <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

function RunResults({ run, onDelete }: { run: ResearchRun; onDelete: () => void }) {
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
        emptyText="No matching organizations in the GCH network."
      />
      <ResultsSection
        title="Suggested by AI"
        icon={<Globe2 className="h-4 w-4" />}
        rows={ai}
        emptyText={run.status === "running" ? "AI is researching…" : "No additional AI suggestions."}
      />
    </div>
  );
}

function ResultsSection({
  title, icon, rows, emptyText,
}: {
  title: string; icon: React.ReactNode; rows: ResearchCandidate[]; emptyText: string;
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
                <TableHead>Organization</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead>MOQ</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={(r.id ?? r.name) + i}>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.entityType}
                      {r.matchScore ? ` · ${r.matchScore}% match` : ""}
                      {r.rationale && r.source === "ai" ? ` · ${r.rationale}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[r.city, r.country].filter(Boolean).join(", ")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(r.materials ?? []).slice(0, 3).map((m) => (
                        <Badge key={m} variant="outline" className="text-[10px] font-normal">{m}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{r.moq || "—"}</TableCell>
                  <TableCell className="text-xs">{r.leadTimeDays ? `${r.leadTimeDays}d` : "—"}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function NewResearchDialog({
  open, onOpenChange, entity, counterpart, onStart,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entity: Entity;
  counterpart: EntityType;
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
          <DialogTitle>New research</DialogTitle>
          <DialogDescription>
            Search the GCH network for partners that match{" "}
            <span className="font-medium">{entity.name}</span> ({entity.entityType},{" "}
            {entity.country}). AI expands the pool beyond our network.
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
