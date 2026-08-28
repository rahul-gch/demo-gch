import { useMemo, useState } from "react";
import type { Entity, ActorType } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Plus, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getMatchesFor, type MatchScore } from "@/seed/matchmaking";
import { getEcosystemConnections } from "@/seed/showcase";
import { MatchProfileSheet } from "@/components/MatchProfileSheet";

const ALL_TIERS: ActorType[] = ["Tier 4", "Tier 3", "Tier 2", "Tier 1", "Tier 0"];

export function RecommendedChain({ entity }: { entity: Entity }) {
  const [nonce, setNonce] = useState(0);
  const [selected, setSelected] = useState<MatchScore | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const existing = new Set([
      entity.id,
      ...getEcosystemConnections(entity).map((c) => c.entity.id),
    ]);
    const matches = getMatchesFor(entity, 40, 20).filter((m) => !existing.has(m.entity.id));
    const byTier = new Map<ActorType, MatchScore[]>();
    for (const tier of ALL_TIERS) byTier.set(tier, []);
    for (const m of matches) {
      const t = m.entity.actorType;
      const list = byTier.get(t);
      if (list && list.length < 3) list.push(m);
    }
    return ALL_TIERS.map((tier) => ({ tier, matches: byTier.get(tier) || [] })).filter(
      (g) => g.matches.length > 0,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, nonce]);

  const openProfile = (m: MatchScore) => {
    setSelected(m);
    setSheetOpen(true);
  };
  const addToChain = (m: MatchScore) => {
    setAdded((s) => new Set(s).add(m.entity.id));
    toast.success(`${m.entity.name} added to chain draft`);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Recommended partners for this chain
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            AI suggestions grouped by tier, ranked on material, certification, region and delivery
            fit.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setNonce((n) => n + 1)}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Regenerate
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {grouped.length === 0 && (
          <div className="rounded-lg border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
            No recommendations available yet.
          </div>
        )}
        {grouped.map(({ tier, matches }) => (
          <div key={tier} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                {tier}
              </span>
              <span className="text-xs text-muted-foreground">
                {matches.length} suggestion{matches.length > 1 ? "s" : ""}
              </span>
            </div>
            <ul className="divide-y rounded-lg border">
              {matches.map((m) => (
                <li
                  key={m.entity.id}
                  className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {m.entity.name}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {m.entity.entityType}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {m.entity.country}
                      </Badge>
                      <span className="ml-auto text-xs font-semibold text-slate-700">
                        {m.score}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Progress value={m.score} className="h-1.5" />
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {m.reasons.slice(0, 3).map((r, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-slate-400" /> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button
                      size="sm"
                      onClick={() => addToChain(m)}
                      disabled={added.has(m.entity.id)}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {added.has(m.entity.id) ? "Added" : "Add to chain"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => openProfile(m)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>

      <MatchProfileSheet
        match={
          selected
            ? { entity: selected.entity, score: selected.score, reasons: selected.reasons }
            : null
        }
        viewer={entity}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </Card>
  );
}
