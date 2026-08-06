import { Fragment, useEffect, useRef } from "react";
import type { Entity } from "@/seed/types";
import type { ThreadMessage } from "@/lib/comms-types";
import { OrgAvatar, formatDayLabel } from "./shared";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function MessageRow({
  m,
  entity,
  showAvatar,
  showAuthor,
}: {
  m: ThreadMessage;
  entity: Entity;
  showAvatar: boolean;
  showAuthor: boolean;
}) {
  const isMe = m.from === "me";
  const time = new Date(m.at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("group flex min-w-0 gap-2.5", isMe ? "justify-end" : "justify-start")}>
      <div className="w-9 shrink-0">
        {!isMe && showAvatar ? (
          <OrgAvatar entity={entity} size={32} showStatus={false} />
        ) : null}
      </div>
      <div
        className={cn(
          "relative flex min-w-0 max-w-[min(78%,42rem)] flex-col",
          isMe ? "items-end" : "items-start",
        )}
      >
        {!isMe && showAuthor && (
          <span className="mb-1 pl-1 text-[11px] font-medium text-muted-foreground">
            {m.authorName}
            <span className="ml-1.5 text-muted-foreground/60">{m.authorRole}</span>
          </span>
        )}
        <div
          className={cn(
            "max-w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-shadow",
            isMe
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
          )}
        >
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{m.body}</p>
        </div>
        <span className="mt-1 px-1 text-[10px] text-muted-foreground">{time}</span>

        {/* hover actions */}
        <div
          className={cn(
            "absolute -top-3 hidden gap-0.5 rounded-full border bg-background p-0.5 shadow-md group-hover:flex",
            isMe ? "right-2" : "left-2",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => navigator.clipboard?.writeText(m.body)}
            aria-label="Copy"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>

      </div>
    </div>
  );
}

export function MessageList({
  messages,
  entity,
}: {
  messages: ThreadMessage[];
  entity: Entity;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const grouped: { day: string; items: ThreadMessage[] }[] = [];
  for (const m of messages) {
    const day = new Date(m.at).toDateString();
    const last = grouped[grouped.length - 1];
    if (last && last.day === day) last.items.push(m);
    else grouped.push({ day, items: [m] });
  }

  return (
    <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5">
      {grouped.map((g) => (
        <Fragment key={g.day}>
          <DateSeparator label={formatDayLabel(g.items[0].at)} />
          <div className="min-w-0 space-y-1.5">
            {g.items.map((m, idx) => {
              const prev = g.items[idx - 1];
              const grouped = prev && prev.from === m.from;
              return (
                <MessageRow
                  key={m.id}
                  m={m}
                  entity={entity}
                  showAvatar={!grouped}
                  showAuthor={m.from === "them" && !grouped}
                />
              );
            })}
          </div>
        </Fragment>
      ))}
      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No messages yet — start the conversation.
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
