import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { ShowroomWorkspace } from "@/components/showroom/ShowroomWorkspace";

import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/organizations/$id/showroom")({
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
      { title: `Showroom — ${loaderData?.entity.name ?? "Organization"} | Global Chain Hub` },
      {
        name: "description",
        content: "Product catalogue, materials, fabric specifications, and sample ordering.",
      },
    ],
  }),
  component: ShowroomPage,
});

function ShowroomPage() {
  const { entity } = Route.useLoaderData();
  return <ShowroomWorkspace entity={entity} />;
}
