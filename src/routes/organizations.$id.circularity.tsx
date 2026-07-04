import { createFileRoute, notFound } from "@tanstack/react-router";
import { Recycle } from "lucide-react";
import { getEntity } from "@/seed/all-entities";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/organizations/$id/circularity")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Circularity & DPP — ${loaderData?.entity.name ?? "Organization"} | GCH` },
      { name: "description", content: "Circularity metrics and Digital Product Passport." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Circularity & Digital Product Passport"
      description="Material loops, recycled content, and DPP-ready product records."
      icon={Recycle}
    />
  ),
});
