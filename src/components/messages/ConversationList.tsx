import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { Entity } from "@/seed/types";
import { getThread } from "@/seed/comms";
import { getEntity } from "@/seed/all-entities";
import { OrgAvatar, isOnline } from "./shared";
import { cn } from "@/lib/utils";

function relTime(iso?: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ConversationList({
  ids,
  activeId,
  onSelect,
  filter,
  onFilterChange,
}: {
  ids: string[];
  activeId: string | null;
  onSelect: (id: string) => void;
  filter: string;
  onFilterChange: (v: string) => void;
}) {
  const threads = useMemo(() => {
    return ids
      .map((id) => {
        const entity = getEntity(id);
        const msgs = getThread(id);
        const last = msgs[msgs.length - 1];
        const unread = msgs.filter((m) => m.from === "them" && !m.read).length;
        return { id, entity, last, unread };
      })
      .filter((t): t is { id: string; entity: Entity; last: any; unread: number } => !!t.entity)
      .filter((t) =>
        filter ? t.entity.name.toLowerCase().includes(filter.toLowerCase()) : true,
      )
      .sort((a, b) => (b.last?.at ?? "").localeCompare(a.last?.at ?? ""));
  }, [ids, filter]);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Search organizations"
            className="h-10 rounded-full border-transparent bg-muted/60 pl-9 focus-visible:border-input focus-visible:bg-background"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <ul className="w-full space-y-1 p-2">
          {threads.map((t) => {
            const active = activeId === t.id;
            const hasUnread = t.unread > 0;
            return (
              <li key={t.id}>
                <button
                  onClick={() => onSelect(t.id)}
                  className={cn(
                    "group flex w-full min-w-0 items-start gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition-all",
                    active
                      ? "bg-muted/70 shadow-sm"
                      : "hover:bg-muted/40",
                  )}
                >
                  <OrgAvatar entity={t.entity} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                      <span
                        className={cn(
                          "truncate text-sm",
                          hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground/90",
                        )}
                      >
                        {t.entity.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {relTime(t.last?.at)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="truncate">
                        {t.entity.entityType} · {t.entity.country}
                      </span>
                    </div>
                    <div className="mt-1 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <p
                        className={cn(
                          "min-w-0 truncate text-xs",
                          hasUnread ? "text-foreground/80" : "text-muted-foreground",
                        )}
                      >
                        {t.last?.from === "me" ? "You: " : ""}
                        {t.last?.body ?? "No messages yet"}
                      </p>
                      {hasUnread && (
                        <Badge className="h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5 text-[10px]">
                          {t.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
          {threads.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">
              No conversations found.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
