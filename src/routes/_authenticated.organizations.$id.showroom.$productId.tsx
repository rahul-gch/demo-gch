import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { refreshRegistry } from "@/lib/registry";
import { ProductDetailPage } from "@/components/showroom/ProductDetailPage";

export const Route = createFileRoute("/_authenticated/organizations/$id/showroom/$productId")({
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
      {
        title: `Product — ${loaderData?.entity.name ?? "Showroom"} | Global Chain Hub`,
      },
      {
        name: "description",
        content:
          "Full product specification, materials, imagery and sample ordering for this showroom listing.",
      },
      { property: "og:title", content: `Showroom product — ${loaderData?.entity.name ?? ""}` },
      {
        property: "og:description",
        content: "Product specifications, materials and sample ordering on Global Chain Hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductRoute,
});

function ProductRoute() {
  const { entity } = Route.useLoaderData();
  const { productId } = Route.useParams();
  return <ProductDetailPage entity={entity} productId={productId} />;
}
