import type { Entity } from "@/seed/types";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "@tanstack/react-router";
import { buildCriticalActions } from "@/lib/dashboard-derive";
import { Sparkles, ArrowRight } from "lucide-react";

const DOT: Record<string, string> = {
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  red: "bg-red-500",
};

function routeFor(id: string) {
  if (id === "matches") return "/organizations/$id/matchmaking";
  if (id === "cert" || id === "certs" || id === "risk") return "/organizations/$id/compliance";
  return "/organizations/$id/settings";
}

/** Three short signals — the "what's important today" read. */
export function AiBriefCard({ entity: e }: { entity: Entity }) {
  const params = useParams({ strict: false }) as { id?: string };
  const orgId = params.id ?? e.id;
  const items = buildCriticalActions(e).slice(0, 3);
  const next = items[0];

  return (
    <Card className="h-full shadow-sm">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-600" />
          <div>
            <div className="text-sm font-semibold text-slate-900">AI Brief</div>
            <div className="text-[11px] text-muted-foreground">
              {items.length} thing{items.length === 1 ? "" : "s"} to know
            </div>
          </div>
        </div>

        <ul className="mt-4 space-y-3.5">
          {items.length === 0 && (
            <li className="text-sm text-muted-foreground">
              Nothing needs your attention right now.
            </li>
          )}
          {items.map((a) => (
            <li key={a.id} className="flex gap-2.5">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[a.tone]}`} />
              <div className="min-w-0">
                <div className="text-sm font-medium leading-5 text-slate-800">{a.title}</div>
                <div className="mt-0.5 text-xs leading-4 text-muted-foreground">{a.detail}</div>
              </div>
            </li>
          ))}
        </ul>

        {next && (
          <Link
            to={routeFor(next.id)}
            params={{ id: orgId }}
            className="mt-auto flex items-center justify-between gap-3 rounded-lg bg-sky-50 px-3 py-2.5 pt-2.5 text-left transition-colors hover:bg-sky-100"
          >
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold text-sky-800">
                Recommended next step
              </span>
              <span className="block truncate text-xs text-sky-700">{next.title}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-sky-700" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
