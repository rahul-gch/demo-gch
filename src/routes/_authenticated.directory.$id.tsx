import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { refreshRegistry } from "@/lib/registry";
import { getRestrictedOrgTeaser } from "@/lib/admin.functions";
import { RestrictedOrgProfile } from "@/components/directory/RestrictedOrgProfile";

/**
 * Public (network) view of an organization. Parent layout for the profile,
 * its showroom and product pages, and the sample-order form.
 */
export const Route = createFileRoute("/_authenticated/directory/$id")({
  loader: async ({ params, context }) => {
    let entity = getEntity(params.id);
    if (!entity) {
      await refreshRegistry(context.queryClient);
      entity = getEntity(params.id);
    }
    if (!entity) {
      // The organization may exist but be hidden from public discovery.
      const restricted = await getRestrictedOrgTeaser({ data: { idOrSlug: params.id } }).catch(
        () => null,
      );
      if (restricted) return { entity: null, restricted };
      throw notFound();
    }
    return { entity, restricted: null };
  },
  component: DirectoryOrgLayout,
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

function DirectoryOrgLayout() {
  const { restricted } = Route.useLoaderData();
  if (restricted) {
    return (
      <RestrictedOrgProfile
        orgUuid={restricted.orgUuid}
        name={restricted.name}
        logoUrl={restricted.logoUrl}
      />
    );
  }
  return <Outlet />;
}
