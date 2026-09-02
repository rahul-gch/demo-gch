import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SampleOrder, SampleOrderAction } from "@/lib/showroom.functions";
import { OrderActionDialog, type OrderActionPayload } from "@/components/showroom/OrderActionDialog";
import { OrderStatusBadge, formatMoney, quoteTotal } from "@/components/showroom/order-status";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  Inbox,
  MapPin,
  Package,
  Send,
  ArrowRight,
} from "lucide-react";

interface SampleOrdersPanelProps {
  inbound: SampleOrder[];
  outbound: SampleOrder[];
  /** Route id (slug) of the organization whose workspace this is. */
  orgRouteId: string;
  onAction: (orderId: string, payload: OrderActionPayload) => Promise<unknown>;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function SampleOrdersPanel({ inbound, outbound, orgRouteId, onAction }: SampleOrdersPanelProps) {
  const [dialog, setDialog] = useState<{ order: SampleOrder | null; action: SampleOrderAction | null }>({
    order: null,
    action: null,
  });

  const pendingInbound = inbound.filter((o) => o.status === "requested" || o.status === "confirmed").length;
  const pendingOutbound = outbound.filter((o) => o.status === "quoted").length;

  const openAction = (order: SampleOrder, action: SampleOrderAction) => setDialog({ order, action });

  const renderOrder = (order: SampleOrder, side: "inbound" | "outbound") => {
    const counterpart = side === "inbound" ? order.buyerOrg : order.sellerOrg;
    const total = quoteTotal(order.quotedPrice, order.shippingCost);
    const cover = order.product?.images?.[0] ?? null;

    return (
      <Card key={order.id} className="p-4 transition-colors hover:border-slate-300">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Package className="h-5 w-5" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/organizations/$id/showroom/orders/$orderId"
                params={{ id: orgRouteId, orderId: order.id }}
                className="font-semibold text-foreground hover:underline"
              >
                {order.product?.name ?? "Showroom product"}
              </Link>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground/80">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                {side === "inbound" ? "From" : "Supplier"}: {counterpart?.name ?? "Organization"}
              </span>
              <span>
                Qty <strong className="text-foreground">{order.quantity}</strong>
              </span>
              {order.material && (
                <span>
                  Material <strong className="text-foreground">{order.material}</strong>
                </span>
              )}
              {order.neededBy && (
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <Calendar className="h-3.5 w-3.5" /> Needed by {order.neededBy}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {fmtDate(order.createdAt)}
              </span>
            </div>

            {side === "outbound" && (
              <div className="text-[11px] text-muted-foreground">
                Ordered as <strong className="text-foreground/80">{order.buyerOrg?.name ?? "your organization"}</strong>
              </div>
            )}

            {total !== null && (
              <div className="text-xs">
                Quote:{" "}
                <strong className="text-foreground">{formatMoney(total, order.quoteCurrency)}</strong>
                {order.shippingCost ? (
                  <span className="text-muted-foreground"> (incl. shipping)</span>
                ) : null}
                {order.leadTimeDays ? (
                  <span className="text-muted-foreground"> · {order.leadTimeDays} days</span>
                ) : null}
              </div>
            )}

            {side === "inbound" && (
              <div className="flex items-start gap-1.5 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-2">{order.shippingAddress}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            {side === "inbound" && order.status === "requested" && (
              <>
                <Button size="sm" className="h-8 text-xs" onClick={() => openAction(order, "quote")}>
                  Send quote
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => openAction(order, "decline")}
                >
                  Decline
                </Button>
              </>
            )}
            {side === "inbound" && order.status === "confirmed" && (
              <Button size="sm" className="h-8 text-xs" onClick={() => openAction(order, "ship")}>
                Mark shipped
              </Button>
            )}
            {side === "inbound" && order.status === "shipped" && (
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openAction(order, "deliver")}>
                Mark delivered
              </Button>
            )}
            {side === "outbound" && order.status === "quoted" && (
              <>
                <Button size="sm" className="h-8 text-xs" onClick={() => openAction(order, "confirm")}>
                  Confirm quote
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-muted-foreground hover:text-rose-600"
                  onClick={() => openAction(order, "withdraw")}
                >
                  Withdraw
                </Button>
              </>
            )}
            {side === "outbound" && order.status === "requested" && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground hover:text-rose-600"
                onClick={() => openAction(order, "withdraw")}
              >
                Withdraw
              </Button>
            )}
            <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs">
              <Link to="/organizations/$id/showroom/orders/$orderId" params={{ id: orgRouteId, orderId: order.id }}>
                View order <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue={pendingOutbound > 0 && pendingInbound === 0 ? "outbound" : "inbound"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-96">
          <TabsTrigger value="inbound" className="gap-2">
            <ArrowDownLeft className="h-4 w-4" /> Inbound orders
            {pendingInbound > 0 && (
              <Badge className="h-5 min-w-5 justify-center bg-amber-600 px-1 text-[10px]">{pendingInbound}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outbound" className="gap-2">
            <ArrowUpRight className="h-4 w-4" /> Outbound orders
            {pendingOutbound > 0 && (
              <Badge className="h-5 min-w-5 justify-center px-1 text-[10px]">{pendingOutbound}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbound" className="mt-4 space-y-3">
          {inbound.length === 0 ? (
            <Card className="border-dashed p-8 text-center text-muted-foreground">
              <Inbox className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">No inbound sample orders yet</h3>
              <p className="mt-1 text-xs">
                When connected partners order samples from your showroom they appear here for quoting.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">{inbound.map((o) => renderOrder(o, "inbound"))}</div>
          )}
        </TabsContent>

        <TabsContent value="outbound" className="mt-4 space-y-3">
          {outbound.length === 0 ? (
            <Card className="border-dashed p-8 text-center text-muted-foreground">
              <Send className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">No outbound sample orders</h3>
              <p className="mt-1 text-xs">
                Open a connected partner's showroom from the directory to order samples.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">{outbound.map((o) => renderOrder(o, "outbound"))}</div>
          )}
        </TabsContent>
      </Tabs>

      <OrderActionDialog
        order={dialog.order}
        action={dialog.action}
        onOpenChange={(open) => !open && setDialog({ order: null, action: null })}
        onSubmit={(payload) => onAction(dialog.order!.id, payload)}
      />
    </div>
  );
}
