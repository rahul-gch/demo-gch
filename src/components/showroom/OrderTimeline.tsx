import type { SampleOrder, SampleOrderEvent, SampleOrderStatus } from "@/lib/showroom.functions";
import { STATUS_META } from "@/components/showroom/order-status";
import { cn } from "@/lib/utils";

const HAPPY_PATH: SampleOrderStatus[] = ["requested", "quoted", "confirmed", "shipped", "delivered"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderTimeline({
  order,
  events,
}: {
  order: SampleOrder;
  events: SampleOrderEvent[];
}) {
  const terminal = order.status === "declined" || order.status === "withdrawn";
  const reachedIdx = HAPPY_PATH.indexOf(order.status);
  const lastHappy = terminal
    ? Math.max(
        ...events
          .map((e) => HAPPY_PATH.indexOf(e.toStatus))
          .filter((i) => i >= 0),
        0,
      )
    : reachedIdx;

  const eventFor = (status: SampleOrderStatus) =>
    [...events].reverse().find((e) => e.toStatus === status) ?? null;

  const actorName = (orgId: string | null) =>
    orgId === order.sellerOrgId
      ? order.sellerOrg?.name ?? "Supplier"
      : orgId === order.buyerOrgId
        ? order.buyerOrg?.name ?? "Buyer"
        : "—";

  const steps: Array<{ status: SampleOrderStatus; state: "done" | "current" | "todo" | "stopped" }> =
    HAPPY_PATH.map((status, idx) => {
      if (terminal) {
        if (idx <= lastHappy) return { status, state: "done" };
        return { status, state: "todo" };
      }
      if (idx < reachedIdx) return { status, state: "done" };
      if (idx === reachedIdx) return { status, state: order.status === "delivered" ? "done" : "current" };
      return { status, state: "todo" };
    });

  if (terminal) {
    steps.splice(lastHappy + 1, 0, { status: order.status, state: "stopped" });
  }

  return (
    <ol className="relative space-y-0">
      {steps.map((step, idx) => {
        const meta = STATUS_META[step.status];
        const Icon = meta.Icon;
        const ev = eventFor(step.status);
        const isLast = idx === steps.length - 1;
        const tone =
          step.state === "done"
            ? "border-emerald-500 bg-emerald-500 text-white"
            : step.state === "current"
              ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/15"
              : step.state === "stopped"
                ? "border-rose-500 bg-rose-500 text-white"
                : "border-border bg-background text-muted-foreground";
        const dimmed = step.state === "todo";
        return (
          <li key={step.status} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px",
                  step.state === "done" ? "bg-emerald-500" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                tone,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className={cn("min-w-0 pt-0.5", dimmed && "opacity-50")}>
              <div className="text-sm font-medium leading-5">{meta.label}</div>
              {ev ? (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {fmtDate(ev.createdAt)} · {actorName(ev.actorOrgId)}
                  {ev.note && <div className="mt-1 italic text-foreground/80">“{ev.note}”</div>}
                </div>
              ) : (
                <div className="mt-0.5 text-xs text-muted-foreground">{meta.description}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
