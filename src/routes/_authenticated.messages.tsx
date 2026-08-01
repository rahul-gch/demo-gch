import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  useActingOrgId,
  useConversations,
  useMarkRead,
  useSendMessage,
  useThread,
} from "@/lib/use-comms";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatHeader } from "@/components/messages/ChatHeader";
import { MessageList } from "@/components/messages/MessageList";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { OrgInfoSidebar } from "@/components/messages/OrgInfoSidebar";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ActingOrgSwitcher } from "@/components/messages/ActingOrgSwitcher";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Global Chain Hub" },
      {
        name: "description",
        content:
          "Secure organization-to-organization conversations across the Global Chain Hub network.",
      },
      { property: "og:title", content: "Messages — Global Chain Hub" },
      {
        property: "og:description",
        content: "Secure organization-to-organization conversations across the network.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const [preferred, setPreferred] = useState<string | null>(null);
  const orgId = useActingOrgId(preferred);
  const { conversations, isLoading } = useConversations(orgId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0] ?? null;
  const { messages } = useThread(active?.id ?? null, orgId);
  const markRead = useMarkRead(orgId);
  const sendMessage = useSendMessage(orgId);

  useEffect(() => {
    if (active && active.unread > 0) markRead.mutate(active.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.unread]);

  const activeEntity = active?.entity ?? null;

  const send = () => {
    if (!active || !draft.trim() || !orgId) return;
    sendMessage.mutate({ counterpartOrgId: active.counterpartOrgId, body: draft.trim() });
    setDraft("");
  };

  return (
    <AppShell>
      <div className="mx-auto h-[calc(100vh-6rem)] w-full min-w-0 max-w-[1600px] overflow-hidden px-2 sm:px-4">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Secure conversations with matched organizations across the network.
            </p>
          </div>
          <ActingOrgSwitcher value={orgId} onChange={setPreferred} />
        </header>
        <div
          className={cn(
            "grid h-[calc(100%-4.5rem)] w-full min-w-0 max-w-full overflow-hidden rounded-2xl border bg-card shadow-sm",
            "grid-cols-1 md:[grid-template-columns:308px_minmax(0,1fr)]",
            infoOpen && activeEntity && "xl:[grid-template-columns:308px_minmax(0,1fr)_320px]",
          )}
        >
          <div className="min-h-0 min-w-0 border-r">
            <ConversationList
              conversations={conversations}
              activeId={active?.id ?? null}
              onSelect={setActiveId}
              filter={filter}
              onFilterChange={setFilter}
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-col">
            {activeEntity ? (
              <>
                <ChatHeader
                  entity={activeEntity}
                  onToggleInfo={() => setInfoOpen((v) => !v)}
                  infoOpen={infoOpen}
                />
                <MessageList messages={messages} entity={activeEntity} />
                <MessageComposer
                  value={draft}
                  onChange={setDraft}
                  onSend={send}
                  placeholder={`Message ${activeEntity.name}…`}
                />
              </>
            ) : (
              <EmptyChat loading={isLoading} hasOrg={!!orgId} />
            )}
          </div>

          {infoOpen && activeEntity && (
            <div className="hidden min-h-0 min-w-0 xl:block">
              <OrgInfoSidebar entity={activeEntity} />
            </div>
          )}
        </div>

        {/* Drawer variant for < xl */}
        {activeEntity && (
          <Sheet open={infoOpen} onOpenChange={setInfoOpen} modal={false}>
            <SheetContent side="right" className="w-[320px] p-0 xl:hidden">
              <SheetTitle className="sr-only">Organization details</SheetTitle>
              <SheetDescription className="sr-only">
                Profile, shared documents, and actions for the selected organization.
              </SheetDescription>
              <OrgInfoSidebar entity={activeEntity} />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </AppShell>
  );
}

function EmptyChat({ loading, hasOrg }: { loading: boolean; hasOrg: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
        <MessageSquare className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium">
        {loading ? "Loading conversations…" : hasOrg ? "No conversations yet" : "No organization"}
      </div>
      <p className="max-w-sm text-xs text-muted-foreground">
        {hasOrg
          ? "Start a conversation from matchmaking or an organization profile."
          : "Join or create an organization to start messaging partners."}
      </p>
    </div>
  );
}
