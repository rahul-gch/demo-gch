import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Entity } from "@/seed/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  CalendarPlus,
  ArrowUpRight,
} from "lucide-react";
import type { MatchScore } from "@/seed/matchmaking";
import { scoreMatch } from "@/seed/matchmaking";
import { appendMessage } from "@/seed/comms";
import { toast } from "sonner";
import { MeetingRequestDialog } from "./MeetingRequestDialog";

function reliabilityOf(e: Entity) {
  const otr = e.onTimeRate ?? Math.max(70, 95 - ((e.leadTimeDays ?? 30) % 25));
  const delay = e.avgDelayDays ?? Math.max(0, Math.round(((e.leadTimeDays ?? 30) % 9) - 2));
  const timeframe = e.deliveryTimeframeDays ?? e.leadTimeDays ?? 30;
  return { otr, delay, timeframe };
}

export function MatchProfileSheet({
  match,
  viewer,
  open,
  onOpenChange,
}: {
  match: { entity: Entity; score: number; reasons: string[] } | null;
  viewer?: Entity | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [draft, setDraft] = useState("");
  const [meetOpen, setMeetOpen] = useState(false);

  if (!match) return null;
  const e = match.entity;
  const rel = reliabilityOf(e);
  const detail: MatchScore | null = viewer ? scoreMatch(viewer, e) : null;

  const send = () => {
    if (!draft.trim()) return;
    appendMessage(e.id, {
      from: "me",
      authorName: viewer?.name ?? "You",
      authorRole: viewer ? "Org Admin" : "Network Admin",
      body: draft.trim(),
    });
    setDraft("");
    toast.success(`Message sent to ${e.name}`);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="text-xl">{e.name}</SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="secondary">{e.entityType}</Badge>
              <Badge variant="outline">{e.actorType}</Badge>
              <Badge variant="outline">
                <MapPin className="mr-1 h-3 w-3" />
                {[e.city, e.country].filter(Boolean).join(", ")}
              </Badge>
              <Badge className="bg-slate-900 text-white">{match.score}% match</Badge>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-5 pb-6">
            <section>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Why this is a match
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {match.reasons.map((r) => (
                  <Badge key={r} variant="secondary" className="font-normal">
                    {r}
                  </Badge>
                ))}
              </div>
              {detail && (
                <div className="mt-3 space-y-1.5">
                  {Object.entries(detail.breakdown).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-xs">
                      <span className="w-20 capitalize text-muted-foreground">{k}</span>
                      <Progress value={(v / 20) * 100} className="h-1.5 flex-1" />
                      <span className="w-10 text-right tabular-nums">{v.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Separator />

            <section>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Operations
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Stat icon={<Clock className="h-4 w-4" />} label="Lead time" value={`${e.leadTimeDays || rel.timeframe} d`} />
                <Stat icon={<Truck className="h-4 w-4" />} label="Delivery timeframe" value={`${rel.timeframe} d`} />
                <Stat
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  label="On-time rate"
                  value={`${rel.otr}%`}
                />
                <Stat
                  icon={
                    rel.delay > 3 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )
                  }
                  label="Avg delay"
                  value={`${rel.delay} d`}
                />
                <Stat icon={<Package className="h-4 w-4" />} label="Capacity" value={e.capacity || "—"} />
                <Stat icon={<Package className="h-4 w-4" />} label="MOQ" value={e.moq || "—"} />
              </div>
            </section>

            <Separator />

            {e.materials.length > 0 && (
              <section>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Materials / fabrics available
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.materials.map((m) => (
                    <Badge key={m} variant="outline" className="font-normal">
                      {m}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {e.certifications.length > 0 && (
              <section>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Certifications
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.certifications.map((c) => (
                    <Badge key={c} variant="secondary" className="font-normal">
                      {c}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            <section>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Send a message
              </div>
              <Textarea
                value={draft}
                onChange={(ev) => setDraft(ev.target.value)}
                placeholder={`Write to ${e.name}…`}
                className="mt-2 min-h-[80px]"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button size="sm" onClick={send} disabled={!draft.trim()}>
                    <Send className="mr-1 h-3.5 w-3.5" />
                    Send message
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setMeetOpen(true)}>
                    <CalendarPlus className="mr-1 h-3.5 w-3.5" />
                    Request meeting
                  </Button>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/organizations/$id" params={{ id: e.id }} onClick={() => onOpenChange(false)}>
                    Open full profile <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>
      <MeetingRequestDialog entity={e} open={meetOpen} onOpenChange={setMeetOpen} />
    </>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
