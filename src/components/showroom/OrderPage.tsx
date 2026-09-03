import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useShowroomProduct, useCreateSampleOrder } from "@/lib/use-showroom";
import { useMyOrgs } from "@/lib/use-comms";
import { getEntity } from "@/seed/all-entities";
import type { Entity } from "@/seed/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Package,
  Plus,
  Send,
} from "lucide-react";

export function OrderPage({ entity, productId }: { entity: Entity; productId: string }) {
  const navigate = useNavigate();
  const sellerUuid = entity.orgUuid ?? entity.id;

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

  const { data, isLoading, error } = useShowroomProduct(sellerUuid, productId, buyerOrgId || null);
  const product = data?.product ?? null;
  const isConnected = data?.isConnected ?? false;
  const isOwner = data?.isOwner ?? false;

  const create = useCreateSampleOrder();

  const [quantity, setQuantity] = useState(1);
  const [material, setMaterial] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const cover = product?.images?.[0] ?? null;
  const addressOk = address.trim().length >= 3;
  const canSubmit = Boolean(product && buyerOrgId && isConnected && !isOwner && addressOk && !create.isPending);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !buyerOrgId) return;
    if (!addressOk) {
      toast.error("Please enter the shipping destination.");
      return;
    }
    const result = await create.mutateAsync({
      buyerOrgId,
      sellerOrgId: sellerUuid,
      productId: product.id,
      quantity: Math.max(1, quantity),
      material: material.trim() || null,
      notes: notes.trim() || null,
      shippingAddress: address.trim(),
      neededBy: neededBy || null,
    });
    toast.success(`Sample request sent to ${result.sellerName}`, {
      description: `Placed as ${buyerOrg?.name ?? "your organization"}. Track it under Showroom → Outbound orders.`,
    });
    if (buyerRouteId) {
      navigate({
        to: "/organizations/$id/showroom/orders/$orderId",
        params: { id: buyerRouteId, orderId: result.orderId },
      });
    } else {
      navigate({ to: "/directory/$id/showroom", params: { id: entity.id } });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card className="border-dashed p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h1 className="mt-3 text-lg font-semibold">Product unavailable</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "This product is not published."}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/directory/$id/showroom" params={{ id: entity.id }}>
              Back to showroom
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
        <Link
          to="/directory/$id/showroom/$productId"
          params={{ id: entity.id, productId: product.id }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to product
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Request a sample</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {entity.name} will review your request and reply with a quote. Nothing is charged on the
          platform.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Ordering as */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-primary" /> Ordering as
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myOrgs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  You need to belong to an organization before ordering samples.
                </p>
              ) : myOrgs.length === 1 ? (
                <div className="text-sm font-medium">{myOrgs[0].name}</div>
              ) : (
                <Select value={buyerOrgId} onValueChange={setBuyerOrgId}>
                  <SelectTrigger className="sm:max-w-sm">
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
              <p className="mt-2 text-[11px] text-muted-foreground">
                The order appears in this organization's Outbound orders and its shared conversation
                with {entity.name}.
              </p>
              {buyerOrgId && !isConnected && !isOwner && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 p-2.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {buyerOrg?.name ?? "This organization"} is not connected with {entity.name} yet.{" "}
                    <Link to="/directory/$id" params={{ id: entity.id }} className="underline">
                      Send a connection request
                    </Link>{" "}
                    first.
                  </span>
                </div>
              )}
              {isOwner && (
                <p className="mt-3 text-xs text-rose-600">You cannot request samples from your own showroom.</p>
              )}
            </CardContent>
          </Card>

          {/* Sample details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-primary" /> Sample details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Quantity (units / yards)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={10000}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-24 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setQuantity((q) => Math.min(10000, q + 1))}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="needed-by" className="flex items-center gap-1 text-xs font-medium">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Needed by (optional)
                  </Label>
                  <Input
                    id="needed-by"
                    type="date"
                    value={neededBy}
                    onChange={(e) => setNeededBy(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="material" className="text-xs font-medium">
                  Material / colorway
                </Label>
                {product.materials.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {product.materials.map((m) => (
                      <Badge
                        key={m}
                        variant={material === m ? "default" : "outline"}
                        className="cursor-pointer text-[11px]"
                        onClick={() => setMaterial(material === m ? "" : m)}
                      >
                        {m}
                      </Badge>
                    ))}
                  </div>
                )}
                <Input
                  id="material"
                  placeholder="e.g. Natural ecru / 180 gsm"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" /> Shipping & notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-medium">
                  Shipping destination <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  rows={3}
                  placeholder="Company, attention to, street, city, postal code, country, phone"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-medium">
                  Special requirements (optional)
                </Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="Testing parameters, lab dips, certification documents to include…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                  {cover ? (
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium leading-5">{product.name}</div>
                  <div className="text-xs text-muted-foreground">{entity.name}</div>
                </div>
              </div>
              <Separator />
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ordering as</span>
                  <span className="font-medium">{buyerOrg?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material</span>
                  <span className="font-medium">{material || "Supplier's choice"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Needed by</span>
                  <span className="font-medium">{neededBy || "Flexible"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">Quoted by supplier</span>
                </div>
              </div>
              <Separator />
              <Button type="submit" className="w-full gap-2" disabled={!canSubmit}>
                {create.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send sample request
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Status: Requested → Quoted → Confirmed → Shipped → Delivered
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
