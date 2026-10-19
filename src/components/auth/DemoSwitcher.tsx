import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Shield, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  ensureDemoAccount,
  type DemoPersona,
} from "@/lib/demo-accounts.functions";

export function useDemoSignIn() {
  const ensure = useServerFn(ensureDemoAccount);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<DemoPersona | null>(null);
  const signIn = async (persona: DemoPersona) => {
    setBusy(persona);
    try {
      await ensure({ data: { persona } });
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_ACCOUNTS[persona].email,
        password: DEMO_PASSWORD,
      });
      if (error) throw error;
      window.location.assign("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Demo sign-in failed");
      setBusy(null);
    }
  };
  return { signIn, busy };
}

/** Quick demo sign-in buttons for the sign-in page. */
export function DemoQuickLogin() {
  const { signIn, busy } = useDemoSignIn();
  return (
    <div className="space-y-2 rounded-md border border-dashed p-3">
      <p className="text-center text-xs font-medium text-muted-foreground">Demo quick access</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" disabled={!!busy} onClick={() => signIn("admin")}>
          {busy === "admin" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
          Admin
        </Button>
        <Button variant="outline" size="sm" disabled={!!busy} onClick={() => signIn("member")}>
          {busy === "member" ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
          Member
        </Button>
      </div>
    </div>
  );
}

/** Header pill that switches between the demo personas in one click. */
export function DemoRoleSwitcher() {
  const { signIn, busy } = useDemoSignIn();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);
  const current: DemoPersona | null =
    email === DEMO_ACCOUNTS.admin.email ? "admin" : email === DEMO_ACCOUNTS.member.email ? "member" : null;
  const target: DemoPersona = current === "admin" ? "member" : "admin";
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 shrink-0 gap-1.5 rounded-full px-2.5 text-xs"
      disabled={!!busy}
      onClick={() => signIn(target)}
      title={`Switch to demo ${target}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : target === "admin" ? <Shield className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">
        {current ? `${current === "admin" ? "Admin" : "Member"} → ` : "Demo: "}
        {target === "admin" ? "Admin" : "Member"}
      </span>
    </Button>
  );
}
