import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { CompliancePage } from "@/components/compliance/CompliancePage";
import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/organizations/$id/compliance")({
  loader: async ({ params, context }) => {
    let entity = getEntity(params.id);
    if (!entity) {
      await refreshRegistry(context.queryClient);
      entity = getEntity(params.id);
    }
    if (!entity) throw notFound();
    return { entity };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Compliance — ${loaderData?.entity.name ?? "Organization"} | GCH` },
      {
        name: "description",
        content: "Social audits, product certifications, and transaction certificates.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { entity } = Route.useLoaderData();
  return <CompliancePage entity={entity} />;
}
