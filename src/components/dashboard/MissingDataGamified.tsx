import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildMissingFields } from "@/lib/dashboard-derive";
import { Trophy, Clock } from "lucide-react";

export function MissingDataGamified({ entity }: { entity: Entity }) {
  const missing = buildMissingFields(entity);
  const complete = Math.max(0, 100 - Math.min(100, missing.length * 6));
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">
          <Trophy className="mr-1.5 -mt-0.5 inline h-4 w-4 text-amber-500" />
          Complete your passport
        </CardTitle>
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
          {complete}% complete
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
            style={{ width: `${complete}%` }}
          />
        </div>
        {missing.length === 0 ? (
          <div className="rounded-md border bg-emerald-50 p-4 text-sm text-emerald-800">
            No missing fields — your organization passport is fully complete.
          </div>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {missing.slice(0, 6).map((m) => (
              <li
                key={m.key}
                className="flex items-center justify-between rounded-md border bg-slate-50/60 p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{m.label}</div>
                  <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> Est. {m.estMinutes} min
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                  {m.cta}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
