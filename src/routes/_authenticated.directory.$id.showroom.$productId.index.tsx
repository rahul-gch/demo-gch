import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { ProductDetailPage } from "@/components/showroom/ProductDetailPage";

const parent = getRouteApi("/_authenticated/directory/$id");

export const Route = createFileRoute("/_authenticated/directory/$id/showroom/$productId/")({
  head: () => ({
    meta: [
      { title: "Showroom product | Global Chain Hub" },
      {
        name: "description",
        content: "Full product specification, materials, imagery and sample ordering.",
      },
      { property: "og:title", content: "Showroom product on Global Chain Hub" },
      { property: "og:description", content: "Product specifications, materials and sample ordering." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const { entity } = parent.useLoaderData();
    const { productId } = Route.useParams();
    return <ProductDetailPage entity={entity} productId={productId} mode="public" />;
  },
});
