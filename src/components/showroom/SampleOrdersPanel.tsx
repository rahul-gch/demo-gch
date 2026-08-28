import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SampleOrder, SampleOrderStatus } from "@/lib/showroom.functions";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  MessageSquare,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  MapPin,
  Calendar,
  Building2,
  Ban,
  Inbox,
  Send,
} from "lucide-react";

interface SampleOrdersPanelProps {
  inbound: SampleOrder[];
  outbound: SampleOrder[];
  orgId: string;
  onUpdateStatus: (
    orderId: string,
    status: SampleOrderStatus,
    message?: string,
  ) => Promise<unknown>;
}

export function SampleOrdersPanel({
  inbound,
  outbound,
  orgId,
  onUpdateStatus,
}: SampleOrdersPanelProps) {
  const [actionDialog, setActionDialog] = useState<{
    order: SampleOrder | null;
    nextStatus: SampleOrderStatus | null;
  }>({ order: null, nextStatus: null });
  const [statusMessage, setStatusMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusBadge = (status: SampleOrderStatus) => {
    switch (status) {
      case "requested":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="mr-1 h-3 w-3" /> Requested
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Accepted
          </Badge>
        );
      case "shipped":
        return (
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300">
            <Truck className="mr-1 h-3 w-3" /> Shipped
          </Badge>
        );
      case "completed":
      case "delivered":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
          </Badge>
        );
      case "declined":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300">
            <XCircle className="mr-1 h-3 w-3" /> Declined
          </Badge>
        );
      case "withdrawn":
      case "cancelled":
        return (
          <Badge variant="outline" className="text-slate-500 border-slate-300">
            <Ban className="mr-1 h-3 w-3" /> Withdrawn
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleConfirmAction = async () => {
    if (!actionDialog.order || !actionDialog.nextStatus) return;
    setIsProcessing(true);
    try {
      await onUpdateStatus(
        actionDialog.order.id,
        actionDialog.nextStatus,
        statusMessage.trim() || undefined,
      );
      setActionDialog({ order: null, nextStatus: null });
      setStatusMessage("");
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingInbound = inbound.filter((o) => o.status === "requested").length;
  const pendingOutbound = outbound.filter((o) => o.status === "requested").length;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="inbound" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-80">
          <TabsTrigger value="inbound" className="gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            Inbound Orders
            {pendingInbound > 0 && (
              <Badge className="h-5 min-w-5 justify-center px-1 text-[10px] bg-amber-600">
                {pendingInbound}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outbound" className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Outbound Requests
            {pendingOutbound > 0 && (
              <Badge className="h-5 min-w-5 justify-center px-1 text-[10px]">
                {pendingOutbound}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* INBOUND ORDERS (Seller View) */}
        <TabsContent value="inbound" className="mt-4 space-y-3">
          {inbound.length === 0 ? (
            <Card className="border-dashed p-8 text-center text-muted-foreground">
              <Inbox className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                No inbound sample orders yet
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                When connected supply chain partners request samples from your showroom, they will
                appear here.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {inbound.map((order) => (
                <Card key={order.id} className="p-4 transition-all hover:border-slate-300">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {order.product?.name ?? "Showroom Product"}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          Requested by: {order.buyerOrg?.name ?? "Partner Organization"}
                        </span>
                        <span>
                          Quantity:{" "}
                          <strong className="text-slate-900 dark:text-slate-100">
                            {order.quantity} units
                          </strong>
                        </span>
                        {order.material && (
                          <span>
                            Material:{" "}
                            <strong className="text-slate-900 dark:text-slate-100">
                              {order.material}
                            </strong>
                          </span>
                        )}
                        {order.neededBy && (
                          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                            <Calendar className="h-3.5 w-3.5" />
                            Needed by: {order.neededBy}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 rounded-md bg-slate-50 p-2.5 text-xs dark:bg-slate-900">
                        <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                          <span>
                            <strong>Ship to:</strong> {order.shippingAddress}
                          </span>
                        </div>
                        {order.notes && (
                          <div className="mt-1 text-slate-500 italic pl-5">
                            &ldquo;{order.notes}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-start">
                      {order.conversationId && (
                        <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                          <Link to="/messages">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Chat
                          </Link>
                        </Button>
                      )}

                      {order.status === "requested" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => setActionDialog({ order, nextStatus: "accepted" })}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-rose-600 hover:bg-rose-50"
                            onClick={() => setActionDialog({ order, nextStatus: "declined" })}
                          >
                            Decline
                          </Button>
                        </>
                      )}

                      {order.status === "accepted" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => setActionDialog({ order, nextStatus: "completed" })}
                        >
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* OUTBOUND REQUESTS (Buyer View) */}
        <TabsContent value="outbound" className="mt-4 space-y-3">
          {outbound.length === 0 ? (
            <Card className="border-dashed p-8 text-center text-muted-foreground">
              <Send className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                No outbound sample requests
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Browse partner showrooms in the Global Directory to discover materials and request
                physical samples.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {outbound.map((order) => (
                <Card key={order.id} className="p-4 transition-all hover:border-slate-300">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {order.product?.name ?? "Showroom Product"}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          Supplier: {order.sellerOrg?.name ?? "Supplier"}
                        </span>
                        <span>
                          Quantity: <strong>{order.quantity} units</strong>
                        </span>
                        {order.material && (
                          <span>
                            Material: <strong>{order.material}</strong>
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-slate-500">
                        Destination: {order.shippingAddress}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-start">
                      {order.conversationId && (
                        <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                          <Link to="/messages">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Messages
                          </Link>
                        </Button>
                      )}

                      {order.status === "requested" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-slate-600 hover:text-rose-600"
                          onClick={() => setActionDialog({ order, nextStatus: "withdrawn" })}
                        >
                          Withdraw Request
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog (Accept, Decline, Complete, Withdraw) */}
      <Dialog
        open={Boolean(actionDialog.order)}
        onOpenChange={(open) => !open && setActionDialog({ order: null, nextStatus: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {actionDialog.nextStatus === "accepted" && "Accept Sample Order"}
              {actionDialog.nextStatus === "declined" && "Decline Sample Order"}
              {actionDialog.nextStatus === "completed" && "Mark Order as Completed"}
              {actionDialog.nextStatus === "withdrawn" && "Withdraw Sample Request"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.nextStatus === "accepted" &&
                "Confirm you can fulfill this sample request. A note will be sent in the partner conversation."}
              {actionDialog.nextStatus === "declined" &&
                "Let the buyer know why you are unable to fulfill this sample at this time."}
              {actionDialog.nextStatus === "completed" &&
                "Mark this sample order as prepared or delivered."}
              {actionDialog.nextStatus === "withdrawn" &&
                "Are you sure you want to cancel this pending sample order?"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Optional message to partner:
            </label>
            <Input
              placeholder="e.g. Tracking number, dispatch timeline, or additional details..."
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ order: null, nextStatus: null })}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={
                actionDialog.nextStatus === "declined" || actionDialog.nextStatus === "withdrawn"
                  ? "destructive"
                  : "default"
              }
              onClick={handleConfirmAction}
              disabled={isProcessing}
            >
              {isProcessing ? "Updating..." : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
