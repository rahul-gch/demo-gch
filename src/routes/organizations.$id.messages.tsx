import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Send, Search } from "lucide-react";
import {
  appendMessage,
  getThread,
  getThreadIdsForOrg,
  markThreadRead,
} from "@/seed/comms";
import { getEntity } from "@/seed/all-entities";
import { useCommsVersion } from "@/lib/use-comms";

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
  const ids = getThreadIdsForOrg(viewer.id).filter((id) => id !== viewer.id);
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (activeId) markThreadRead(activeId);
  }, [activeId]);

  const threads = useMemo(() => {
    return ids
      .map((id) => {
        const entity = getEntity(id);
        const msgs = getThread(id);
        const last = msgs[msgs.length - 1];
        const unread = msgs.filter((m) => m.from === "them" && !m.read).length;
        return { id, entity, last, unread };
      })
      .filter((t) => t.entity)
      .filter((t) =>
        filter ? t.entity!.name.toLowerCase().includes(filter.toLowerCase()) : true,
      )
      .sort((a, b) => (b.last?.at ?? "").localeCompare(a.last?.at ?? ""));
  }, [ids, filter]);

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
    <div className="mx-auto h-[calc(100vh-7rem)] max-w-6xl">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversations from <span className="font-medium">{viewer.name}</span> with matched
          organizations.
        </p>
      </header>
      <Card className="grid h-full grid-cols-1 overflow-hidden md:grid-cols-[320px_1fr]">
        <div className="flex flex-col border-r">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search threads"
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`flex w-full flex-col gap-1 border-b px-3 py-3 text-left hover:bg-slate-50 ${
                  activeId === t.id ? "bg-slate-50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{t.entity!.name}</span>
                  {t.unread > 0 && (
                    <Badge className="h-5 min-w-5 justify-center px-1 text-[10px]">{t.unread}</Badge>
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {t.last?.body ?? "No messages yet"}
                </div>
              </button>
            ))}
            {threads.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No threads.</div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {activeEntity ? (
            <>
              <div className="flex items-center justify-between border-b p-4">
                <div>
                  <div className="text-sm font-semibold">{activeEntity.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {activeEntity.entityType} · {activeEntity.country}
                  </div>
                </div>
                <Badge variant="outline">{activeEntity.actorType}</Badge>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {activeMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        m.from === "me"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      <div className="mb-0.5 text-[10px] uppercase tracking-wide opacity-70">
                        {m.authorName}
                      </div>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                      <div className="mt-1 text-right text-[10px] opacity-60">
                        {new Date(m.at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Reply to ${activeEntity.name}…`}
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <Button onClick={send} disabled={!draft.trim()}>
                    <Send className="mr-1 h-3.5 w-3.5" /> Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
