import { supabase } from "@/integrations/supabase/client";
import { amIPlatformAdmin } from "@/lib/admin.functions";

/**
 * Platform-admin check for route guards. Tries the server check first, then
 * falls back to a direct database check with the browser session so a
 * not-yet-attached token right after sign-in never reads as "not an admin".
 */
export async function checkPlatformAdmin(): Promise<{ isAdmin: boolean }> {
  const server = await amIPlatformAdmin().catch(() => ({ isAdmin: false }));
  if (server?.isAdmin) return { isAdmin: true };
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return { isAdmin: false };
    const { data: ok, error } = await supabase.rpc("is_platform_admin", { _user: userId });
    return { isAdmin: !error && Boolean(ok) };
  } catch {
    return { isAdmin: false };
  }
}
