import { createFileRoute, notFound } from "@tanstack/react-router";
import { Network } from "lucide-react";
import { getEntity } from "@/seed/all-entities";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/organizations/$id/supply-chain")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Supply Chain Mapping — ${loaderData?.entity.name ?? "Organization"} | GCH` },
      { name: "description", content: "Tier-by-tier supply chain map." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Supply Chain Mapping"
      description="Visualize tiers, flows and hotspots across this organization's supply chain."
      icon={Network}
    />
  ),
});
