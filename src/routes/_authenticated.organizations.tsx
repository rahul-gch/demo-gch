import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_authenticated/organizations")({
  component: () => <Outlet />,
});
