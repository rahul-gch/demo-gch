import { useState } from "react";
import type { Entity } from "@/seed/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addMeeting } from "@/seed/comms";
import { toast } from "sonner";

export function MeetingRequestDialog({
  entity,
  open,
  onOpenChange,
}: {
  entity: Entity;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(30);
  const [agenda, setAgenda] = useState(
    `Intro call with ${entity.name} — discuss capacity, lead time and fit.`,
  );

  const submit = () => {
    addMeeting({
      orgId: entity.id,
      orgName: entity.name,
      proposedFor: new Date(`${date}T${time}:00`).toISOString(),
      durationMin: duration,
      agenda,
    });
    toast.success(`Meeting requested with ${entity.name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request meeting</DialogTitle>
          <DialogDescription>Propose a time to meet with {entity.name}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Label htmlFor="mr-date">Date</Label>
              <Input id="mr-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="col-span-1">
              <Label htmlFor="mr-time">Time</Label>
              <Input id="mr-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="col-span-1">
              <Label htmlFor="mr-dur">Duration (min)</Label>
              <Input
                id="mr-dur"
                type="number"
                min={15}
                step={15}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="mr-agenda">Agenda</Label>
            <Textarea
              id="mr-agenda"
              rows={4}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Send request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
