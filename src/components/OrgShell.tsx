import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { OrgSidebar } from "./OrgSidebar";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { NavHistoryButtons } from "./NavHistoryButtons";
import type { Entity } from "@/seed/types";
import { useActingOrgId, useRealtimeComms } from "@/lib/use-comms";
import { amIPlatformAdmin } from "@/lib/admin.functions";

export function OrgShell({
  entity,
  children,
}: {
  entity: Entity;
  children: ReactNode;
}) {
  useRealtimeComms(useActingOrgId(entity.orgUuid ?? null));
  const adminQuery = useQuery({
    queryKey: ["platform-admin"],
    queryFn: () => amIPlatformAdmin(),
    staleTime: 5 * 60_000,
  });
  const isAdmin = !!adminQuery.data?.isAdmin;

  return (
    <SidebarProvider>

      <div className="flex min-h-screen w-full bg-background">
        <OrgSidebar entity={entity} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <NavHistoryButtons className="flex" />
            {isAdmin && (
              <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1.5">
                <Link to="/organizations" aria-label="All organizations">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">All organizations</span>
                </Link>
              </Button>
            )}
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
