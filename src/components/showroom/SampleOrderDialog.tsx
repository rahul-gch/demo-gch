import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import type { ShowroomProduct } from "@/lib/showroom.functions";
import { toast } from "sonner";
import { Send, Loader2, Package, Calendar, MapPin } from "lucide-react";

interface SampleOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ShowroomProduct | null;
  sellerOrgId: string;
  sellerName?: string;
  onSubmit: (data: {
    sellerOrgId: string;
    productId: string;
    quantity: number;
    material?: string | null;
    notes?: string | null;
    shippingAddress: string;
    neededBy?: string | null;
  }) => Promise<unknown>;
}

export function SampleOrderDialog({
  open,
  onOpenChange,
  product,
  sellerOrgId,
  sellerName,
  onSubmit,
}: SampleOrderDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      toast.error("Please provide a valid shipping address for the sample delivery.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        sellerOrgId,
        productId: product.id,
        quantity: Math.max(1, quantity),
        material: selectedMaterial || null,
        notes: notes.trim() || null,
        shippingAddress: shippingAddress.trim(),
        neededBy: neededBy || null,
      });
      onOpenChange(false);
      // Reset form
      setQuantity(1);
      setSelectedMaterial("");
      setNotes("");
      setShippingAddress("");
      setNeededBy("");
    } catch (err) {
      // toast is handled in mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Request Product Sample
            </DialogTitle>
            <DialogDescription>
              Submit an official sample request to {sellerName || "the supplier"}. A conversation
              thread will be auto-created in your Messages workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Product Summary Box */}
            <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {product.name}
              </div>
              {product.materials && product.materials.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {product.materials.map((m) => (
                    <Badge
                      key={m}
                      variant="outline"
                      className={`cursor-pointer text-[10px] ${
                        selectedMaterial === m
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                      onClick={() => setSelectedMaterial(selectedMaterial === m ? "" : m)}
                    >
                      {m}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity and Material selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sample-qty" className="text-xs font-semibold">
                  Sample Quantity (units/yards)
                </Label>
                <Input
                  id="sample-qty"
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="needed-by" className="text-xs font-semibold">
                  Needed By (Optional)
                </Label>
                <Input
                  id="needed-by"
                  type="date"
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                />
              </div>
            </div>

            {/* Custom Material / Spec if not selected above */}
            <div className="space-y-1.5">
              <Label htmlFor="sample-mat" className="text-xs font-semibold">
                Chosen Material / Colorway
              </Label>
              <Input
                id="sample-mat"
                placeholder="e.g. Natural Ecru / 180gsm"
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
              />
            </div>

            {/* Shipping Address */}
            <div className="space-y-1.5">
              <Label
                htmlFor="ship-address"
                className="text-xs font-semibold flex items-center gap-1"
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Shipping Destination Address <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="ship-address"
                placeholder="Company Name, Attention to, Street address, City, Postal Code, Country, Phone number..."
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
              />
            </div>

            {/* Notes / Special Instructions */}
            <div className="space-y-1.5">
              <Label htmlFor="sample-notes" className="text-xs font-semibold">
                Special Requirements & Notes
              </Label>
              <Textarea
                id="sample-notes"
                placeholder="Any testing parameters, lab dip preferences, certification documentation needed with shipment..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !shippingAddress.trim()}
              className="gap-1.5 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Sample Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
