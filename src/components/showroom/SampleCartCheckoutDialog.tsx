import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShippingAddressField } from "@/components/showroom/ShippingAddressField";
import { useCreateBatchSampleOrders } from "@/lib/use-showroom";

import { useMyOrgs } from "@/lib/use-comms";
import { getEntity } from "@/seed/all-entities";
import { formatSamplePackage } from "@/lib/showroom.functions";
import type { SampleCartItem } from "@/lib/use-sample-cart";
import type { Entity } from "@/seed/types";
import { toast } from "sonner";
import { Building2, Calendar, Loader2, MapPin, Package, Send, ShoppingBag } from "lucide-react";

interface SampleCartCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerEntity: Entity;
  items: SampleCartItem[];
  onClearCart: () => void;
}

export function SampleCartCheckoutDialog({
  open,
  onOpenChange,
  sellerEntity,
  items,
  onClearCart,
}: SampleCartCheckoutDialogProps) {
  const navigate = useNavigate();
  const sellerUuid = sellerEntity.orgUuid ?? sellerEntity.id;

  const myOrgs = useMyOrgs();
  const [buyerOrgId, setBuyerOrgId] = useState<string>("");
  useEffect(() => {
    if (!buyerOrgId && myOrgs.length > 0) setBuyerOrgId(myOrgs[0].id);
  }, [myOrgs, buyerOrgId]);

  const buyerOrg = myOrgs.find((o) => o.id === buyerOrgId) ?? null;
  const buyerRouteId = useMemo(() => {
    if (!buyerOrgId) return null;
    const e = getEntity(buyerOrgId);
    return e?.slug ?? e?.id ?? buyerOrgId;
  }, [buyerOrgId]);

  const [address, setAddress] = useState("");
  const [useCustomAddress, setUseCustomAddress] = useState(false);

  const [neededBy, setNeededBy] = useState("");
  const [notes, setNotes] = useState("");

  const createBatch = useCreateBatchSampleOrders();

  const addressOk = address.trim().length >= 3;
  const canSubmit = Boolean(
    buyerOrgId &&
      items.length > 0 &&
      addressOk &&
      !createBatch.isPending,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerOrgId || items.length === 0) return;
    if (!addressOk) {
      toast.error("Please provide the delivery address.");
      return;
    }

    try {
      const result = await createBatch.mutateAsync({
        buyerOrgId,
        sellerOrgId: sellerUuid,
        items: items.map((i) => ({
          productId: i.productId,
          hangerQty: i.hangerQty,
          metersQty: i.metersQty,
          material: i.selectedMaterial || null,
        })),
        shippingAddress: address.trim(),
        neededBy: neededBy || null,
        notes: notes.trim() || null,
      });

      toast.success(`Sent sample request for ${result.count} fabrics to ${result.sellerName}`, {
        description: `Placed as ${buyerOrg?.name ?? "your organization"}. View them under Outbound Orders.`,
      });

      onClearCart();
      onOpenChange(false);

      if (buyerRouteId && result.firstOrderId) {
        navigate({
          to: "/organizations/$id/showroom/orders/$orderId",
          params: { id: buyerRouteId, orderId: result.firstOrderId },
        });
      }
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <ShoppingBag className="h-5 w-5" />
            <DialogTitle className="text-xl">Request Fabric Samples</DialogTitle>
          </div>
          <DialogDescription>
            Submit your sample package request to <span className="font-semibold text-foreground">{sellerEntity.name}</span>.
            They will review and confirm your sample shipment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Selected Fabrics Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Selected Samples ({items.length})
              </Label>
              <span className="text-xs text-muted-foreground">
                Max 1 Hanger & 3m per fabric
              </span>
            </div>

            <div className="rounded-lg border bg-muted/30 divide-y max-h-48 overflow-y-auto">
              {items.map((item) => {
                const pkg = formatSamplePackage(item.hangerQty, item.metersQty);
                return (
                  <div key={item.productId} className="flex items-center gap-3 p-2.5 text-sm">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded border bg-muted">
                      {item.image ? (
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{item.productName}</div>
                      {item.selectedMaterial && (
                        <div className="text-xs text-muted-foreground truncate">
                          Colorway: {item.selectedMaterial}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="font-semibold text-xs shrink-0">
                      {pkg}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Organization Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-medium">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Ordering as Organization
            </Label>
            {myOrgs.length <= 1 ? (
              <div className="rounded-md border bg-muted/40 p-2.5 text-sm font-medium">
                {myOrgs[0]?.name ?? "Your Organization"}
              </div>
            ) : (
              <Select value={buyerOrgId} onValueChange={setBuyerOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your organization" />
                </SelectTrigger>
                <SelectContent>
                  {myOrgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Shipping destination */}
          <ShippingAddressField
            orgId={buyerOrgId || null}
            value={address}
            onChange={setAddress}
            useCustom={useCustomAddress}
            onUseCustomChange={setUseCustomAddress}
            id="batch-address"
          />


          {/* Needed By and Notes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="batch-needed-by" className="flex items-center gap-2 text-xs font-medium">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Needed By (optional)
              </Label>
              <Input
                id="batch-needed-by"
                type="date"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-notes" className="text-xs font-medium">
                Project / Wash Notes (optional)
              </Label>
              <Input
                id="batch-notes"
                placeholder="e.g. SS27 denim collection development"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createBatch.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={!canSubmit}>
              {createBatch.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Sample Request ({items.length} fabric{items.length > 1 ? "s" : ""})
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
