import { QueryClient, QueryClientProvider, useSuspenseQuery } from "@tanstack/react-query";
import { entitiesQueryOptions, ensureRegistry } from "@/lib/registry";
import { hydrateEntities, isRegistryHydrated } from "@/seed/all-entities";

import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { installGlobalErrorReporting, reportClientError } from "@/lib/error-log";


import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async ({ context }) => {
    await ensureRegistry(context.queryClient);
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Global Chain Hub" },
      { name: "description", content: "Sustainability-first supply chain collaboration platform for brands, manufacturers, auditors, and NGOs." },
      { property: "og:title", content: "Global Chain Hub" },
      { property: "og:description", content: "Sustainability-first supply chain collaboration platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => installGlobalErrorReporting(), []);

  useEffect(() => {
    let mounted = true;
    void import("@/integrations/supabase/client").then(({ supabase }) => {
      if (!mounted) return;
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === "INITIAL_SESSION") {
          // The root loader may have cached an empty registry during SSR (no
          // bearer). Invalidate just the entities query so it refetches with
          // the now-available client-side session. This is a single targeted
          // invalidation per page load — not a router.invalidate or full cache
          // flush — so it does not cause thrashing.
          queryClient.invalidateQueries({ queryKey: ["entities", "registry"] });
          // Membership/admin answers fetched before the bearer was attached
          // must not survive into the signed-in session.
          queryClient.removeQueries({ queryKey: ["my-org-memberships-gate"] });
          queryClient.removeQueries({ queryKey: ["am-i-platform-admin"] });
          return;
        }
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        queryClient.removeQueries({ queryKey: ["my-org-memberships-gate"] });
        queryClient.removeQueries({ queryKey: ["am-i-platform-admin"] });
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();

      });
      subRef.current = data.subscription;
    });
    return () => {
      mounted = false;
      subRef.current?.unsubscribe();
    };
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <RegistryGate>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </RegistryGate>
      <Toaster richColors closeButton position="top-center" />
    </QueryClientProvider>
  );
}


/** Hydrates the client-side organization registry before routes render. */
function RegistryGate({ children }: { children: React.ReactNode }) {
  const { data } = useSuspenseQuery(entitiesQueryOptions);
  if (data && !isRegistryHydrated()) hydrateEntities(data);
  return <>{children}</>;
}



