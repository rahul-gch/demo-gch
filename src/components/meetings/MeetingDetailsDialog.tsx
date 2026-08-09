import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, CheckCircle2, Clock, MessageSquare, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEntity } from "@/seed/all-entities";
import type { MeetingRequest } from "@/lib/comms-types";
import { statusTone } from "./MeetingCard";

export function MeetingDetailsDialog({
  m,
  open,
  onOpenChange,
  onRespond,
  onWithdraw,
  busy,
}: {
  m: MeetingRequest | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onRespond: (id: string, status: "confirmed" | "declined") => void;
  onWithdraw: (id: string) => void;
  busy?: boolean;
}) {
  if (!m) return null;
  const dt = new Date(m.proposedFor);
  const entity = getEntity(m.orgId);
  const canRespond = m.status === "Pending" && m.direction === "Received";
  const canWithdraw = m.status === "Pending" && m.direction === "Sent";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Meeting with {entity?.name ?? m.orgName}
            <Badge variant="outline" className={cn(statusTone(m.status))}>
              {m.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {m.direction === "Sent" ? "Sent by your organization" : "Received request"} ·{" "}
            {new Date(m.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div className="col-span-1">
            <dt className="text-xs text-muted-foreground">Date</dt>
            <dd className="mt-0.5 inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {dt.toLocaleDateString()}
            </dd>
          </div>
          <div className="col-span-1">
            <dt className="text-xs text-muted-foreground">Time</dt>
            <dd className="mt-0.5 inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {m.durationMin}m
            </dd>
          </div>
          <div className="col-span-1">
            <dt className="text-xs text-muted-foreground">Requested by</dt>
            <dd className="mt-0.5 truncate">{m.requesterName}</dd>
          </div>
          <div className="col-span-1">
            <dt className="text-xs text-muted-foreground">Invited</dt>
            <dd className="mt-0.5 truncate">{m.recipientName}</dd>
          </div>
          {entity && (
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Organization</dt>
              <dd className="mt-0.5">
                {entity.entityType} · {entity.country}
              </dd>
            </div>
          )}
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Agenda</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-foreground/90">
              {m.agenda?.trim() || "No agenda provided."}
            </dd>
          </div>
        </dl>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/messages">
                <MessageSquare className="mr-1 h-3.5 w-3.5" /> Message
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/directory/$id" params={{ id: entity?.id ?? m.orgId }}>
                View profile
              </Link>
            </Button>
          </div>
          <div className="flex gap-2">
            {canRespond && (
              <>
                <Button size="sm" disabled={busy} onClick={() => onRespond(m.id, "confirmed")}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onRespond(m.id, "declined")}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Decline
                </Button>
              </>
            )}
            {canWithdraw && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onWithdraw(m.id)}
              >
                <Undo2 className="mr-1 h-3.5 w-3.5" /> Withdraw
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
