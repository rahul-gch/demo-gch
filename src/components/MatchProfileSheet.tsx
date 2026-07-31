import { useEffect, useRef, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Sparkles,
} from "lucide-react";
import { useActingOrgId, useSendMessage } from "@/lib/use-comms";
import { toast } from "sonner";
import { MeetingRequestDialog } from "./MeetingRequestDialog";

function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
function pick<T>(id: string, salt: number, arr: T[]) {
  return arr[(hash(id) + salt) % arr.length];
}

function operationsOf(e: Entity) {
  const h = hash(e.id);
  const leadTime = e.leadTimeDays || 28 + (h % 18); // 28–45
  const timeframe = e.deliveryTimeframeDays ?? leadTime + 3;
  const otr = e.onTimeRate ?? 88 + (h % 10); // 88–97
  const delay = e.avgDelayDays ?? h % 5; // 0–4
  const capacityByType: Record<string, string[]> = {
    Spinner: ["8,500 kg / day", "12,000 kg / day", "6,200 kg / day"],
    "Fabric Mill": ["180,000 m / month", "240,000 m / month", "95,000 m / month"],
    "Dye House": ["45,000 kg / month", "70,000 kg / month"],
    "Garment Factory": ["120,000 pcs / month", "220,000 pcs / month", "80,000 pcs / month"],
    Ginner: ["3,200 bales / month", "5,400 bales / month"],
    Farmer: ["180 ha under cultivation", "420 ha under cultivation"],
    "Logistics Provider": ["18 shipments / week", "45 shipments / week"],
    Brand: ["3.2M units / year sourced", "6.5M units / year sourced"],
  };
  const moqByType: Record<string, string[]> = {
    Spinner: ["500 kg", "1,000 kg", "2,000 kg"],
    "Fabric Mill": ["1,500 m", "3,000 m", "5,000 m"],
    "Dye House": ["300 kg", "800 kg"],
    "Garment Factory": ["500 pcs", "1,000 pcs", "2,500 pcs"],
    Ginner: ["50 bales", "120 bales"],
    Farmer: ["10 tonnes", "25 tonnes"],
    "Logistics Provider": ["1 container (20ft)", "1 pallet"],
    Brand: ["—", "—"],
  };
  const capacity =
    e.capacity ||
    pick(e.id, 1, capacityByType[e.entityType] ?? ["120,000 units / month", "60,000 units / month"]);
  const moq = e.moq || pick(e.id, 2, moqByType[e.entityType] ?? ["1,000 pcs", "2,500 pcs"]);
  return { leadTime, timeframe, otr, delay, capacity, moq };
}

function whyThisMatch(viewer: Entity | null | undefined, e: Entity): string[] {
  const lines: string[] = [];

  if (viewer) {
    lines.push(
      `${viewer.entityType} → ${e.entityType} pairing across ${viewer.actorType} and ${e.actorType} — a natural supply-chain adjacency for collaboration and traceability.`,
    );
  } else {
    lines.push(
      `${e.entityType} operating at ${e.actorType}, positioned to plug into an end-to-end verified supply chain.`,
    );
  }

  const sharedMaterials = viewer
    ? e.materials.filter((m) => viewer.materials.map((x) => x.toLowerCase()).includes(m.toLowerCase()))
    : [];
  if (sharedMaterials.length > 0) {
    lines.push(
      `Shared material focus on ${sharedMaterials.slice(0, 3).join(", ")} means product-development handoffs stay consistent from fibre to finished good.`,
    );
  } else if (e.materials.length > 0) {
    lines.push(
      `Works with ${e.materials.slice(0, 3).join(", ")} — well aligned with the material mix commonly sourced across this network.`,
    );
  }

  if (viewer && viewer.country === e.country) {
    lines.push(
      `Same country (${e.country}) shortens logistics, simplifies customs, and enables in-person audits within one working day.`,
    );
  } else if (viewer && viewer.region === e.region) {
    lines.push(
      `Both operate in ${e.region}, keeping freight lead times manageable and reducing cross-border complexity.`,
    );
  } else {
    lines.push(
      `Located in ${[e.city, e.country].filter(Boolean).join(", ")} — a well-connected sourcing hub with established freight corridors.`,
    );
  }

  const ops = operationsOf(e);
  lines.push(
    `Reliable delivery profile: ~${ops.leadTime}-day lead time and a ${ops.otr}% on-time rate over the last 12 months, with average delays under ${Math.max(1, ops.delay)} day${ops.delay === 1 ? "" : "s"}.`,
  );

  const sharedCerts = viewer
    ? e.certifications.filter((c) =>
        viewer.certifications.map((x) => x.toLowerCase()).includes(c.toLowerCase()),
      )
    : [];
  if (sharedCerts.length > 0) {
    lines.push(
      `Compliance overlap on ${sharedCerts.slice(0, 3).join(", ")} — audit trails and transaction certificates can be issued without gaps.`,
    );
  } else if (e.certifications.length > 0) {
    lines.push(
      `Holds ${e.certifications.slice(0, 3).join(", ")}, aligning with the certification standards typically required by brand partners.`,
    );
  } else {
    lines.push(
      `Certification profile can be uplifted quickly through the platform's compliance workflow to match your requirements.`,
    );
  }

  return lines;
}

