import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "@tanstack/react-router";
import {
  buildCriticalActions,
  buildMissingFields,
  buildOpportunities,
} from "@/lib/dashboard-derive";
import { isSeededOrg } from "@/seed/showcase";
import { ArrowRight, ListChecks } from "lucide-react";

type Tone = "amber" | "sky" | "red";

const TONE_DOT: Record<Tone, string> = {
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  red: "bg-red-500",
};

const TONE_BADGE: Record<Tone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  sky: "border-sky-200 bg-sky-50 text-sky-800",
  red: "border-red-200 bg-red-50 text-red-800",
};

interface QueueRow {
  id: string;
  tone: Tone;
  title: string;
  why: string;
  cta: string;
  to: string;
  hash?: string;
}

/**
 * Single prioritized "what should I do today" list — merges the old critical
 * actions strip with the AI command center's suggestions.
 */
export function ActionQueue({ entity }: { entity: Entity }) {
  const params = useParams({ strict: false }) as { id?: string };
  const orgId = params.id ?? entity.id;
  const seeded = isSeededOrg(entity);
  const missing = buildMissingFields(entity);

  const rows: QueueRow[] = [];

  if (missing.length > 0) {
    rows.push({
      id: "missing",
      tone: missing.length > 4 ? "amber" : "sky",
      title: `Complete ${missing.length} profile field${missing.length === 1 ? "" : "s"}`,
      why: `Missing ${missing
        .slice(0, 3)
        .map((m) => m.label)
        .join(", ")} — each field raises your readiness score and matchmaking reach.`,
      cta: "Complete data",
      to: "/organizations/$id/settings",
      hash: "entity",
    });
  }

  if (entity.certifications.length === 0) {
    rows.push({
      id: "certs",
      tone: "amber",
      title: "Add your certifications",
      why: "Partners filter by verified certificates before they open a conversation.",
      cta: "Upload",
      to: "/organizations/$id/compliance",
    });
  }

  for (const a of buildCriticalActions(entity)) {
    if (rows.some((r) => r.id === a.id)) continue;
    if (a.id === "profile" && rows.some((r) => r.id === "missing")) continue;
    rows.push({
      id: a.id,
      tone: a.tone,
      title: a.title,
      why: a.detail,
      cta: a.cta,
      to:
        a.id === "matches"
          ? "/organizations/$id/matchmaking"
          : a.id === "cert" || a.id === "risk"
            ? "/organizations/$id/compliance"
            : "/organizations/$id/settings",
    });
  }

  rows.push({
    id: "partners",
    tone: "sky",
    title: seeded ? "Grow your partner network" : "Invite your team and partners",
    why: "Connected organizations unlock showroom access, sample orders and shared projects.",
    cta: "Invite",
    to: "/organizations/$id/settings",
    hash: "members",
  });

  for (const o of buildOpportunities(entity)) {
    rows.push({
      id: `opp-${o.title}`,
      tone: "sky",
      title: o.title,
      why: [o.detail, o.value, o.fit != null ? `${o.fit}% fit` : null].filter(Boolean).join(" · "),
      cta: o.kind === "research" ? "Explore" : "View",
      to:
        o.kind === "partner"
          ? "/organizations/$id/matchmaking"
          : o.kind === "research"
            ? "/organizations/$id/research"
            : "/organizations/$id/projects",
    });
  }

  const queue = rows.slice(0, 4);

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ListChecks className="h-4 w-4 text-sky-600" /> Recommended Actions
        </CardTitle>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
          {queue.length} task{queue.length === 1 ? "" : "s"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-1">
        {queue.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[r.tone]}`} />
              <div className="min-w-0">
                <div className="text-sm font-medium leading-5 text-slate-800">{r.title}</div>
                <div className="mt-0.5 line-clamp-2 text-xs leading-4 text-muted-foreground">
                  {r.why}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              asChild
              className={`h-7 shrink-0 self-start px-3 text-xs sm:self-center ${TONE_BADGE[r.tone]}`}
            >
              <Link to={r.to} params={{ id: orgId }} hash={r.hash}>
                {r.cta}
              </Link>
            </Button>
          </div>
        ))}
        {rows.length > queue.length && (
          <Link
            to="/organizations/$id/settings"
            params={{ id: orgId }}
            hash="entity"
            className="inline-flex items-center gap-1 pt-3 text-xs font-medium text-sky-700 hover:underline"
          >
            View all actions <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

