import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { refreshRegistry } from "@/lib/registry";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { acceptPlatformInvite, lookupPlatformInvite } from "@/lib/admin.functions";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/onboarding/$token")({
  head: () => ({
    meta: [
      { title: "Join Global Chain Hub — onboarding invitation" },
      { name: "description", content: "Accept your onboarding invitation and set up your organization on Global Chain Hub." },
      { property: "og:title", content: "Join Global Chain Hub" },
      { property: "og:description", content: "Accept your onboarding invitation and set up your organization." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { token } = Route.useParams();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user?.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const invite = useQuery({
    queryKey: ["platform-invite", token],
    queryFn: () => lookupPlatformInvite({ data: { token } }),
    retry: false,
  });

  const signInGoogle = async () => {
    sessionStorage.setItem("gch:post-auth", `/onboarding/${token}`);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth/callback",
    });
    if (result.error) toast.error(result.error.message || "Sign in failed");
  };

  const accept = async () => {
    setBusy(true);
    try {
      const res = await acceptPlatformInvite({ data: { token } });
      await refreshRegistry(queryClient);
      if (res.orgId) {
        toast.success("Welcome aboard");
        nav({ to: "/organizations/$id", params: { id: res.orgId }, replace: true });
      } else {
        toast.success("Invitation accepted — create your organization");
        nav({ to: "/signup", search: { tab: "create" as const }, replace: true });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message.replace(/^.*: /, "") : "Could not accept invite");
      setBusy(false);
    }
  };

  const data = invite.data as
    | {
        email: string | null;
        org_name: string | null;
        target_org_id: string | null;
        target_org_name: string | null;
        role: string;
        expires_at: string;
        status: string;
      }
    | null
    | undefined;

  const orgLabel = data?.target_org_name || data?.org_name || null;
  const mismatch = Boolean(
    data?.email && email && data.email.toLowerCase() !== email.toLowerCase(),
  );

  // Once signed in with the right account, take them straight through.
  useEffect(() => {
    if (!data || data.status !== "active" || !email || mismatch || busy) return;
    void accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, email, mismatch]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Onboarding invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invite.isLoading && (
            <p className="text-center text-sm text-muted-foreground">Loading invitation…</p>
          )}
          {(invite.isError || data === null) && !invite.isLoading && (
            <p className="text-center text-sm text-muted-foreground">
              This onboarding link isn't valid.
            </p>
          )}
          {data && (
            <>
              <div className="space-y-2 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Global Chain Hub invited
                </p>
                <p className="text-lg font-semibold break-words">
                  {orgLabel ?? data.email ?? "your organization"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.target_org_id
                    ? "Create your account to set up your organization profile."
                    : "Create your account, then set up your organization profile."}
                </p>
              </div>

              {data.status !== "active" && (
                <p className="text-center text-xs text-muted-foreground">
                  This invitation is no longer valid. Ask the Global Chain Hub team for a new link.
                </p>
              )}

              {data.status === "active" && email === null && (
                <div className="space-y-4">
                  <Button onClick={signInGoogle} variant="outline" className="w-full">
                    Continue with Google
                  </Button>
                  <div className="relative text-center text-xs text-muted-foreground">
                    <span className="bg-card px-2">or use your email</span>
                    <div className="absolute inset-x-0 top-1/2 -z-10 border-t" />
                  </div>
                  <EmailAuthForm mode="signup" compact />
                </div>
              )}

              {data.status === "active" && email && (
                <div className="space-y-2">
                  <p className="text-center text-xs text-muted-foreground">
                    Signed in as <span className="font-medium">{email}</span>
                  </p>
                  {mismatch ? (
                    <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
                      This invitation was sent to <span className="font-medium">{data.email}</span>.
                      Sign in with that account to continue.
                    </p>
                  ) : (
                    <Button onClick={accept} disabled={busy} className="w-full" size="lg">
                      {busy ? "Setting up your workspace…" : "Continue"}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
