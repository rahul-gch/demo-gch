import { createFileRoute, notFound } from "@tanstack/react-router";
import { FolderKanban } from "lucide-react";
import { getEntity } from "@/seed/all-entities";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/organizations/$id/projects")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Projects — ${loaderData?.entity.name ?? "Organization"} | GCH` },
      { name: "description", content: "Projects for this organization." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Projects"
      description="Live sustainability projects, partners and milestones for this organization."
      icon={FolderKanban}
    />
  ),
});
