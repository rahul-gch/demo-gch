import type { Entity } from "@/seed/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildCriticalActions } from "@/lib/dashboard-derive";
import { AlertTriangle, ArrowRight } from "lucide-react";

const toneMap = {
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  sky: "border-sky-200 bg-sky-50 text-sky-900",
  red: "border-red-200 bg-red-50 text-red-900",
} as const;

export function CriticalActionsStrip({ entity }: { entity: Entity }) {
  const actions = buildCriticalActions(entity);
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          Critical actions
        </h3>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {actions.map((a) => (
          <Card key={a.id} className={`border ${toneMap[a.tone]} shadow-sm`}>
            <CardContent className="p-4">
              <div className="text-sm font-semibold">{a.title}</div>
              <div className="mt-1 text-xs opacity-80">{a.detail}</div>
              <Button size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs">
                {a.cta} <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
