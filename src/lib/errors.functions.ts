import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_platform_admin", {
    _user: context.userId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — platform admins only.");
}

export const listAppErrors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        hours: z.number().int().min(1).max(720).default(24),
        source: z.enum(["all", "browser", "server"]).default("all"),
        unresolvedOnly: z.boolean().default(true),
        search: z.string().max(200).default(""),
        limit: z.number().int().min(1).max(200).default(100),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const since = new Date(Date.now() - data.hours * 3600_000).toISOString();

    let query = context.supabase
      .from("app_errors")
      .select(
        "id, occurred_at, source, message, stack, route, user_id, org_id, user_agent, resolved_at",
      )
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(data.limit);

    if (data.source !== "all") query = query.eq("source", data.source);
    if (data.unresolvedOnly) query = query.is("resolved_at", null);
    if (data.search.trim()) {
      const term = `%${data.search.trim()}%`;
      query = query.or(`message.ilike.${term},route.ilike.${term}`);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], since };
  });

export const countRecentErrors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { count, error } = await context.supabase
      .from("app_errors")
      .select("id", { count: "exact", head: true })
      .gte("occurred_at", since);
    if (error) throw new Error(error.message);
    return { count: count ?? 0 };
  });

export const resolveAppError = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("app_errors")
      .update({ resolved_at: new Date().toISOString(), resolved_by: context.userId } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
