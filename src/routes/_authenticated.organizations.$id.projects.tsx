import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/organizations/$id/projects")({
  loader: async ({ params, context }) => {
    let entity = getEntity(params.id);
    if (!entity) {
      await refreshRegistry(context.queryClient);
      entity = getEntity(params.id);
    }
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
