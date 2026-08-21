import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ensureRegistry } from "@/lib/registry";
import { myOrgMemberships } from "@/lib/orgs.functions";
import { amIPlatformAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location, context }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: { next: location.href },
      });
    }

    // Users without any organization must first create or join one.
    const [memberships, admin] = await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["my-org-memberships-gate", data.user.id],
        queryFn: () =>
          myOrgMemberships().catch(
            () => [] as Awaited<ReturnType<typeof myOrgMemberships>>,
          ),

        staleTime: 30_000,
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["am-i-platform-admin", data.user.id],
        queryFn: () => amIPlatformAdmin().catch(() => ({ isAdmin: false })),
        staleTime: 60_000,
      }),
    ]);
    if (!admin?.isAdmin && (memberships?.length ?? 0) === 0) {
      throw redirect({ to: "/welcome", replace: true });
    }

    // Organization setup is a separate full-screen flow outside the app shell.
    // Users whose every organization is still mid-setup stay inside it.
    if (!admin?.isAdmin && (memberships?.length ?? 0) > 0) {
      // Only members who can actually edit the organization can finish setup;
      // viewers would otherwise be trapped in a flow they can never complete.
      const canSetUp = (role: string) => role === "owner" || role === "admin" || role === "editor";
      const pending = memberships.filter(
        (m) => !m.onboarding_completed_at && canSetUp(String(m.role)),
      );
      if (pending.length === memberships.length) {
        throw redirect({
          to: "/onboarding/org/$id",
          params: { id: pending[0]!.org_id },
          replace: true,
        });
      }
    }


    // Organization registry must be loaded before child loaders resolve entities.
    await ensureRegistry(context.queryClient);
    return { user: data.user };
  },
  component: () => <Outlet />,
});

