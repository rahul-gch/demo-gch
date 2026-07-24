import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Globe2 } from "lucide-react";
import { CreateOrgForm } from "@/components/signup/CreateOrgForm";
import { JoinWithInviteForm } from "@/components/signup/JoinWithInviteForm";

const searchSchema = z.object({ tab: z.enum(["create", "join"]).optional() });

export const Route = createFileRoute("/signup")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Create your organization — Global Chain Hub" },
      { name: "description", content: "Sign up to create a new organization or join an existing one on Global Chain Hub." },
      { property: "og:title", content: "Create your organization — Global Chain Hub" },
      { property: "og:description", content: "Sign up to create a new organization on Global Chain Hub." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { tab } = useSearch({ from: "/signup" });
  const nav = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInGoogle = async () => {
    setSigningIn(true);
    try {
      sessionStorage.setItem("gch:post-auth", "/signup");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth/callback",
      });
      if (result.error) {
        toast.error(result.error.message || "Sign in failed");
        setSigningIn(false);
        return;
      }
      if (result.redirected) return;
      nav({ to: "/signup", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign in failed");
      setSigningIn(false);
    }
  };

  const signedIn = !!email;

  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-2xl py-10">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Globe2 className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold">Global Chain Hub</div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <p className="text-sm text-muted-foreground">
              Create a new organization, or join one you've been invited to.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!checking && !signedIn && (
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="mb-3 text-sm">Sign in with Google first — we'll link your new organization to your account.</p>
                <Button onClick={signInGoogle} disabled={signingIn} className="w-full sm:w-auto">
                  {signingIn ? "Signing in…" : "Continue with Google"}
                </Button>
              </div>
            )}
            {signedIn && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{email}</span>
              </div>
            )}

            <Tabs defaultValue={tab === "join" ? "join" : "create"}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">Create new organization</TabsTrigger>
                <TabsTrigger value="join">Join with invite</TabsTrigger>
              </TabsList>
              <TabsContent value="create" className="pt-4">
                <CreateOrgForm signedIn={signedIn} />
              </TabsContent>
              <TabsContent value="join" className="pt-4">
                <JoinWithInviteForm />
              </TabsContent>
            </Tabs>

            <div className="border-t pt-4 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth" className="text-primary hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
