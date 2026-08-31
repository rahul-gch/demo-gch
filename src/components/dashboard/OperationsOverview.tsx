import type { Entity } from "@/seed/types";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowRight, Factory } from "lucide-react";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50/60 p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 truncate text-sm font-semibold tabular-nums text-slate-900">
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

function Chips({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.slice(0, 8).map((t) => (
          <span
            key={t}
            className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Compact read-only summary — editing lives in Settings. */
export function OperationsOverview({ entity: e }: { entity: Entity }) {
  const params = useParams({ strict: false }) as { id?: string };
  const orgId = params.id ?? e.id;

  return (
    <Card className="h-full shadow-sm">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-center gap-2">
          <Factory className="h-4 w-4 text-slate-500" />
          <div>
            <div className="text-sm font-semibold text-slate-900">Operations Overview</div>
            <div className="text-[11px] text-muted-foreground">
              Production capabilities at a glance
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Lead time" value={e.leadTimeDays ? `${e.leadTimeDays} days` : ""} />
          <Metric label="MOQ" value={e.moq ?? ""} />
          <Metric label="Capacity" value={e.capacity ?? ""} />
          <Metric label="On-time rate" value={e.onTimeRate ? `${e.onTimeRate}%` : ""} />
        </div>

        <div className="mt-4 space-y-3">
          <Chips label="Specializations" items={e.specializations ?? []} />
          <Chips label="Materials" items={e.materials ?? []} />
          <Chips label="Capabilities" items={e.capabilities ?? []} />
        </div>

        <Link
          to="/organizations/$id/settings"
          params={{ id: orgId }}
          hash="entity"
          className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-sky-700 hover:underline"
        >
          View operations <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
