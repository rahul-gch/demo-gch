import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { refreshRegistry } from "@/lib/registry";
import { PublicOrgProfile } from "@/components/directory/PublicOrgProfile";

export const Route = createFileRoute("/_authenticated/directory/$id")({
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
      { title: `${loaderData?.entity.name ?? "Organization"} — Network profile | GCH` },
      {
        name: "description",
        content:
          loaderData?.entity.description ??
          "Public network profile: capabilities, certifications and contact options.",
      },
    ],
  }),
  component: DirectoryProfilePage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center p-6 text-sm text-muted-foreground">
      Organization not found.
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center p-6 text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
});

function DirectoryProfilePage() {
  const { entity } = Route.useLoaderData();
  return <PublicOrgProfile entity={entity} />;
}
