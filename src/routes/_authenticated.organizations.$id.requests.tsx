import { createFileRoute, notFound } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { getEntity } from "@/seed/all-entities";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/organizations/$id/requests")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Requests — ${loaderData?.entity.name ?? "Organization"} | GCH` },
      { name: "description", content: "Incoming and outgoing requests." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Requests"
      description="Inbound and outbound requests: data, samples, RFQs, audits, verifications."
      icon={Inbox}
    />
  ),
});
