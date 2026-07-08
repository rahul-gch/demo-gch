import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { aiFindings } from "@/lib/ops-derive";
import { Sparkles } from "lucide-react";

export function AIOperations() {
  const items = aiFindings();
  return (
    <Card className="border-sky-100 bg-gradient-to-br from-sky-50/60 via-white to-white shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-4 w-4 text-sky-600" /> AI operations center
        </CardTitle>
        <span className="text-[11px] font-medium uppercase tracking-wider text-sky-700">
          5 findings
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-start justify-between gap-3 rounded-md border bg-white/70 p-3"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-800">{it.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{it.detail}</div>
            </div>
            <Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-xs">
              Review
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
