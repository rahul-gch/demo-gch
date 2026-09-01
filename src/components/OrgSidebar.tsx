import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sparkles,
  Search,
  MessageSquare,
  Settings,
  Building2,
  Rss,
  FolderKanban,
  Network,
  ShieldCheck,
  Inbox,
  Store,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import type { Entity } from "@/seed/types";
import { usePendingMeetingCount, useUnreadTotal } from "@/lib/use-comms";
import { usePendingSampleOrderCount } from "@/lib/use-showroom";

export function OrgSidebar({ entity }: { entity: Entity }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const base = `/organizations/${entity.slug || entity.id}`;
  const orgUuid = entity.orgUuid ?? entity.id;
  const inbox = useUnreadTotal(orgUuid) + usePendingMeetingCount(orgUuid);
  const pendingOrders = usePendingSampleOrderCount(orgUuid);

  const items = [
    { title: "Home / Feed", url: `${base}/feed`, icon: Rss },
    { title: "Dashboard", url: base, icon: LayoutDashboard, exact: true },
    { title: "Showroom", url: `${base}/showroom`, icon: Store, badge: pendingOrders },
    { title: "Projects", url: `${base}/projects`, icon: FolderKanban },
    { title: "Supply Chain Mapping", url: `${base}/supply-chain`, icon: Network },
    { title: "Matchmaking & Partnerships", url: `${base}/matchmaking`, icon: Sparkles },
    { title: "Research Database", url: `${base}/research`, icon: Search },
    {
      title: "Messages & Meetings",
      url: `${base}/messages`,
      icon: MessageSquare,
      badge: inbox,
    },
    { title: "Compliance", url: `${base}/compliance`, icon: ShieldCheck },
    { title: "Requests", url: `${base}/requests`, icon: Inbox },
    { title: "Settings", url: `${base}/settings`, icon: Settings },
  ];

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold leading-tight">{entity.name}</span>
            <span className="text-[11px] text-muted-foreground">
              {entity.actorType} · {entity.country}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url, item.exact)}
                    tooltip={item.title}
                  >
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {!!item.badge && item.badge > 0 && (
                        <Badge className="h-5 min-w-5 justify-center px-1 text-[10px]">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
