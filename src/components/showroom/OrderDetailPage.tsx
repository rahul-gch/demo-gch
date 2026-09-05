import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSampleOrder, useTransitionSampleOrder } from "@/lib/use-showroom";
import { OrderTimeline } from "@/components/showroom/OrderTimeline";
import { OrderActionDialog } from "@/components/showroom/OrderActionDialog";
import { OrderStatusBadge, STATUS_META, formatMoney, quoteTotal } from "@/components/showroom/order-status";
import type { SampleOrderAction } from "@/lib/showroom.functions";
import type { Entity } from "@/seed/types";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  Truck,
} from "lucide-react";

export function OrderDetailPage({ entity, orderId }: { entity: Entity; orderId: string }) {
  const orgUuid = entity.orgUuid ?? entity.id;
  const { data, isLoading, error } = useSampleOrder(orderId, orgUuid);
  const transition = useTransitionSampleOrder(orgUuid);
  const [action, setAction] = useState<SampleOrderAction | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="mx-auto max-w-lg border-dashed p-10 text-center">
        <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h1 className="mt-3 text-lg font-semibold">Order unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "This order could not be found."}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/organizations/$id/showroom" params={{ id: entity.id }}>
            Back to showroom
          </Link>
        </Button>
      </Card>
    );
  }

  const { order, events, role } = data;
  const counterpart = role === "seller" ? order.buyerOrg : order.sellerOrg;
  const total = quoteTotal(order.quotedPrice, order.shippingCost);
  const cover = order.product?.images?.[0] ?? null;
  const meta = STATUS_META[order.status];

  const actions: Array<{ action: SampleOrderAction; label: string; variant?: "default" | "outline" | "ghost" }> = [];
  if (role === "seller") {
    if (order.status === "requested") {
      actions.push({ action: "quote", label: "Send quote" }, { action: "decline", label: "Decline", variant: "ghost" });
    } else if (order.status === "quoted") {
      actions.push(
        { action: "unquote", label: "Withdraw quote", variant: "outline" },
        { action: "decline", label: "Decline order", variant: "ghost" },
      );
    } else if (order.status === "confirmed") {
      actions.push({ action: "ship", label: "Mark shipped" });
    } else if (order.status === "shipped") {
      actions.push({ action: "deliver", label: "Mark delivered" });
    }
  } else {
    if (order.status === "quoted") {
      actions.push({ action: "confirm", label: "Confirm quote" }, { action: "withdraw", label: "Withdraw", variant: "ghost" });
    } else if (order.status === "requested") {
      actions.push({ action: "withdraw", label: "Withdraw request", variant: "ghost" });
    }
  }

  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          <Link to="/organizations/$id/showroom" params={{ id: entity.id }}>
            <ArrowLeft className="h-4 w-4" /> Back to showroom
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {order.conversationId && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/organizations/$id/messages" params={{ id: entity.id }}>
                <MessageSquare className="h-3.5 w-3.5" /> Open conversation
              </Link>
            </Button>
          )}
          {actions.map((a) => (
            <Button
              key={a.action}
              size="sm"
              variant={a.variant ?? "default"}
              className={a.variant === "ghost" ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700" : ""}
              onClick={() => setAction(a.action)}
              disabled={transition.isPending}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Sample order #{shortId}</h1>
          <OrderStatusBadge status={order.status} />
          <Badge variant="outline" className="font-normal">
            {role === "seller" ? "You are the supplier" : "You are the buyer"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Product */}
          <Card>
            <CardContent className="flex gap-4 p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
                {cover ? (
                  <img src={cover} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Package className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">Product</div>
                <div className="text-base font-semibold">{order.product?.name ?? "Showroom product"}</div>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                  {(() => {
                    const matchPkg = order.material?.match(/\((1 Hanger[^)]*|\d+ Meter[^)]*|\d+m)\)/i);
                    const pkgText = matchPkg ? matchPkg[1] : `${order.quantity} unit${order.quantity > 1 ? "s" : ""}`;
                    const cleanMaterial = matchPkg ? order.material?.replace(matchPkg[0], "").trim() : order.material;
                    return (
                      <>
                        <div>
                          <div className="text-muted-foreground">Sample package</div>
                          <div className="font-semibold text-primary">{pkgText}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Material / colorway</div>
                          <div className="font-medium">{cleanMaterial || "—"}</div>
                        </div>
                      </>
                    );
                  })()}
                  <div>
                    <div className="text-muted-foreground">Needed by</div>
                    <div className="font-medium">{order.neededBy || "Flexible"}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parties + shipping */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-primary" /> Buyer
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="font-medium">{order.buyerOrg?.name ?? "Organization"}</div>
                <div className="text-xs text-muted-foreground">{order.buyerOrg?.country ?? ""}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-primary" /> Supplier
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="font-medium">{order.sellerOrg?.name ?? "Organization"}</div>
                <div className="text-xs text-muted-foreground">{order.sellerOrg?.country ?? ""}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" /> Shipping destination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="whitespace-pre-line">{order.shippingAddress}</p>
              {order.trackingRef && (
                <div className="flex items-center gap-2 rounded-md bg-muted/40 p-2 text-xs">
                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                  Tracking: <strong>{order.trackingRef}</strong>
                </div>
              )}
              {order.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="text-xs text-muted-foreground">Buyer notes</div>
                    <p className="mt-0.5 whitespace-pre-line text-sm italic">“{order.notes}”</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quote */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quote</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {order.quotedPrice === null ? (
                <p className="text-xs text-muted-foreground">
                  {role === "seller"
                    ? "No quote sent yet. Send a quote so the buyer can confirm."
                    : "The supplier has not quoted this order yet."}
                </p>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sample price</span>
                    <span className="font-medium">{formatMoney(order.quotedPrice, order.quoteCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">{formatMoney(order.shippingCost, order.quoteCurrency) ?? "—"}</span>
                  </div>
                  {order.leadTimeDays !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lead time</span>
                      <span className="font-medium">{order.leadTimeDays} days</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">{formatMoney(total, order.quoteCurrency)}</span>
                  </div>
                  {order.quoteNote && (
                    <p className="pt-1 text-xs italic text-muted-foreground">“{order.quoteNote}”</p>
                  )}
                  <p className="pt-1 text-[11px] text-muted-foreground">
                    Payment is settled directly between both organizations; no payment is collected on the platform.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" /> Status timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline order={order} events={events} />
            <Separator className="my-4" />
            <div className="text-xs text-muted-foreground">
              Counterpart: <strong className="text-foreground">{counterpart?.name ?? "—"}</strong>
              <br />
              Placed {new Date(order.createdAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <OrderActionDialog
        order={action ? order : null}
        action={action}
        onOpenChange={(open) => !open && setAction(null)}
        onSubmit={(payload) => transition.mutateAsync({ orderId: order.id, ...payload })}
      />
    </div>
  );
}
