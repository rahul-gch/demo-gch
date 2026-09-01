import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ActingOrgSwitcher } from "@/components/messages/ActingOrgSwitcher";
import { AppShell } from "@/components/AppShell";
import { useActingOrgId, useMeetings } from "@/lib/use-comms";
import { MeetingsWorkspace } from "@/components/meetings/MeetingsWorkspace";
import { myOrgMemberships } from "@/lib/orgs.functions";
import { amIPlatformAdmin } from "@/lib/admin.functions";
import { getEntity } from "@/seed/all-entities";

export const Route = createFileRoute("/_authenticated/meetings")({
  beforeLoad: async () => {
    const [admin, memberships] = await Promise.all([
      amIPlatformAdmin().catch(() => ({ isAdmin: false })),
      myOrgMemberships().catch(() => [] as { org_id: string }[]),
    ]);
    if (admin?.isAdmin) return;
    const first = memberships[0];
    if (first) {
      const entity = getEntity(first.org_id);
      throw redirect({
        to: "/organizations/$id/meetings",
        params: { id: entity?.id ?? first.org_id },
        replace: true,
      });
    }
  },
  head: () => ({
    meta: [
      { title: "Meetings — Global Chain Hub" },
      {
        name: "description",
        content: "Meeting requests between organizations across the Global Chain Hub network.",
      },
      { property: "og:title", content: "Meetings — Global Chain Hub" },
      {
        property: "og:description",
        content: "Meeting requests between organizations across the network.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const [preferred, setPreferred] = useState<string | null>(null);
  const orgId = useActingOrgId(preferred);
  const { meetings, isLoading } = useMeetings(orgId);

  return (
    <AppShell>
      <div className="w-full space-y-6 px-2">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Requests you received and requests you sent. Switch organization if you belong to more
              than one.
            </p>
          </div>
          <ActingOrgSwitcher value={orgId} onChange={setPreferred} />
        </header>

        <MeetingsWorkspace meetings={meetings} orgId={orgId} isLoading={isLoading} />
      </div>
    </AppShell>
  );
}
