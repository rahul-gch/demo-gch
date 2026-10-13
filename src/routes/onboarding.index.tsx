import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  markVerificationLater,
  submitVerificationDocument,
  takePendingVerificationFile,
} from "@/lib/verification";
import { supabase } from "@/integrations/supabase/client";
import { createOrg, myOrgMemberships } from "@/lib/orgs.functions";
import { refreshRegistry } from "@/lib/registry";
import { useQueryClient } from "@tanstack/react-query";

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
        nav({ to: "/signup", replace: true });
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
        | { name?: string; type?: string; country?: string; verification?: string }
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
          try {
            const file = await takePendingVerificationFile();
            if (file) await submitVerificationDocument(res.id, file);
            else await markVerificationLater(res.id);
          } catch {
            /* the dashboard reminder lets them upload again */
          }
          await supabase.auth.updateUser({ data: { pending_org: null } });
          await refreshRegistry(queryClient);
          if (!alive) return;
          nav({ to: "/onboarding/org/$id", params: { id: res.id }, replace: true });
          return;
        } catch {
          /* fall through to the welcome page */
        }
      }
      if (!alive) return;
      // No organization and no pending signup details — let the user choose
      // how to proceed (create or join) on the welcome page.
      nav({ to: "/welcome", replace: true });
    })();
    return () => {
      alive = false;
    };
  }, [nav, queryClient]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}
