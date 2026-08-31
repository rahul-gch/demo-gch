import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTopPairs } from "@/seed/matchmaking";
import { MatchProfileSheet } from "@/components/MatchProfileSheet";
import type { Entity } from "@/seed/types";

export const Route = createFileRoute("/_authenticated/matchmaking")({
  head: () => ({
    meta: [
      { title: "Matchmaking — Global Chain Hub" },
      {
        name: "description",
        content:
          "Suggested partner pairs across the full GCH registry, scored on materials, certifications, tier complementarity, region, KPI overlap, capacity and delivery.",
      },
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
    if (
      country &&
      ![p.from.country, p.entity.country].some((c) =>
        c?.toLowerCase().includes(country.toLowerCase()),
      )
    )
      return false;
    if (
      material &&
      ![...p.from.materials, ...p.entity.materials].some((m) =>
        m.toLowerCase().includes(material.toLowerCase()),
      )
    )
      return false;
    return true;
  });

  const [active, setActive] = useState<{ entity: Entity; score: number; reasons: string[] } | null>(
    null,
  );
  const [viewer, setViewer] = useState<Entity | null>(null);
  const [open, setOpen] = useState(false);
  const openMatch = (from: Entity, to: Entity, score: number, reasons: string[]) => {
    setViewer(from);
    setActive({ entity: to, score, reasons });
    setOpen(true);
  };

  return (
    <AppShell>
      <div className="w-full space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Matchmaking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suggested partner pairs across the full registry. Scoring uses material overlap,
            certifications, tier complementarity, region, KPI compatibility, capacity and delivery
            reliability. Click any row to view full match details, message or request a meeting.
          </p>
        </header>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Country contains</div>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Portugal"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Material contains</div>
              <Input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. cotton"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Min score: {minScore}</div>
              <input
                type="range"
                min={30}
                max={95}
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="w-full"
              />
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
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 80).map((p) => (
                  <TableRow
                    key={`${p.from.id}-${p.entity.id}`}
                    className="cursor-pointer"
                    onClick={() => openMatch(p.from, p.entity, p.score, p.reasons)}
                  >
                    <TableCell>
                      <span className="font-medium hover:underline">{p.from.name}</span>
                      <div className="text-xs text-muted-foreground">
                        {p.from.entityType} · {p.from.country}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium hover:underline">{p.entity.name}</span>
                      <div className="text-xs text-muted-foreground">
                        {p.entity.entityType} · {p.entity.country}
                      </div>
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
                          <Badge key={r} variant="secondary" className="text-[10px] font-normal">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMatch(p.from, p.entity, p.score, p.reasons);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <MatchProfileSheet match={active} viewer={viewer} open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}
