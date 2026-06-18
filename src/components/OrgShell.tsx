import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OrgSidebar } from "./OrgSidebar";
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
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex items-baseline gap-2 text-sm">
              <span className="font-medium">{entity.name}</span>
              <span className="text-muted-foreground">· {entity.gchNumber}</span>
            </div>
          </header>
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
