import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { PublicOrgProfile } from "@/components/directory/PublicOrgProfile";

const parent = getRouteApi("/_authenticated/directory/$id");

export const Route = createFileRoute("/_authenticated/directory/$id/")({
  head: ({ match }) => {
    const entity = (match.context as { entity?: { name?: string; description?: string } })?.entity;
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
  return <PublicOrgProfile entity={entity} />;
}
