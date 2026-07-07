import type { Entity } from "@/seed/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildAiSummary, greetingForNow } from "@/lib/dashboard-derive";
import { computeNhri } from "@/lib/nhri";
import { Sparkles, Wand2, ShieldAlert, UserPlus } from "lucide-react";

export function AICommandCenter({ entity }: { entity: Entity }) {
  const nhri = computeNhri(entity);
  const summary = buildAiSummary(entity, nhri.score, "Rahul");
  const { greet } = greetingForNow();

  return (
    <Card className="border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-700">
              <Sparkles className="h-3.5 w-3.5" /> AI Command Center
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              {greet}, Rahul. Your organization health is {nhri.score}.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{summary.paragraph}</p>
            <ul className="mt-3 grid gap-1.5 text-sm text-slate-700 sm:grid-cols-2">
              <li>• {summary.missingDocs} missing data points</li>
              <li>• {summary.matches} organizations matched</li>
              <li>• {summary.attentionProjects} project needs attention</li>
              <li>• {summary.updatedCerts} suppliers have updated certifications</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm">
            <Wand2 className="mr-1.5 h-3.5 w-3.5" /> Complete missing data
          </Button>
          <Button size="sm" variant="outline">
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Review supplier risk
          </Button>
          <Button size="sm" variant="outline">
            <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Invite new partner
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
