import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle2, X, Users } from "lucide-react";
import { getMeetings, updateMeetingStatus, type MeetingRequest } from "@/seed/comms";
import { getEntity } from "@/seed/all-entities";
import { useCommsVersion } from "@/lib/use-comms";
import { OrgAvatar } from "@/components/messages/shared";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_authenticated/meetings")({
  head: () => ({ meta: [{ title: "Meetings — Global Chain Hub" }] }),
  component: MeetingsPage,
});

function MeetingsPage() {
  useCommsVersion();
  const all = getMeetings();
  const now = Date.now();
  const buckets = {
    Pending: all.filter((m) => m.status === "Pending" && new Date(m.proposedFor).getTime() >= now),
    Confirmed: all.filter((m) => m.status === "Confirmed" && new Date(m.proposedFor).getTime() >= now),
    Past: all.filter(
      (m) =>
        m.status === "Past" ||
        new Date(m.proposedFor).getTime() < now ||
        m.status === "Declined",
    ),
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 px-2">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Meeting requests across matched organizations. Sent from any match detail panel.
          </p>
        </header>

        <Tabs defaultValue="Pending">
          <TabsList>
            <TabsTrigger value="Pending">Pending ({buckets.Pending.length})</TabsTrigger>
            <TabsTrigger value="Confirmed">Confirmed ({buckets.Confirmed.length})</TabsTrigger>
            <TabsTrigger value="Past">Past / Declined ({buckets.Past.length})</TabsTrigger>
          </TabsList>
          {(["Pending", "Confirmed", "Past"] as const).map((k) => (
            <TabsContent key={k} value={k} className="space-y-3">
              {buckets[k].length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-10 text-center text-sm text-muted-foreground">
                    No {k.toLowerCase()} meetings.
                  </CardContent>
                </Card>
              ) : (
                buckets[k].map((m) => <MeetingCard key={m.id} m={m} />)
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppShell>
  );
}

function statusTone(s: MeetingRequest["status"]) {
  switch (s) {
    case "Confirmed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Declined":
      return "border-red-200 bg-red-50 text-red-700";
    case "Past":
      return "border-muted bg-muted text-muted-foreground";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function MeetingCard({ m }: { m: MeetingRequest }) {
  const dt = new Date(m.proposedFor);
  const entity = getEntity(m.orgId);
  return (
    <Card className="rounded-2xl shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {entity ? (
            <OrgAvatar entity={entity} size={44} showStatus={false} />
          ) : (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to="/organizations/$id"
                params={{ id: m.orgId }}
                className="truncate text-base font-semibold tracking-tight hover:underline"
              >
                {m.orgName}
              </Link>
              <Badge variant="outline" className={cn("shrink-0", statusTone(m.status))}>
                {m.status}
              </Badge>
            </div>
            {entity && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {entity.entityType} · {entity.country}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {dt.toLocaleDateString()}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {m.durationMin}m
              </span>
            </div>
            <p className="mt-3 text-sm text-foreground/80">{m.agenda}</p>
          </div>
        </div>

        {m.status === "Pending" && (
          <div className="flex shrink-0 gap-2 sm:flex-col">
            <Button size="sm" onClick={() => updateMeetingStatus(m.id, "Confirmed")}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirm
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateMeetingStatus(m.id, "Declined")}>
              <X className="mr-1 h-3.5 w-3.5" /> Decline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
