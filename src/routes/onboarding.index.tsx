import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createOrg, myOrgMemberships } from "@/lib/orgs.functions";
import { refreshRegistry } from "@/lib/registry";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

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
      const unfinished = memberships.find((m) => !m.onboarding_completed_at);
      if (unfinished) {
        nav({ to: "/onboarding/org/$id", params: { id: unfinished.org_id }, replace: true });
        return;
      }
      // Direct company signup stored the organization basics on the account —
      // create it now so the user lands straight in the tailored questions.
      const pending = data.user.user_metadata?.pending_org as
        | { name?: string; type?: string; country?: string }
        | undefined;
      if (memberships.length === 0 && pending?.name && pending.type && pending.country) {
        try {
          const slug =
            pending.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "org";
          const res = await createOrg({
            data: {
              name: pending.name,
              slug,
              type: pending.type,
              country: pending.country,
              city: null,
              address: null,
              zipCode: null,
              operatingCountries: [pending.country],
              website: null,
            },
          });
          await supabase.auth.updateUser({ data: { pending_org: null } });
          await refreshRegistry(queryClient);
          if (!alive) return;
          nav({ to: "/onboarding/org/$id", params: { id: res.id }, replace: true });
          return;
        } catch {
          /* fall back to the manual form below */
        }
      }
      if (!alive) return;
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [nav, queryClient]);

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
