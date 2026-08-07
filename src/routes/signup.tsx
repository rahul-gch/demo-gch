import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe2 } from "lucide-react";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create your account — Global Chain Hub" },
      {
        name: "description",
        content:
          "Create your Global Chain Hub account, then create a new organization or join an existing one.",
      },
      { property: "og:title", content: "Create your account — Global Chain Hub" },
      {
        property: "og:description",
        content: "Create your Global Chain Hub account in seconds.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) nav({ to: "/welcome", replace: true });
    });
  }, [nav]);

  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-md py-10">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Globe2 className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold">Global Chain Hub</div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <p className="text-sm text-muted-foreground">
              First create your personal account. Next you'll create a new organization or join an
              existing one with an invite.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <EmailAuthForm mode="signup" onSignedIn={() => nav({ to: "/welcome", replace: true })} />
            <div className="border-t pt-4 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
