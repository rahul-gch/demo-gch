import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { SupplyChainPage } from "@/components/supply-chain/SupplyChainPage";

import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/organizations/$id/supply-chain")({
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
      { title: `Supply Chain Mapping — ${loaderData?.entity.name ?? "Organization"} | GCH` },
      { name: "description", content: "Upload, visualize and extend the supplier network." },
    ],
  }),
  component: Page,
});

function Page() {
  const { entity } = Route.useLoaderData();
  return <SupplyChainPage entity={entity} />;
}
