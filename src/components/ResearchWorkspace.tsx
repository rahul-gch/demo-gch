import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Sparkles, Plus, Globe2, Network, Loader2, ArrowUpRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { Entity } from "@/seed/types";
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

  // crude lead/moq parsing: "lead time 30", "moq 500"
  const leadMatch = q.match(/lead\s*(?:time)?\s*(?:<=?|under|less than)?\s*(\d+)/);
  const maxLead = leadMatch ? parseInt(leadMatch[1], 10) : 0;

  return ALL_ENTITIES.filter((e) => e.id !== params.excludeId)
    .map((e) => {
      let score = 0;
      const hay = [
        e.name,
        e.entityType,
        e.country,
        e.region,
        e.city,
        ...(e.materials || []),
        ...(e.capabilities || []),
        ...(e.certifications || []),
        e.description,
      ]
        .join(" ")
        .toLowerCase();

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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Sparkles className="h-6 w-6 text-primary" />
            Research Workspace
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Discover partners across the GCH network and beyond for{" "}
            <span className="font-medium">{entity.name}</span>. Ask in natural language —
            "manufacturers in Egypt with MOQ under 500 and lead time 30 days".
          </p>
        </div>
        <NewResearchDialog
          open={open}
          onOpenChange={setOpen}
          entity={entity}
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
              const ai: ResearchCandidate[] = candidates.map((c) => ({
                source: "ai",
                ...c,
              }));
              updateRun(runId, {
                status: "done",
                results: [...networkResults, ...ai],
              });
              toast.success(
                `Found ${networkResults.length} in network + ${ai.length} AI suggestions`,
              );
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Research failed";
              updateRun(runId, { status: "failed", error: msg });
              toast.error(msg);
            }
          }}
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Runs ({runs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 p-2">
            {runs.length === 0 && (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No runs yet.
              </div>
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
            <Card className="flex h-[420px] items-center justify-center shadow-sm">
              <div className="text-center">
                <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
                <div className="mt-2 text-sm text-muted-foreground">
                  No research run selected.
                </div>
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

function StatusDot({ status }: { status: ResearchRun["status"] }) {
  if (status === "running")
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
  if (status === "failed")
    return <span className="h-2 w-2 rounded-full bg-destructive" />;
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
  title,
  icon,
  rows,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  rows: ResearchCandidate[];
  emptyText: string;
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
                        <Badge key={m} variant="outline" className="text-[10px] font-normal">
                          {m}
                        </Badge>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.info(`Invite "${r.name}" — coming soon`)}
                      >
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
  open,
  onOpenChange,
  entity,
  onStart,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entity: Entity;
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
  const [entityType, setEntityType] = useState("");
  const [limit, setLimit] = useState(20);

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
            Search across the GCH network and let AI expand the candidate pool for{" "}
            <span className="font-medium">{entity.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Search query *</Label>
            <Textarea
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. knit fabric mills supplying premium activewear brands in Turkey"
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Countries</Label>
              <Input
                value={countries}
                onChange={(e) => setCountries(e.target.value)}
                placeholder="Turkey, Portugal"
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
              <Label>Industry</Label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Knitwear, denim, trims…"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Entity type</Label>
              <Input
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                placeholder="Garment Factory, Mill…"
                className="mt-1"
              />
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Searches the GCH network instantly and uses Lovable AI to suggest additional
            candidates. Larger # results = longer AI run.
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
