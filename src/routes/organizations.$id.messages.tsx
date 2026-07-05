import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  appendMessage,
  getThread,
  getThreadIdsForOrg,
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

export const Route = createFileRoute("/organizations/$id/messages")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  component: OrgMessagesPage,
});

function OrgMessagesPage() {
  const { entity: viewer } = Route.useLoaderData();
  useCommsVersion();
  const ids = useMemo(
    () => getThreadIdsForOrg(viewer.id).filter((id) => id !== viewer.id),
    [viewer.id],
  );
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [infoOpen, setInfoOpen] = useState(true);

  useEffect(() => {
    if (activeId) markThreadRead(activeId);
  }, [activeId]);

  const activeEntity = activeId ? getEntity(activeId) : null;
  const activeMessages = activeId ? getThread(activeId) : [];

  const send = () => {
    if (!activeId || !draft.trim()) return;
    appendMessage(activeId, {
      from: "me",
      authorName: viewer.name,
      authorRole: "Org Admin",
      body: draft.trim(),
    });
    setDraft("");
  };

  return (
    <div className="mx-auto h-[calc(100vh-6rem)] max-w-[1500px]">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversations from <span className="font-medium">{viewer.name}</span> with matched
          organizations.
        </p>
      </header>
      <div
        className={cn(
          "grid h-[calc(100%-4.5rem)] gap-0 overflow-hidden rounded-2xl border bg-card shadow-sm grid-cols-1",
          infoOpen && activeEntity
            ? "md:grid-cols-[320px_1fr_320px]"
            : "md:grid-cols-[320px_1fr]",
        )}
      >
        <div className="min-h-0 border-r">
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
                placeholder={`Reply to ${activeEntity.name}…`}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">Select a conversation</div>
            </div>
          )}
        </div>

        {infoOpen && activeEntity && (
          <div className="hidden min-h-0 md:block">
            <OrgInfoSidebar entity={activeEntity} />
          </div>
        )}
      </div>
    </div>
  );
}
