import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { OrderPage } from "@/components/showroom/OrderPage";

const parent = getRouteApi("/_authenticated/directory/$id");

export const Route = createFileRoute("/_authenticated/directory/$id/showroom/$productId/order")({
  head: () => ({
    meta: [
      { title: "Order a sample | Global Chain Hub" },
      {
        name: "description",
        content: "Request a physical sample from a connected partner: quantity, material and shipping.",
      },
      { property: "og:title", content: "Order a sample on Global Chain Hub" },
      { property: "og:description", content: "Sample ordering between connected organizations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const { entity } = parent.useLoaderData();
    const { productId } = Route.useParams();
    if (!entity) return null;
    return <OrderPage entity={entity} productId={productId} />;
  },
});
