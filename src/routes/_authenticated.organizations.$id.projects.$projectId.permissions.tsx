import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { useProject } from "@/lib/use-projects";
import { PermissionsPanel } from "@/components/projects/panels";

export const Route = createFileRoute("/_authenticated/organizations/$id/projects/$projectId/permissions")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  component: Page,
});

function Page() {
  const { entity } = Route.useLoaderData();
  const { projectId } = Route.useParams();
  const project = useProject(entity, projectId);
  if (!project) return null;
  return <PermissionsPanel entity={entity} project={project} />;
}
