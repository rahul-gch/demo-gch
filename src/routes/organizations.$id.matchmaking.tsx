import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Send, CalendarPlus } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getMatchesFor } from "@/seed/matchmaking";
import { getEntity } from "@/seed/all-entities";
import { MatchProfileSheet } from "@/components/MatchProfileSheet";
import type { Entity } from "@/seed/types";


export const Route = createFileRoute("/organizations/$id/matchmaking")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  component: OrgMatchmakingPage,
});

function OrgMatchmakingPage() {
  const { entity } = Route.useLoaderData();
  const [minScore, setMinScore] = useState(50);
  const matches = useMemo(() => getMatchesFor(entity, 100, minScore), [entity, minScore]);

  const [active, setActive] = useState<{ entity: Entity; score: number; reasons: string[] } | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Matchmaking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Partners suggested for <span className="font-medium">{entity.name}</span>, scored on
          material, certification, tier, region, KPI overlap, capacity and delivery reliability.
        </p>
      </header>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {matches.length} matches above {minScore}%
          </CardTitle>
          <div className="flex w-60 items-center gap-2 text-xs text-muted-foreground">
            Min score
            <input
              type="range"
              min={20}
              max={95}
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="w-8 text-right tabular-nums">{minScore}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Lead time</TableHead>
                <TableHead className="w-[200px]">Score</TableHead>
                <TableHead>Why</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((m) => (
                <TableRow
                  key={m.entity.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setActive(m);
                    setOpen(true);
                  }}
                >
                  <TableCell>
                    <div className="font-medium hover:underline">{m.entity.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.entity.entityType} · {m.entity.country}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.entity.actorType}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.entity.leadTimeDays || "—"} d
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-sm font-semibold tabular-nums">{m.score}</span>
                      <Progress value={m.score} className="h-1.5 flex-1" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.reasons.slice(0, 3).map((r) => (
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
                        setActive(m);
                        setOpen(true);
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

      <MatchProfileSheet match={active} viewer={entity} open={open} onOpenChange={setOpen} />
    </div>
  );
}
