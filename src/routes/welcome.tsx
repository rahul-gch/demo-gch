import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Globe2, Loader2, Mail, Plus } from "lucide-react";
import { JoinWithInviteForm } from "@/components/signup/JoinWithInviteForm";

export const Route = createFileRoute("/welcome")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Get started — Global Chain Hub" },
      {
        name: "description",
        content:
          "Create a new organization or join an existing one to start collaborating on Global Chain Hub.",
      },
      { property: "og:title", content: "Get started — Global Chain Hub" },
      {
        property: "og:description",
        content: "Create a new organization or join an existing one on Global Chain Hub.",
      },
    ],
  }),
  component: WelcomePage,
});

type Step = "choose" | "create" | "join";

function WelcomePage() {
  const nav = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>("choose");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        nav({ to: "/auth", search: { next: "/welcome" }, replace: true });
        return;
      }
      setEmail(data.user.email ?? null);
      setReady(true);
    });
  }, [nav]);

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/auth", search: { next: undefined }, replace: true });
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-2xl py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Globe2 className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">Global Chain Hub</div>
          </div>
          <button onClick={signOut} className="text-xs text-muted-foreground hover:underline">
            Sign out
          </button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              {step === "choose"
                ? "Welcome — let's connect you to an organization"
                : step === "create"
                  ? "Create a new organization"
                  : "Join an existing organization"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {step === "choose"
                ? "Your account is ready. Every workspace on Global Chain Hub belongs to an organization."
                : step === "create"
                  ? "One short form — you can complete the full profile right after."
                  : "Paste the invite link or token an admin shared with you."}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {email && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{email}</span>
              </div>
            )}

            {step === "choose" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => nav({ to: "/onboarding" })}
                  className="group rounded-xl border bg-card p-5 text-left transition hover:border-primary hover:shadow-md"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="font-semibold">Create a new organization</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Set up a workspace for your company, NGO, government body or lab.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setStep("join")}
                  className="group rounded-xl border bg-card p-5 text-left transition hover:border-primary hover:shadow-md"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="font-semibold">Join an existing organization</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use an invite link or token from an admin of that organization.
                  </p>
                </button>
              </div>
            ) : (
              <JoinWithInviteForm />
            )}

            {step !== "choose" && (
              <Button variant="ghost" size="sm" onClick={() => setStep("choose")}>
                Back to options
              </Button>
            )}

            <div className="flex items-center justify-center gap-1 border-t pt-4 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              Need help?{" "}
              <Link to="/legal/terms" className="text-primary hover:underline">
                Terms
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
