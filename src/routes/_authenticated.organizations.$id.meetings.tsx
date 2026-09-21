import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { useViewedOrg, useMeetings } from "@/lib/use-comms";
import { MeetingsWorkspace } from "@/components/meetings/MeetingsWorkspace";
import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/organizations/$id/meetings")({
  loader: async ({ params, context }) => {
    let entity = getEntity(params.id);
    if (!entity) {
      await refreshRegistry(context.queryClient);
      entity = getEntity(params.id);
    }
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
  const { orgId, isMember } = useViewedOrg(entity.orgUuid ?? null);
  const { meetings, isLoading } = useMeetings(orgId);

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Requests received and sent by <span className="font-medium">{entity.name}</span>.
        </p>
        {!isMember && (
          <p className="mt-2 inline-flex rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-800">
            Viewing as platform admin — read only. You are not a member of {entity.name}.
          </p>
        )}
      </header>

      <MeetingsWorkspace
        meetings={meetings}
        orgId={orgId}
        isLoading={isLoading}
        readOnly={!isMember}
      />
    </div>
  );
}
