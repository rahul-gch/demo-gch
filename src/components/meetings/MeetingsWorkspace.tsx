import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { MeetingDirection, MeetingRequest } from "@/lib/comms-types";
import { useSetMeetingStatus } from "@/lib/use-comms";
import {
  MEETING_BUCKETS,
  MeetingCard,
  groupMeetings,
  type MeetingBucket,
} from "@/components/meetings/MeetingCard";
import { MeetingDetailsDialog } from "@/components/meetings/MeetingDetailsDialog";

const emptyCopy: Record<MeetingBucket, string> = {
  Pending: "No pending meetings.",
  Confirmed: "No confirmed meetings.",
  Closed: "Nothing here yet.",
};

export function MeetingsWorkspace({
  meetings,
  orgId,
  isLoading,
  readOnly = false,
}: {
  meetings: MeetingRequest[];
  orgId: string | null;
  isLoading: boolean;
  /** Platform admins viewing another organization can read but not act. */
  readOnly?: boolean;
}) {
  const [direction, setDirection] = useState<MeetingDirection>("Received");
  const [details, setDetails] = useState<MeetingRequest | null>(null);
  const respond = useSetMeetingStatus(orgId);

  const act = (id: string, status: "confirmed" | "declined" | "cancelled") => {
    if (readOnly) {
      toast.error("Read-only view — only members of this organization can respond.");
      return;
    }
    respond.mutate(
      { id, status },
      {
        onSuccess: () => {
          setDetails(null);
          toast.success(
            status === "cancelled"
              ? "Meeting request withdrawn"
              : status === "confirmed"
                ? "Meeting confirmed"
                : "Meeting declined",
          );
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update request"),
      },
    );
  };

  const inbound = groupMeetings(meetings, "Received");
  const outbound = groupMeetings(meetings, "Sent");
  const buckets = direction === "Received" ? inbound : outbound;

  return (
    <div className="space-y-4">
      <Tabs value={direction} onValueChange={(v) => setDirection(v as MeetingDirection)}>
        <TabsList>
          <TabsTrigger value="Received">
            Inbound ({inbound.Pending.length + inbound.Confirmed.length})
          </TabsTrigger>
          <TabsTrigger value="Sent">
            Outbound ({outbound.Pending.length + outbound.Confirmed.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs defaultValue="Pending" key={direction}>
        <TabsList>
          {MEETING_BUCKETS.map((b) => (
            <TabsTrigger key={b} value={b}>
              {b} ({buckets[b].length})
            </TabsTrigger>
          ))}
        </TabsList>
        {MEETING_BUCKETS.map((b) => (
          <TabsContent key={b} value={b} className="space-y-3">
            {buckets[b].length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  {isLoading ? "Loading meetings…" : emptyCopy[b]}
                </CardContent>
              </Card>
            ) : (
              buckets[b].map((m) => (
                <MeetingCard
                  key={m.id}
                  m={m}
                  readOnly={readOnly}
                  busy={respond.isPending}
                  onRespond={(id, status) => act(id, status)}
                  onWithdraw={(id) => act(id, "cancelled")}
                  onOpenDetails={setDetails}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <MeetingDetailsDialog
        m={details}
        open={!!details}
        onOpenChange={(o) => !o && setDetails(null)}
        busy={respond.isPending}
        onRespond={(id, status) => act(id, status)}
        onWithdraw={(id) => act(id, "cancelled")}
      />
    </div>
  );
}
