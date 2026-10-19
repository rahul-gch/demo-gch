import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const DEMO_PASSWORD = "DemoPass2026!";
export const DEMO_ACCOUNTS = {
  admin: { email: "admin@globalchainhub.io", name: "Demo Admin" },
  member: { email: "member@globalchainhub-demo.com", name: "Demo Member" },
} as const;
export type DemoPersona = keyof typeof DEMO_ACCOUNTS;

/** Ensures the fixed demo account exists and is confirmed (demo project only). */
export const ensureDemoAccount = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ persona: z.enum(["admin", "member"]) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const acct = DEMO_ACCOUNTS[data.persona];
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: acct.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: acct.name },
    });
    if (error && !/already|registered|exists/i.test(error.message)) throw new Error(error.message);
    return { email: acct.email };
  });
