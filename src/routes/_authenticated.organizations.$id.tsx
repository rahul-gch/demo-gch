import { useEffect } from "react";
import { createFileRoute, Link, Outlet, notFound, redirect } from "@tanstack/react-router";
import { OrgShell } from "@/components/OrgShell";
import { getEntity } from "@/seed/all-entities";
import { refreshRegistry } from "@/lib/registry";
import { myOrgMemberships } from "@/lib/orgs.functions";
import { amIPlatformAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/components/RouteErrorFallback";

export const Route = createFileRoute("/_authenticated/organizations/$id")({
  loader: async ({ params, context }) => {
    let entity = getEntity(params.id);
    if (!entity) {
      // The org may have just been created (or created elsewhere) — refresh once.
      await refreshRegistry(context.queryClient);
      entity = getEntity(params.id);
    }
    if (!entity) throw notFound();

    // Canonicalize raw UUID in URL to clean slug if available
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    if (isUuid && entity.slug && entity.slug !== params.id) {
      throw redirect({
        to: "/organizations/$id",
        params: { id: entity.slug },
        replace: true,
      });
    }

    // Only members of this organization (and platform admins) get the internal
    // workspace. Everyone else sees the read-only public network profile.
    const userId = (context as { user?: { id?: string } }).user?.id ?? "anon";
    const [memberships, admin] = await Promise.all([
      context.queryClient
        .ensureQueryData({
          queryKey: ["my-org-memberships-gate", userId],
          queryFn: () => myOrgMemberships(),
          staleTime: 10_000,
        })
        .catch(() => [] as { org_id: string }[]),
      context.queryClient
        .ensureQueryData({
          queryKey: ["am-i-platform-admin", userId],
          queryFn: () => amIPlatformAdmin(),
          staleTime: 30_000,
        })
        .catch(() => ({ isAdmin: false })),
    ]);

    const belongs = (list: { org_id: string }[] | undefined | null) => {
      const ids = new Set((list ?? []).map((m) => m.org_id));
      return (
        (entity?.orgUuid && ids.has(entity.orgUuid)) ||
        (entity?.id && ids.has(entity.id)) ||
        (entity?.slug && ids.has(entity.slug)) ||
        ids.has(params.id)
      );
    };

    let isMember = belongs(memberships);
    if (!isMember && !admin?.isAdmin) {
      // Re-check once with a fresh call before sending to public profile
      const fresh = await myOrgMemberships().catch(() => null);
      if (fresh && fresh.length > 0) {
        context.queryClient.setQueryData(["my-org-memberships-gate", userId], fresh);
        isMember = belongs(fresh);
      }
      if (!isMember) {
        const freshAdmin = await amIPlatformAdmin().catch(() => ({ isAdmin: false }));
        if (freshAdmin?.isAdmin) isMember = true;
      }
    }
    if (!isMember && !admin?.isAdmin) {
      throw redirect({ to: "/directory/$id", params: { id: params.id } });
    }

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

  useEffect(() => {
    if (typeof window !== "undefined" && entity) {
      const activeRef = entity.slug || entity.id;
      if (activeRef) localStorage.setItem("gch_active_org", activeRef);
    }
  }, [entity]);

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
            <Link to="/welcome">Create an organization</Link>
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

function OrgError({ error }: { error?: unknown }) {
  return <Shell title="Couldn't load this organization" body={errorMessage(error)} />;
}
