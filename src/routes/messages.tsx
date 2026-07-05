import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  appendMessage,
  getThread,
  getThreadIds,
  markThreadRead,
} from "@/seed/comms";
import { getEntity } from "@/seed/all-entities";
import { useCommsVersion } from "@/lib/use-comms";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatHeader } from "@/components/messages/ChatHeader";
import { MessageList } from "@/components/messages/MessageList";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { OrgInfoSidebar } from "@/components/messages/OrgInfoSidebar";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Global Chain Hub" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  useCommsVersion();
  const ids = useMemo(() => getThreadIds(), []);
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (activeId) markThreadRead(activeId);
  }, [activeId]);

  const activeEntity = activeId ? getEntity(activeId) : null;
  const activeMessages = activeId ? getThread(activeId) : [];

  const send = () => {
    if (!activeId || !draft.trim()) return;
    appendMessage(activeId, {
      from: "me",
      authorName: "You",
      authorRole: "Network Admin",
      body: draft.trim(),
    });
    setDraft("");
  };

  return (
    <AppShell>
      <div className="mx-auto h-[calc(100vh-6rem)] w-full min-w-0 max-w-[1600px] overflow-hidden px-2 sm:px-4">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Secure conversations with matched organizations across the network.
          </p>
        </header>
        <div
          className={cn(
            "grid h-[calc(100%-4.5rem)] min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm",
            "grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]",
            infoOpen && activeEntity && "xl:grid-cols-[320px_minmax(0,1fr)_300px]",
          )}
        >
          <div className="min-h-0 min-w-0 border-r">
            <ConversationList
              ids={ids}
              activeId={activeId}
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
                <MessageList messages={activeMessages} entity={activeEntity} />
                <MessageComposer
                  value={draft}
                  onChange={setDraft}
                  onSend={send}
                  placeholder={`Message ${activeEntity.name}…`}
                />
              </>
            ) : (
              <EmptyChat />
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
          <Sheet
            open={infoOpen}
            onOpenChange={setInfoOpen}
            modal={false}
          >
            <SheetContent
              side="right"
              className="w-[320px] p-0 xl:hidden"
            >
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

function EmptyChat() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
        <MessageSquare className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium">Select a conversation</div>
      <p className="max-w-sm text-xs text-muted-foreground">
        Pick an organization from the list to view the shared thread, files and meeting history.
      </p>
    </div>
  );
}
