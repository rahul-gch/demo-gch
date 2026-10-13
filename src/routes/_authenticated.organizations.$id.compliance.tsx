import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEntity } from "@/seed/all-entities";
import { CompliancePage } from "@/components/compliance/CompliancePage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CredentialsPanel } from "@/components/verification/CredentialsPanel";
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
  const canEdit = useQuery({
    queryKey: ["can-edit", entity.orgUuid],
    enabled: !!entity.orgUuid,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("user_can_edit", { _user: u.user.id, _org: entity.orgUuid! });
      return !!data;
    },
  });
  return (
    <div className="space-y-6">
      {entity.orgUuid && canEdit.data && <CredentialsPanel orgId={entity.orgUuid} canEdit />}
      <CompliancePage entity={entity} />
    </div>
  );
}
