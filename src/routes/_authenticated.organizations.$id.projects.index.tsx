import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { ProjectsIndex } from "@/components/projects/ProjectsIndex";

export const Route = createFileRoute("/_authenticated/organizations/$id/projects/")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  component: ProjectsPage,
});

function ProjectsPage() {
  const { entity } = Route.useLoaderData();
  return <ProjectsIndex entity={entity} />;
}
