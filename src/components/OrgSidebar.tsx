import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sparkles,
  Search,
  MessageSquare,
  Calendar,
  Settings,
  ArrowLeft,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { unreadCountForOrg, pendingMeetingCountForOrg } from "@/seed/comms";
import { useCommsVersion } from "@/lib/use-comms";

export function OrgSidebar({ entity }: { entity: Entity }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useCommsVersion();

  const base = `/organizations/${entity.id}`;
  const items = [
    { title: "Dashboard", url: base, icon: LayoutDashboard, exact: true },
    { title: "Matchmaking", url: `${base}/matchmaking`, icon: Sparkles },
    { title: "Research", url: `${base}/research`, icon: Search },
    {
      title: "Messages",
      url: `${base}/messages`,
      icon: MessageSquare,
      badge: typeof window !== "undefined" ? unreadCountForOrg(entity.id) : 0,
    },
    {
      title: "Meetings",
      url: `${base}/meetings`,
      icon: Calendar,
      badge: typeof window !== "undefined" ? pendingMeetingCountForOrg(entity.id) : 0,
    },
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to all organizations">
              <Link to="/organizations" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>All organizations</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
