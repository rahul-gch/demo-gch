import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { FeedWorkspace } from "@/components/feed/FeedWorkspace";
import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/organizations/$id/feed")({
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
      { title: `Feed — ${loaderData?.entity.name ?? "Organization"} | GCH` },
      {
        name: "description",
        content: "Sustainability-only community feed: updates, regulations, events, partnerships.",
      },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const { entity } = Route.useLoaderData();
  return <FeedWorkspace entity={entity} />;
}
