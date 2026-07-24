import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";

export const Route = createFileRoute("/_authenticated/_authenticated/organizations/$id/projects")({
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
  component: () => <Outlet />,
});
