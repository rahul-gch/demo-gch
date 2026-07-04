import { createFileRoute, notFound } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { getEntity } from "@/seed/all-entities";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/organizations/$id/compliance")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Compliance — ${loaderData?.entity.name ?? "Organization"} | GCH` },
      { name: "description", content: "Compliance and audit posture." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Compliance"
      description="Certifications, audits, and regulatory readiness (CSRD, CBAM, UFLPA, etc.)."
      icon={ShieldCheck}
    />
  ),
});
