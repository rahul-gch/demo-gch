import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, X, Users } from "lucide-react";
import { OrgAvatar } from "@/components/messages/shared";
import { cn } from "@/lib/utils";
import { getEntity } from "@/seed/all-entities";
import type { MeetingRequest } from "@/lib/comms-types";

export function statusTone(s: MeetingRequest["status"]) {
  switch (s) {
    case "Confirmed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Declined":
      return "border-red-200 bg-red-50 text-red-700";
    case "Past":
      return "border-muted bg-muted text-muted-foreground";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

export function MeetingCard({
  m,
  viewerOrgId,
  onRespond,
  busy,
}: {
  m: MeetingRequest;
  viewerOrgId: string | null;
  onRespond: (id: string, status: "confirmed" | "declined") => void;
  busy?: boolean;
}) {
  const dt = new Date(m.proposedFor);
  const entity = getEntity(m.orgId);
  const direction = m.viewerOrgId === viewerOrgId ? "Sent" : "Received";
  const canRespond = m.status === "Pending" && direction === "Received";

  return (
    <Card className="rounded-2xl shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {entity ? (
            <OrgAvatar entity={entity} size={44} showStatus={false} />
          ) : (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/directory/$id"
                params={{ id: entity?.id ?? m.orgId }}
                className="truncate text-base font-semibold tracking-tight hover:underline"
              >
                {entity?.name ?? m.orgName}
              </Link>
              <Badge variant="outline" className={cn("shrink-0", statusTone(m.status))}>
                {m.status}
              </Badge>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {direction}
              </Badge>
            </div>
            {entity && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {entity.entityType} · {entity.country}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {dt.toLocaleDateString()}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
                {m.durationMin}m
              </span>
            </div>
            <p className="mt-3 text-sm text-foreground/80">{m.agenda}</p>
          </div>
        </div>

        {canRespond && (
          <div className="flex shrink-0 gap-2 sm:flex-col">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function bucketMeetings(all: MeetingRequest[]) {
  return {
    Pending: all.filter((m) => m.status === "Pending"),
    Confirmed: all.filter((m) => m.status === "Confirmed"),
    Past: all.filter((m) => m.status === "Past" || m.status === "Declined"),
  };
}
