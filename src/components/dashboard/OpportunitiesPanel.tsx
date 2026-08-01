import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildOpportunities } from "@/lib/dashboard-derive";
import { Landmark, Handshake, FlaskConical, Sparkles } from "lucide-react";

const ICONS = { grant: Landmark, partner: Handshake, research: FlaskConical } as const;

export function OpportunitiesPanel({ entity }: { entity: Entity }) {
  const items = buildOpportunities(entity);
  if (items.length === 0) return null;
  return (
    <Card className="border-amber-100 bg-gradient-to-br from-amber-50/70 via-white to-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          <Sparkles className="mr-1.5 -mt-0.5 inline h-4 w-4 text-amber-500" />
          AI opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((o, i) => {
            const Icon = ICONS[o.kind];
            return (
              <div key={i} className="rounded-lg border bg-card p-4">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold">{o.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{o.detail}</div>
                {o.value && (
                  <Badge className="mt-2 border-transparent bg-amber-500/15 text-amber-800">
                    {o.value}
                  </Badge>
                )}
                {o.fit != null && (
                  <Badge className="mt-2 border-transparent bg-emerald-500/15 text-emerald-800">
                    {o.fit}% fit
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
