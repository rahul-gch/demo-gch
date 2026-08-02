import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

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
            <CardTitle>Set up your organization</CardTitle>
            <p className="text-sm text-muted-foreground">
              One short form — account and organization. You can complete the full profile later in
              Settings.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {signedIn && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{email}</span>
              </div>
            )}

            <Tabs defaultValue={tab === "join" ? "join" : "create"}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">New organization</TabsTrigger>
                <TabsTrigger value="join">I have an invite</TabsTrigger>
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
