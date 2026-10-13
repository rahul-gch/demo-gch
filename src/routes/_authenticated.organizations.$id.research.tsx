import { createFileRoute, notFound } from "@tanstack/react-router";
import { AdminOnly } from "@/components/AdminOnly";
import { getEntity } from "@/seed/all-entities";
import { ResearchWorkspace } from "@/components/ResearchWorkspace";
import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/organizations/$id/research")({
  loader: async ({ params, context }) => {
    let entity = getEntity(params.id);
    if (!entity) {
      await refreshRegistry(context.queryClient);
      entity = getEntity(params.id);
    }
    if (!entity) throw notFound();
    return { entity };
  },
  component: () => <AdminOnly><OrgResearchPage /></AdminOnly>,
});

function OrgResearchPage() {
  const { entity } = Route.useLoaderData();
  return <ResearchWorkspace entity={entity} />;
}
