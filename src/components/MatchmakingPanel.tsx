import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Send, CalendarPlus } from "lucide-react";
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
  const [initialAction, setInitialAction] = useState<"message" | "meeting" | null>(null);

  const openWith = (m: MatchSuggestion, action: "message" | "meeting" | null = null) => {
    setActive(m);
    setInitialAction(action);
    setOpen(true);
  };

  return (
    <>
      <div className="space-y-3">
        {matches.map((m) => (
          <Card key={m.entity.id} className="shadow-sm transition hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => openWith(m)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium hover:underline">{m.entity.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {m.entity.entityType}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {m.entity.country}
                    </Badge>
                  </div>
                </button>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openWith(m, "message");
                    }}
                  >
                    <Send className="mr-1 h-3.5 w-3.5" />
                    Send message
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      openWith(m, "meeting");
                    }}
                  >
                    <CalendarPlus className="mr-1 h-3.5 w-3.5" />
                    Request meeting
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5">
                  {m.reasons.map((r) => (
                    <span key={r} className="text-xs text-muted-foreground">
                      · {r}
                    </span>
                  ))}
                </div>
                <div className="flex w-44 items-center gap-2">
                  <Progress value={m.score} className="h-1.5 flex-1" />
                  <span className="text-sm font-semibold tabular-nums">{m.score}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <MatchProfileSheet
        match={active}
        viewer={viewer ?? null}
        open={open}
        onOpenChange={setOpen}
        initialAction={initialAction}
      />
    </>
  );
}
