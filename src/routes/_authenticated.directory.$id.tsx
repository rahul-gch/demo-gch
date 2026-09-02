import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { refreshRegistry } from "@/lib/registry";

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
    if (!entity) throw notFound();
    return { entity };
  },
  component: () => <Outlet />,
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
