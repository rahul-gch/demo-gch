import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { refreshRegistry } from "@/lib/registry";
import { OrderDetailPage } from "@/components/showroom/OrderDetailPage";

export const Route = createFileRoute("/_authenticated/organizations/$id/showroom/orders/$orderId")({
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
      { title: `Sample order — ${loaderData?.entity.name ?? "Showroom"} | Global Chain Hub` },
      {
        name: "description",
        content: "Sample order details, quote and status timeline.",
      },
      { property: "og:title", content: "Sample order on Global Chain Hub" },
      { property: "og:description", content: "Order details, quote and status timeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const { entity } = Route.useLoaderData();
    const { orderId } = Route.useParams();
    return <OrderDetailPage entity={entity} orderId={orderId} />;
  },
});
