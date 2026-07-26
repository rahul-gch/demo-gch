import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, CalendarPlus } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getMatchesFor } from "@/seed/matchmaking";
import { getEntity } from "@/seed/all-entities";
import { MatchProfileSheet } from "@/components/MatchProfileSheet";
import { MatchScoreInfo } from "@/components/MatchScoreInfo";
import { AiPartnerSearch, applyPartnerFilters } from "@/components/AiPartnerSearch";
import type { PartnerSearchFilters } from "@/lib/matchmaking-ai.functions";
import type { Entity } from "@/seed/types";


export const Route = createFileRoute("/_authenticated/organizations/$id/matchmaking")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  component: OrgMatchmakingPage,
});

function OrgMatchmakingPage() {
  const { entity } = Route.useLoaderData();
  const [aiFilters, setAiFilters] = useState<PartnerSearchFilters | null>(null);
  const [material, setMaterial] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const rawMatches = useMemo(() => getMatchesFor(entity, 200, 40), [entity]);
  const matches = useMemo(() => {
    let m = rawMatches;
    if (material) m = m.filter((x) => x.entity.materials.some((mm) => mm.toLowerCase() === material.toLowerCase()));
    if (category) m = m.filter((x) => x.entity.productCategories?.some((c) => c.toLowerCase() === category.toLowerCase()));
    return applyPartnerFilters(m.map((x) => ({ ...x, ...x.entity })), aiFilters).map((x) => rawMatches.find((r) => r.entity.id === x.entity.id)!).filter(Boolean);
  }, [rawMatches, aiFilters, material, category]);

  const isBrand = entity.entityType === "Brand";
  const chipOptions = isBrand
    ? ["Women", "Men", "Kids", "Baby", "Unisex"]
    : ["Cotton", "Denim", "Wool", "Viscose", "Polyester", "Linen", "Silk"];

  const [active, setActive] = useState<{ entity: Entity; score: number; reasons: string[] } | null>(null);
  const [open, setOpen] = useState(false);
  const [initialAction, setInitialAction] = useState<"message" | "meeting" | null>(null);

  const openWith = (
    m: { entity: Entity; score: number; reasons: string[] },
    action: "message" | "meeting" | null = null,
  ) => {
    setActive(m);
    setInitialAction(action);
    setOpen(true);
  };



  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Matchmaking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Partners suggested for <span className="font-medium">{entity.name}</span>, scored on
          material, certification, tier, region, KPI overlap, capacity and delivery reliability.
        </p>
      </header>

      <AiPartnerSearch onFilters={setAiFilters} />

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => { setMaterial(null); setCategory(null); }}
          className={`rounded-full border px-2.5 py-0.5 text-xs ${!material && !category ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
        >
          All
        </button>
        {chipOptions.map((c) => {
          const active = isBrand ? category === c : material === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => isBrand ? setCategory(active ? null : c) : setMaterial(active ? null : c)}
              className={`rounded-full border px-2.5 py-0.5 text-xs ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            {matches.length} suggested partners
            <MatchScoreInfo />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Lead time</TableHead>
                <TableHead>Why</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((m) => (
                <TableRow key={m.entity.id} className="cursor-pointer" onClick={() => openWith(m)}>
                  <TableCell>
                    <div className="font-medium hover:underline">{m.entity.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.entity.entityType} · {m.entity.country}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); openWith(m, "message"); }}>
                        <Send className="mr-1 h-3.5 w-3.5" /> Message
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openWith(m, "meeting"); }}>
                        <CalendarPlus className="mr-1 h-3.5 w-3.5" /> Meeting
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.entity.actorType}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.entity.leadTimeDays || "—"} d</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.reasons.slice(0, 3).map((r) => (
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


      <MatchProfileSheet
        match={active}
        viewer={entity}
        open={open}
        onOpenChange={setOpen}
        initialAction={initialAction}
      />

    </div>
  );
}
