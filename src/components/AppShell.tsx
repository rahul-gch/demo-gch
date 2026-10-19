import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { NavHistoryButtons } from "./NavHistoryButtons";
import { useActingOrgId, useRealtimeComms } from "@/lib/use-comms";
import { DemoRoleSwitcher } from "./auth/DemoSwitcher";

export function AppShell({ children }: { children: ReactNode }) {
  useRealtimeComms(useActingOrgId());
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <NavHistoryButtons className="flex" />
            <div className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              <span className="hidden sm:inline">Global Chain Hub · Admin</span>
              <span className="sm:hidden">GCH · Admin</span>
            </div>
            <DemoRoleSwitcher />
            <NotificationBell />
            <UserMenu />
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
