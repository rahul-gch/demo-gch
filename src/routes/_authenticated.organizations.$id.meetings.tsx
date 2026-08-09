import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { useActingOrgId, useMeetings } from "@/lib/use-comms";
import { MeetingsWorkspace } from "@/components/meetings/MeetingsWorkspace";


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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Requests received and sent by <span className="font-medium">{entity.name}</span>.
        </p>
      </header>

      <MeetingsWorkspace meetings={meetings} orgId={orgId} isLoading={isLoading} />
    </div>
  );
}

