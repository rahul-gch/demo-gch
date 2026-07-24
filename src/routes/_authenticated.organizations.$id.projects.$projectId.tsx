import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { ProjectShell } from "@/components/projects/ProjectShell";
import { useProject } from "@/lib/use-projects";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/organizations/$id/projects/$projectId")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  head: () => ({
    meta: [{ title: "Project workspace | GCH" }],
  }),
  component: ProjectLayout,
});

function ProjectLayout() {
  const { entity } = Route.useLoaderData();
  const { projectId } = Route.useParams();
  const project = useProject(entity, projectId);

  if (!project) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Project not found in your workspace.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProjectShell entity={entity} project={project}>
      <Outlet />
    </ProjectShell>
  );
}

export function useProjectContext() {
  const { entity } = Route.useLoaderData();
  const { projectId } = Route.useParams();
  return { entity, projectId };
}
