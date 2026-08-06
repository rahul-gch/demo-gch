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
import { OrgAvatar } from "./shared";
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
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b bg-background px-4 py-3 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <OrgAvatar entity={entity} size={40} className="sm:h-11 sm:w-11" />
        <div className="min-w-0 flex-1">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center justify-start gap-2 sm:flex">
            <h2 className="truncate text-base font-semibold tracking-tight">{entity.name}</h2>
            <span className="shrink-0">
              <VerificationBadge status={entity.verificationStatus} />
            </span>
          </div>
          <div className="mt-0.5 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 text-xs text-muted-foreground sm:inline-flex sm:max-w-full">
            <span className="min-w-0 truncate">
              {entity.entityType} · {entity.country}
            </span>
            <span className="shrink-0 text-muted-foreground/40">•</span>
            <StatusText id={entity.id} />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button asChild variant="ghost" size="sm" className="hidden 2xl:inline-flex">
          <Link to="/directory/$id" params={{ id: entity.id }}>
            <User className="mr-1.5 h-3.5 w-3.5" /> Profile
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="hidden 2xl:inline-flex">
          <Link to="/organizations/$id/meetings" params={{ id: entity.id }}>
            <CalendarPlus className="mr-1.5 h-3.5 w-3.5" /> Schedule
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleInfo}
          aria-label="Toggle info"
          title="Organization details"
        >
          {infoOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/directory/$id" params={{ id: entity.id }}>
                <User className="mr-2 h-3.5 w-3.5" /> View profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/organizations/$id/meetings" params={{ id: entity.id }}>
                <CalendarPlus className="mr-2 h-3.5 w-3.5" /> Schedule meeting
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="mr-2 h-3.5 w-3.5" /> Shared documents
            </DropdownMenuItem>
            <DropdownMenuItem>Mute conversation</DropdownMenuItem>
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
