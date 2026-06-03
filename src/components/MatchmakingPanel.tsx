import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { MatchSuggestion } from "@/seed/showcase";

export function MatchmakingPanel({ matches }: { matches: MatchSuggestion[] }) {
  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <Card key={m.entity.id} className="shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{m.entity.name}</span>
                <Badge variant="secondary" className="text-[10px]">{m.entity.entityType}</Badge>
                <Badge variant="outline" className="text-[10px]">{m.entity.country}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {m.reasons.map((r) => (
                  <span key={r} className="text-xs text-muted-foreground">· {r}</span>
                ))}
              </div>
            </div>
            <div className="flex w-44 flex-col items-end gap-1">
              <div className="text-sm font-semibold tabular-nums">{m.score}% match</div>
              <Progress value={m.score} className="h-1.5 w-full" />
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/organizations/$id" params={{ id: m.entity.id }}>
                Open match
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
