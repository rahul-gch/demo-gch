import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Map,
  Settings,
  Globe2,
  MessageSquare,
  Calendar,
  Sparkles,
  Activity,
  Plus,
  ShieldCheck,
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
import { useQuery } from "@tanstack/react-query";
import { amIPlatformAdmin } from "@/lib/admin.functions";
import { useActingOrgId, useUnreadTotal } from "@/lib/use-comms";

const items = [
  { title: "Platform Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Activity Feed", url: "/feed", icon: Activity },
  { title: "Organizations", url: "/organizations", icon: Building2 },
  { title: "Map View", url: "/map", icon: Map },
  { title: "Matchmaking", url: "/matchmaking", icon: Sparkles },
  { title: "Messages", url: "/messages", icon: MessageSquare, badgeKind: "unread" as const },
  { title: "Meetings", url: "/meetings", icon: Calendar },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);
  const actingOrgId = useActingOrgId();
  const unread = useUnreadTotal(actingOrgId);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Globe2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-tight">Global Chain Hub</span>
            <span className="text-[11px] text-muted-foreground">Admin Console</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.badgeKind === "unread" && unread > 0 && (
                        <Badge className="h-5 min-w-5 justify-center px-1 text-[10px]">{unread}</Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="New organization">
                  <Link to="/signup" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="flex-1">New organization</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin.data?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/admin")}
                    tooltip="Organization onboarding"
                  >
                    <Link to="/admin/organizations" className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="flex-1">Onboarding</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
