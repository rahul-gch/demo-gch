import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle2, X } from "lucide-react";
import { getMeetings, updateMeetingStatus, type MeetingRequest } from "@/seed/comms";
import { useCommsVersion } from "@/lib/use-comms";

export const Route = createFileRoute("/meetings")({
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
    Past: all.filter((m) => m.status === "Past" || new Date(m.proposedFor).getTime() < now || m.status === "Declined"),
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
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
                <Card>
                  <CardContent className="p-8 text-center text-sm text-muted-foreground">
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

function MeetingCard({ m }: { m: MeetingRequest }) {
  const dt = new Date(m.proposedFor);
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            <Link to="/organizations/$id" params={{ id: m.orgId }} className="hover:underline">
              {m.orgName}
            </Link>
          </CardTitle>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {dt.toLocaleDateString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {m.durationMin}m
            </span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            m.status === "Confirmed"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : m.status === "Declined"
                ? "border-red-200 bg-red-50 text-red-700"
                : ""
          }
        >
          {m.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-700">{m.agenda}</p>
        {m.status === "Pending" && (
          <div className="mt-3 flex gap-2">
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
