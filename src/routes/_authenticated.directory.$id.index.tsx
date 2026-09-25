import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { PublicOrgProfile } from "@/components/directory/PublicOrgProfile";

const parent = getRouteApi("/_authenticated/directory/$id");

export const Route = createFileRoute("/_authenticated/directory/$id/")({
  loader: ({ params }) => ({ entity: getEntity(params.id) ?? null }),
  head: ({ loaderData }) => {
    const entity = loaderData?.entity;
    return {
      meta: [
        { title: `${entity?.name ?? "Organization"} — Network profile | Global Chain Hub` },
        {
          name: "description",
          content:
            entity?.description ??
            "Public network profile: capabilities, certifications and contact options.",
        },
        { property: "og:title", content: `${entity?.name ?? "Organization"} on Global Chain Hub` },
        {
          property: "og:description",
          content: "Capabilities, certifications, showroom and contact options.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: DirectoryProfilePage,
});

function DirectoryProfilePage() {
  const { entity } = parent.useLoaderData();
  if (!entity) return null;
  return <PublicOrgProfile entity={entity} />;
}
