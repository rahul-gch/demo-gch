import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { CompliancePage } from "@/components/compliance/CompliancePage";

export const Route = createFileRoute("/_authenticated/organizations/$id/compliance")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
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