export function MatchProfileSheet({
  match,
  viewer,
  open,
  onOpenChange,
  initialAction,
}: {
  match: { entity: Entity; score: number; reasons: string[] } | null;
  viewer?: Entity | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialAction?: "message" | "meeting" | null;
}) {
  const [draft, setDraft] = useState("");
  const [meetOpen, setMeetOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    if (initialAction === "meeting") {
      setMeetOpen(true);
    } else if (initialAction === "message") {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open, initialAction, match?.entity.id]);

  if (!match) return null;
  const e = match.entity;
  const ops = operationsOf(e);
  const reasons = whyThisMatch(viewer, e);
  const myOrgId = useActingOrgId(viewer?.orgUuid ?? null);
  const sendMessage = useSendMessage(myOrgId);

  const send = () => {
    if (!draft.trim()) return;
    if (!myOrgId) {
      toast.error("Join or create an organization before messaging partners.");
      return;
    }
    if (!e.orgUuid || e.orgUuid === myOrgId) {
      toast.error("This organization cannot be messaged yet.");
      return;
    }
    sendMessage.mutate(
      { counterpartOrgId: e.orgUuid, body: draft.trim() },
      {
        onSuccess: () => {
          setDraft("");
          toast.success(`Message sent to ${e.name}`);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not send message"),
      },
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SheetTitle className="text-xl">{e.name}</SheetTitle>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => textareaRef.current?.focus()}>
                  <Send className="mr-1 h-3.5 w-3.5" />
                  Send message
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMeetOpen(true)}>
                  <CalendarPlus className="mr-1 h-3.5 w-3.5" />
                  Request meeting
                </Button>
              </div>
            </div>
            <SheetDescription className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="secondary">{e.entityType}</Badge>
              <Badge variant="outline">{e.actorType}</Badge>
              <Badge variant="outline">
                <MapPin className="mr-1 h-3 w-3" />
                {[e.city, e.country].filter(Boolean).join(", ")}
              </Badge>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-5 pb-6">
            <Accordion type="single" collapsible>
              <AccordionItem value="why" className="rounded-md border px-3">
                <AccordionTrigger className="py-3 text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Why this match
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {reasons.map((r, i) => (
                      <p key={i}>{r}</p>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <section>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Operations
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Stat icon={<Clock className="h-4 w-4" />} label="Lead time" value={`${ops.leadTime} d`} />
                <Stat icon={<Truck className="h-4 w-4" />} label="Delivery timeframe" value={`${ops.timeframe} d`} />
                <Stat
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  label="On-time rate"
                  value={`${ops.otr}%`}
                />
                <Stat
                  icon={
                    ops.delay > 3 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )
                  }
                  label="Avg delay"
                  value={`${ops.delay} d`}
                />
                <Stat icon={<Package className="h-4 w-4" />} label="Capacity" value={ops.capacity} />
                <Stat icon={<Package className="h-4 w-4" />} label="MOQ" value={ops.moq} />
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
                ref={textareaRef}
                value={draft}
                onChange={(ev) => setDraft(ev.target.value)}
                placeholder={`Write to ${e.name}…`}
                className="mt-2 min-h-[80px]"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <Button size="sm" onClick={send} disabled={!draft.trim()}>
                  <Send className="mr-1 h-3.5 w-3.5" />
                  Send message
                </Button>
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
      <MeetingRequestDialog entity={e} open={meetOpen} onOpenChange={setMeetOpen} viewerOrgUuid={viewer?.orgUuid ?? null} />
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
