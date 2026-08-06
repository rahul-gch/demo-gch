import { Link } from "@tanstack/react-router";
import { Bell, CalendarClock, FolderPlus, ListChecks, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActingOrgId } from "@/lib/use-comms";
import {
  useMarkAllNotificationsRead,
  useNotifications,
  type NotificationItem,
} from "@/lib/use-notifications";

const icons = {
  message: MessageSquare,
  meeting: CalendarClock,
  request: ListChecks,
  partner: FolderPlus,
} as const;

function relTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Row({ n }: { n: NotificationItem }) {
  const Icon = icons[n.kind];
  return (
    <Link
      to={n.to}
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
    >
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium">{n.title}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">{relTime(n.at)}</span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>
      </span>
    </Link>
  );
}

export function NotificationBell() {
  const orgId = useActingOrgId();
  const { items, isLoading } = useNotifications(orgId);
  const markAll = useMarkAllNotificationsRead(orgId);
  const count = items.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center px-1 text-[10px]">
              {count > 9 ? "9+" : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {items.some((i) => i.kind === "message") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[24rem]">
          {count === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              {isLoading ? "Loading…" : "You're all caught up."}
            </p>
          ) : (
            <div className="space-y-0.5 p-1.5">
              {items.map((n) => (
                <Row key={n.id} n={n} />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
