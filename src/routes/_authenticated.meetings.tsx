import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ActingOrgSwitcher } from "@/components/messages/ActingOrgSwitcher";
import { AppShell } from "@/components/AppShell";
import { useActingOrgId, useMeetings } from "@/lib/use-comms";
import { MeetingsWorkspace } from "@/components/meetings/MeetingsWorkspace";


export const Route = createFileRoute("/_authenticated/meetings")({
  head: () => ({
    meta: [
      { title: "Meetings — Global Chain Hub" },
      {
        name: "description",
        content: "Meeting requests between organizations across the Global Chain Hub network.",
      },
      { property: "og:title", content: "Meetings — Global Chain Hub" },
      {
        property: "og:description",
        content: "Meeting requests between organizations across the network.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const [preferred, setPreferred] = useState<string | null>(null);
  const orgId = useActingOrgId(preferred);
  const { meetings, isLoading } = useMeetings(orgId);
  const respond = useSetMeetingStatus();
  const buckets = bucketMeetings(meetings);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 px-2">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Meeting requests across matched organizations. Sent from any match detail panel.
            </p>
          </div>
          <ActingOrgSwitcher value={orgId} onChange={setPreferred} />
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
                    {isLoading ? "Loading meetings…" : `No ${k.toLowerCase()} meetings.`}
                  </CardContent>
                </Card>
              ) : (
                buckets[k].map((m) => (
                  <MeetingCard
                    key={m.id}
                    m={m}
                    viewerOrgId={orgId}
                    busy={respond.isPending}
                    onRespond={(id, status) => respond.mutate({ id, status })}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppShell>
  );
}
