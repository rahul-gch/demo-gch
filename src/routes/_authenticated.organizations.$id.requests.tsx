import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Inbox, ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";
import { getEntity } from "@/seed/all-entities";
import { useOrgRequests } from "@/lib/use-projects";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Entity } from "@/seed/types";
import type { InboxRequest } from "@/lib/projects-types";

import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/organizations/$id/requests")({
  loader: async ({ params, context }) => {
    let entity = getEntity(params.id);
    if (!entity) {
      await refreshRegistry(context.queryClient);
      entity = getEntity(params.id);
    }
    if (!entity) throw notFound();
    return { entity };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Requests — ${loaderData?.entity.name ?? "Organization"} | GCH` },
      {
        name: "description",
        content:
          "Inbound and outbound project requests: data, samples, certificates, audits and verifications.",
      },
      { property: "og:title", content: `Requests — ${loaderData?.entity.name ?? "Organization"}` },
      {
        property: "og:description",
        content: "Track every request your organization owes and is owed across shared projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-sm text-muted-foreground">Not found.</div>,
  component: RequestsPage,
});

const PRIORITY_TONE: Record<string, string> = {
  Urgent: "bg-red-100 text-red-700 border-red-200",
  High: "bg-amber-100 text-amber-700 border-amber-200",
  Medium: "bg-blue-100 text-blue-700 border-blue-200",
  Low: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_TONE: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700 border-blue-200",
  "In Progress": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Waiting for Response": "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Rejected: "bg-slate-100 text-slate-700 border-slate-200",
};

function RequestRow({ r, entity }: { r: InboxRequest; entity: Entity }) {
  return (
    <Link
      to="/organizations/$id/projects/$projectId/requests"
      params={{ id: entity.id, projectId: r.projectId }}
      className="block"
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground">
              {r.direction === "inbound" ? (
                <ArrowDownLeft className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium">{r.title}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {r.projectName} · due {new Date(r.dueDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge variant="outline" className={PRIORITY_TONE[r.priority]}>
              {r.priority}
            </Badge>
            <Badge variant="outline" className={STATUS_TONE[r.status]}>
              {r.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RequestsPage() {
  const { entity } = Route.useLoaderData();
  const requests = useOrgRequests(entity);
  const [q, setQ] = useState("");

  const { inbound, outbound } = useMemo(() => {
    const s = q.trim().toLowerCase();
    const match = (r: InboxRequest) =>
      !s ||
      r.title.toLowerCase().includes(s) ||
      r.projectName.toLowerCase().includes(s) ||
      r.description.toLowerCase().includes(s);
    return {
      inbound: requests.filter((r) => r.direction === "inbound" && match(r)),
      outbound: requests.filter((r) => r.direction === "outbound" && match(r)),
    };
  }, [requests, q]);

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything {entity.name} owes and is owed across shared projects — data, samples, RFQs,
          audits and verifications.
        </p>
      </header>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search requests…"
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="inbound">
        <TabsList>
          <TabsTrigger value="inbound">Inbound ({inbound.length})</TabsTrigger>
          <TabsTrigger value="outbound">Outbound ({outbound.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="inbound" className="mt-4 space-y-3">
          {inbound.map((r) => (
            <RequestRow key={r.id} r={r} entity={entity} />
          ))}
          {inbound.length === 0 && <EmptyState label="No inbound requests." />}
        </TabsContent>
        <TabsContent value="outbound" className="mt-4 space-y-3">
          {outbound.map((r) => (
            <RequestRow key={r.id} r={r} entity={entity} />
          ))}
          {outbound.length === 0 && <EmptyState label="No outbound requests." />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
        <Inbox className="h-6 w-6" />
        {label}
      </CardContent>
    </Card>
  );
}
