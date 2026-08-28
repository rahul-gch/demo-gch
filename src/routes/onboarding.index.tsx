import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { myOrgMemberships } from "@/lib/orgs.functions";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { CreateOrgForm } from "@/components/signup/CreateOrgForm";

export const Route = createFileRoute("/onboarding/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set up your organization — Global Chain Hub" },
      {
        name: "description",
        content:
          "Create your organization and complete a short guided setup to start collaborating on Global Chain Hub.",
      },
      { property: "og:title", content: "Set up your organization — Global Chain Hub" },
      {
        property: "og:description",
        content: "A short guided setup for your Global Chain Hub organization.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingStart,
});

function OnboardingStart() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      if (!data.user) {
        nav({ to: "/auth", search: { next: "/onboarding" }, replace: true });
        return;
      }
      // An org may already exist (refresh mid-flow) — continue where we left off.
      const memberships = await myOrgMemberships().catch(() => []);
      if (!alive) return;
      const pending = memberships.find((m) => !m.onboarding_completed_at);
      if (pending) {
        nav({ to: "/onboarding/org/$id", params: { id: pending.org_id }, replace: true });
        return;
      }
      if (memberships.length > 0) {
        nav({ to: "/", replace: true });
        return;
      }
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [nav]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <OnboardingLayout
      step={0}
      total={2}
      title="Create your organization"
      description="Just the basics — you'll answer a few tailored questions next."
    >
      <div className="mx-auto w-full max-w-2xl">
        <CreateOrgForm
          signedIn
          onCreated={(id) => nav({ to: "/onboarding/org/$id", params: { id }, replace: true })}
        />
      </div>
    </OnboardingLayout>
  );
}
