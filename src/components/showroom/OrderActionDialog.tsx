import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SampleOrder, SampleOrderAction } from "@/lib/showroom.functions";
import { formatMoney } from "@/components/showroom/order-status";
import { Loader2 } from "lucide-react";

const CURRENCIES = ["EUR", "USD", "GBP", "INR", "CNY", "TRY", "EGP", "BDT", "PKR", "VND"];

const COPY: Record<SampleOrderAction, { title: string; description: string; cta: string }> = {
  quote: {
    title: "Send a quote",
    description: "Tell the buyer what the samples and shipping will cost and when they can ship.",
    cta: "Send quote",
  },
  unquote: {
    title: "Withdraw your quote",
    description:
      "Retract the quote you sent. The order goes back to “Requested” so you can send a revised quote. The order is not cancelled.",
    cta: "Withdraw quote",
  },
  decline: {
    title: "Decline this order",
    description: "Let the buyer know why you cannot fulfil this sample request.",
    cta: "Decline order",
  },
  confirm: {
    title: "Confirm the quote",
    description: "Confirm you accept the quoted price. The supplier will prepare the samples.",
    cta: "Confirm quote",
  },
  withdraw: {
    title: "Withdraw request",
    description: "Cancel this sample request. The supplier will be notified.",
    cta: "Withdraw request",
  },
  ship: {
    title: "Mark as shipped",
    description: "Add a tracking reference so the buyer can follow the parcel.",
    cta: "Mark shipped",
  },
  deliver: {
    title: "Mark as delivered",
    description: "Confirm the samples arrived at the buyer.",
    cta: "Mark delivered",
  },
};

export interface OrderActionPayload {
  action: SampleOrderAction;
  note?: string;
  quote?: { price: number; currency: string; shippingCost?: number | null; leadTimeDays?: number | null };
  trackingRef?: string;
}

export function OrderActionDialog({
  order,
  action,
  onOpenChange,
  onSubmit,
}: {
  order: SampleOrder | null;
  action: SampleOrderAction | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: OrderActionPayload) => Promise<unknown>;
}) {
  const [note, setNote] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [shipping, setShipping] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNote("");
    setPrice("");
    setShipping("");
    setLeadTime("");
    setTracking("");
    setCurrency(order?.quoteCurrency ?? "EUR");
  }, [order?.id, action, order?.quoteCurrency]);

  const open = Boolean(order && action);
  if (!order || !action) return null;
  const copy = COPY[action];
  const destructive = action === "decline" || action === "withdraw";
  const priceNum = Number(price);
  const quoteInvalid = action === "quote" && (!price.trim() || Number.isNaN(priceNum) || priceNum < 0);

  const submit = async () => {
    setBusy(true);
    try {
      const payload: OrderActionPayload = { action, note: note.trim() || undefined };
      if (action === "quote") {
        payload.quote = {
          price: priceNum,
          currency,
          shippingCost: shipping.trim() ? Number(shipping) : null,
          leadTimeDays: leadTime.trim() ? Number(leadTime) : null,
        };
      }
      if (action === "ship") payload.trackingRef = tracking.trim() || undefined;
      await onSubmit(payload);
      onOpenChange(false);
    } catch {
      // toast handled by mutation
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <div className="font-medium text-foreground">{order.product?.name ?? "Showroom product"}</div>
            <div className="mt-0.5 text-muted-foreground">
              {order.quantity} units
              {order.material ? ` · ${order.material}` : ""}
            </div>
          </div>

          {action === "quote" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 grid grid-cols-[1fr_7rem] gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="q-price" className="text-xs">
                    Sample price <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="q-price"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-ship" className="text-xs">
                  Shipping cost
                </Label>
                <Input
                  id="q-ship"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-lead" className="text-xs">
                  Lead time (days)
                </Label>
                <Input
                  id="q-lead"
                  type="number"
                  min={0}
                  max={365}
                  placeholder="e.g. 7"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {action === "confirm" && (
            <div className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sample price</span>
                <span className="font-medium">{formatMoney(order.quotedPrice, order.quoteCurrency)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">
                  {formatMoney(order.shippingCost, order.quoteCurrency) ?? "—"}
                </span>
              </div>
              {order.leadTimeDays !== null && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">Lead time</span>
                  <span className="font-medium">{order.leadTimeDays} days</span>
                </div>
              )}
            </div>
          )}

          {action === "ship" && (
            <div className="space-y-1.5">
              <Label htmlFor="q-track" className="text-xs">
                Tracking reference
              </Label>
              <Input
                id="q-track"
                placeholder="Carrier + tracking number"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="q-note" className="text-xs">
              Message to partner {action === "decline" ? "" : "(optional)"}
            </Label>
            <Textarea
              id="q-note"
              rows={2}
              placeholder="Posted in your shared conversation."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={submit}
            disabled={busy || quoteInvalid}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {copy.cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
