import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getTopPairs } from "@/seed/matchmaking";

export const Route = createFileRoute("/matchmaking")({
  head: () => ({
    meta: [
      { title: "Matchmaking — Global Chain Hub" },
      { name: "description", content: "Suggested partner pairs across the full GCH registry, scored on materials, certifications, tier complementarity, region, KPI overlap and capacity." },
    ],
  }),
  component: MatchmakingPage,
});

function MatchmakingPage() {
  const [country, setCountry] = useState("");
  const [material, setMaterial] = useState("");
  const [minScore, setMinScore] = useState(60);

  const pairs = useMemo(() => getTopPairs(200, minScore), [minScore]);
  const filtered = pairs.filter((p) => {
    if (country && ![p.from.country, p.entity.country].some((c) => c?.toLowerCase().includes(country.toLowerCase()))) return false;
    if (material && ![...p.from.materials, ...p.entity.materials].some((m) => m.toLowerCase().includes(material.toLowerCase()))) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Matchmaking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suggested partner pairs across the full registry of {pairs.length > 0 ? "189" : "0"} entities.
            Scoring uses material overlap, certification overlap, tier complementarity, region, KPI compatibility and capacity fit.
          </p>
        </header>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Country contains</div>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Portugal" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Material contains</div>
              <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. cotton" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Min score: {minScore}</div>
              <input type="range" min={30} max={95} value={minScore} onChange={(e) => setMinScore(parseInt(e.target.value))} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Top matches ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization A</TableHead>
                  <TableHead>Organization B</TableHead>
                  <TableHead>Tiers</TableHead>
                  <TableHead className="w-[200px]">Score</TableHead>
                  <TableHead>Why</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 80).map((p) => (
                  <TableRow key={`${p.from.id}-${p.entity.id}`}>
                    <TableCell>
                      <Link to="/organizations/$id" params={{ id: p.from.id }} className="font-medium hover:underline">
                        {p.from.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{p.from.entityType} · {p.from.country}</div>
                    </TableCell>
                    <TableCell>
                      <Link to="/organizations/$id" params={{ id: p.entity.id }} className="font-medium hover:underline">
                        {p.entity.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{p.entity.entityType} · {p.entity.country}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.from.actorType} ↔ {p.entity.actorType}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-8 text-sm font-semibold tabular-nums">{p.score}</span>
                        <Progress value={p.score} className="h-1.5 flex-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.reasons.slice(0, 3).map((r) => (
                          <Badge key={r} variant="secondary" className="text-[10px] font-normal">{r}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
