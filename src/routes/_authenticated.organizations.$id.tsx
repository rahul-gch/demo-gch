import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { OrgShell } from "@/components/OrgShell";
import { getEntity } from "@/seed/all-entities";

export const Route = createFileRoute("/_authenticated/organizations/$id")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.entity.name ?? "Organization"} — Global Chain Hub` },
      { name: "description", content: loaderData?.entity.description ?? "Organization workspace." },
    ],
  }),
  component: OrgLayout,
});

function OrgLayout() {
  const { entity } = Route.useLoaderData();
  return (
    <OrgShell entity={entity}>
      <Outlet />
    </OrgShell>
  );
}
