import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CalendarPlus, FileText, User, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { Entity } from "@/seed/types";
import { Link } from "@tanstack/react-router";
import { OrgAvatar, StatusText } from "./shared";
import { VerificationBadge } from "@/components/StatusBadge";

export function ChatHeader({
  entity,
  onToggleInfo,
  infoOpen,
}: {
  entity: Entity;
  onToggleInfo: () => void;
  infoOpen: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b bg-background px-6 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <OrgAvatar entity={entity} size={44} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold tracking-tight">{entity.name}</h2>
            <VerificationBadge status={entity.verificationStatus} />
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {entity.entityType} · {entity.country}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <StatusText id={entity.id} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
          <Link to="/organizations/$id" params={{ id: entity.id }}>
            <User className="mr-1.5 h-3.5 w-3.5" /> View Profile
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
          <Link to="/organizations/$id/meetings" params={{ id: entity.id }}>
            <CalendarPlus className="mr-1.5 h-3.5 w-3.5" /> Schedule
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="hidden md:inline-flex">
          <FileText className="mr-1.5 h-3.5 w-3.5" /> Documents
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleInfo} aria-label="Toggle info">
          {infoOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mute conversation</DropdownMenuItem>
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
