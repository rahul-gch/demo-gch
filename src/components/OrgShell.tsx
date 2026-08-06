import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OrgSidebar } from "./OrgSidebar";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { NavHistoryButtons } from "./NavHistoryButtons";
import type { Entity } from "@/seed/types";

export function OrgShell({
  entity,
  children,
}: {
  entity: Entity;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <OrgSidebar entity={entity} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <NavHistoryButtons className="flex" />
            <div className="flex min-w-0 flex-1 items-baseline gap-2 text-sm">
              <span className="truncate font-medium">{entity.name}</span>
              <span className="hidden shrink-0 text-muted-foreground sm:inline">
                · {entity.gchNumber}
              </span>
            </div>
            <UserMenu />
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

