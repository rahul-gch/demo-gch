import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { PublicShowroomPage } from "@/components/showroom/PublicShowroomPage";

const parent = getRouteApi("/_authenticated/directory/$id");

export const Route = createFileRoute("/_authenticated/directory/$id/showroom/")({
  head: () => ({
    meta: [
      { title: "Partner showroom | Global Chain Hub" },
      {
        name: "description",
        content: "Browse a partner's product catalogue, materials and order physical samples.",
      },
      { property: "og:title", content: "Partner showroom on Global Chain Hub" },
      { property: "og:description", content: "Product catalogue, materials and sample ordering." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const { entity } = parent.useLoaderData();
    return <PublicShowroomPage entity={entity} />;
  },
});
