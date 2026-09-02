import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { RouteErrorFallback, RouteNotFoundFallback } from "./components/RouteErrorFallback";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Any loader/component failure renders a recoverable page instead of a
    // blank screen — including values thrown that aren't Error instances.
    defaultErrorComponent: ({ error }) => <RouteErrorFallback error={error} />,
    defaultNotFoundComponent: () => <RouteNotFoundFallback />,
  });

  if (typeof window !== "undefined") (window as any).__router = router; // DEBUG-TMP
  return router;
};
