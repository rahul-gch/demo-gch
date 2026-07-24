import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { ResearchWorkspace } from "@/components/ResearchWorkspace";

export const Route = createFileRoute("/_authenticated/organizations/$id/research")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  component: OrgResearchPage,
});

function OrgResearchPage() {
  const { entity } = Route.useLoaderData();
  return <ResearchWorkspace entity={entity} />;
}
