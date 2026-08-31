import type { Entity } from "@/seed/types";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "@tanstack/react-router";
import { buildMissingFields } from "@/lib/dashboard-derive";
import { ArrowRight, Clock } from "lucide-react";

/** Single home for passport completeness on the overview. */
export function PassportProgressCard({ entity: e }: { entity: Entity }) {
  const params = useParams({ strict: false }) as { id?: string };
  const orgId = params.id ?? e.id;
  const missing = buildMissingFields(e);
  const pct = Math.max(0, Math.min(100, e.profileCompleteness));
  const next = missing[0];

  return (
    <Card className="h-full shadow-sm">
      <CardContent className="flex h-full flex-col p-5">
        <div className="text-sm font-semibold text-slate-900">Passport</div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-semibold leading-none tabular-nums text-slate-900">
            {pct}%
          </span>
          <span className="text-xs text-muted-foreground">complete</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {missing.length === 0
            ? "All core fields are filled in."
            : `${missing.length} item${missing.length === 1 ? "" : "s"} remaining`}
        </div>

        {next && (
          <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border bg-slate-50/60 px-3 py-2">
            <span className="min-w-0 truncate text-xs font-medium text-slate-700">
              {next.label}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" /> ~{next.estMinutes} min
            </span>
          </div>
        )}

        <Link
          to="/organizations/$id/settings"
          params={{ id: orgId }}
          hash="entity"
          className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-sky-700 hover:underline"
        >
          Complete now <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
