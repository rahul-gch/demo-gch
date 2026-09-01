import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { OrgSidebar } from "./OrgSidebar";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { NavHistoryButtons } from "./NavHistoryButtons";
import type { Entity } from "@/seed/types";
import { useActingOrgId, useRealtimeComms } from "@/lib/use-comms";
import { amIPlatformAdmin } from "@/lib/admin.functions";

export function OrgShell({ entity, children }: { entity: Entity; children: ReactNode }) {
  useRealtimeComms(useActingOrgId(entity.orgUuid ?? null));
  const checkPlatformAdmin = useServerFn(amIPlatformAdmin);
  const adminQuery = useQuery({
    queryKey: ["platform-admin"],
    queryFn: () => checkPlatformAdmin(),
    staleTime: 5 * 60_000,
  });
  const isAdmin = !!adminQuery.data?.isAdmin;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <OrgSidebar entity={entity} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
            <div className="flex shrink-0 items-center gap-1">
              <SidebarTrigger />
              <NavHistoryButtons className="flex" />
              {isAdmin && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0 gap-1.5 rounded-full px-2.5 text-xs"
                      >
                        <Link to="/organizations" aria-label="All organizations">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="hidden md:inline">All organizations</span>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>All organizations</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="h-5 w-px shrink-0 bg-border" />
            <div className="flex min-w-0 flex-1 items-baseline gap-2 text-sm">
              <span className="truncate font-medium">{entity.name}</span>
              <span className="hidden shrink-0 text-muted-foreground sm:inline">
                · {entity.gchNumber}
              </span>
            </div>

            <NotificationBell />
            <UserMenu />
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
