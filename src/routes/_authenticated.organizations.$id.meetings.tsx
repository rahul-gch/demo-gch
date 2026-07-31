import { createFileRoute, notFound } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getEntity } from "@/seed/all-entities";
import { useActingOrgId, useMeetings, useSetMeetingStatus } from "@/lib/use-comms";
import { MeetingCard, bucketMeetings } from "@/components/meetings/MeetingCard";

export const Route = createFileRoute("/_authenticated/organizations/$id/meetings")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  head: () => ({
    meta: [
      { title: "Organization meetings — Global Chain Hub" },
      {
        name: "description",
        content: "Meeting requests sent and received by this organization.",
      },
      { property: "og:title", content: "Organization meetings — Global Chain Hub" },
      {
        property: "og:description",
        content: "Meeting requests sent and received by this organization.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrgMeetingsPage,
});

function OrgMeetingsPage() {
  const { entity } = Route.useLoaderData();
  const orgId = useActingOrgId(entity.orgUuid ?? null);
  const { meetings, isLoading } = useMeetings(orgId);
  const respond = useSetMeetingStatus();
  const buckets = bucketMeetings(meetings);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Meeting requests involving <span className="font-medium">{entity.name}</span>.
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
  );
}
