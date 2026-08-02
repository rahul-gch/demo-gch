import type { Entity } from "@/seed/types";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { OrgAvatar, StatusText } from "./shared";
import { VerificationBadge } from "@/components/StatusBadge";
import {
  User,
  CalendarPlus,
  FileText,
  FolderPlus,
  Building2,
  MapPin,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

export function OrgInfoSidebar({
  entity,
  counts,
}: {
  entity: Entity;
  counts?: { projects?: number; documents?: number; pendingRequests?: number };
}) {
  const c = {
    projects: counts?.projects ?? 3,
    documents: counts?.documents ?? entity.evidenceCount ?? 12,
    pendingRequests: counts?.pendingRequests ?? 2,
  };

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-l bg-background">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-6">
          <div className="flex flex-col items-center text-center">
            <OrgAvatar entity={entity} size={72} showStatus={false} />
            <h3 className="mt-3 text-base font-semibold tracking-tight">{entity.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {entity.entityType} · {entity.country}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <VerificationBadge status={entity.verificationStatus} />
              <StatusText id={entity.id} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Quick actions
            </div>
            <div className="grid gap-1.5">
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link to="/directory/$id" params={{ id: entity.id }}>
                  <User className="mr-2 h-3.5 w-3.5" /> View profile
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link to="/organizations/$id/meetings" params={{ id: entity.id }}>
                  <CalendarPlus className="mr-2 h-3.5 w-3.5" /> Schedule meeting
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <FileText className="mr-2 h-3.5 w-3.5" /> Request documents
              </Button>
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link to="/organizations/$id/projects" params={{ id: entity.id }}>
                  <FolderPlus className="mr-2 h-3.5 w-3.5" /> Create shared project
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Shared with you
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Projects" value={c.projects} />
              <Stat label="Documents" value={c.documents} />
              <Stat label="Requests" value={c.pendingRequests} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Organization
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" /> {entity.organizationType}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> {entity.city}, {entity.country}
              </li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
