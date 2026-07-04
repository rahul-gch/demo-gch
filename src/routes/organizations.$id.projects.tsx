import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { ProjectsIndex } from "@/components/projects/ProjectsIndex";

export const Route = createFileRoute("/organizations/$id/projects")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Projects — ${loaderData?.entity.name ?? "Organization"} | GCH` },
      {
        name: "description",
        content: "Partner collaboration workspaces for shared sustainability projects.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { entity } = Route.useLoaderData();
  return <ProjectsIndex entity={entity} />;
}
