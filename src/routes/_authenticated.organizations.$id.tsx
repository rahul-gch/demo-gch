import { createFileRoute, Link, Outlet, notFound } from "@tanstack/react-router";
import { OrgShell } from "@/components/OrgShell";
import { getEntity } from "@/seed/all-entities";
import { refreshRegistry } from "@/lib/registry";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/organizations/$id")({
  loader: async ({ params, context }) => {
    let entity = getEntity(params.id);
    if (!entity) {
      // The org may have just been created (or created elsewhere) — refresh once.
      await refreshRegistry(context.queryClient);
      entity = getEntity(params.id);
    }
    if (!entity) throw notFound();
    return { entity };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.entity.name ?? "Organization"} — Global Chain Hub` },
      { name: "description", content: loaderData?.entity.description ?? "Organization workspace." },
    ],
  }),
  component: OrgLayout,
  errorComponent: OrgError,
  notFoundComponent: OrgNotFound,
});

function OrgLayout() {
  const { entity } = Route.useLoaderData();
  return (
    <OrgShell entity={entity}>
      <Outlet />
    </OrgShell>
  );
}

function Shell({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{body}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/organizations">All organizations</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/signup">Create an organization</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrgNotFound() {
  return (
    <Shell
      title="Organization not found"
      body="This organization doesn't exist, or you don't have access to it yet."
    />
  );
}

function OrgError({ error }: { error: Error }) {
  return <Shell title="Couldn't load this organization" body={error.message} />;
}
