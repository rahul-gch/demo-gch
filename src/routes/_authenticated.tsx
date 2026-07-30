import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ensureRegistry } from "@/lib/registry";

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
    // Organization registry must be loaded before child loaders resolve entities.
    await ensureRegistry(context.queryClient);
    return { user: data.user };
  },
  component: () => <Outlet />,
});
