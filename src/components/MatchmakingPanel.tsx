import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { MatchSuggestion } from "@/seed/showcase";
import type { Entity } from "@/seed/types";
import { MatchProfileSheet } from "./MatchProfileSheet";

export function MatchmakingPanel({
  matches,
  viewer,
}: {
  matches: MatchSuggestion[];
  viewer?: Entity | null;
}) {
  const [active, setActive] = useState<MatchSuggestion | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-3">
        {matches.map((m) => (
          <Card key={m.entity.id} className="shadow-sm transition hover:shadow-md">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  setActive(m);
                  setOpen(true);
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium hover:underline">{m.entity.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{m.entity.entityType}</Badge>
                  <Badge variant="outline" className="text-[10px]">{m.entity.country}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {m.reasons.map((r) => (
                    <span key={r} className="text-xs text-muted-foreground">· {r}</span>
                  ))}
                </div>
              </button>
              <div className="flex w-44 flex-col items-end gap-1">
                <div className="text-sm font-semibold tabular-nums">{m.score}% match</div>
                <Progress value={m.score} className="h-1.5 w-full" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActive(m);
                  setOpen(true);
                }}
              >
                View & connect
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <MatchProfileSheet match={active} viewer={viewer ?? null} open={open} onOpenChange={setOpen} />
    </>
  );
}
