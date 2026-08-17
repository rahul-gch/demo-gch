import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy in-app profile wizard. Onboarding now lives in its own full-screen
 * flow outside the application shell.
 */
export const Route = createFileRoute("/_authenticated/organizations/$id/profile-setup")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/onboarding/org/$id", params: { id: params.id }, replace: true });
  },
  component: () => null,
});
