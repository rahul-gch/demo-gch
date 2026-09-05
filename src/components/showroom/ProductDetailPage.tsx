import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProductEditorDialog } from "@/components/showroom/ProductEditorDialog";
import { ProductImage } from "@/components/showroom/ProductImage";
import { parseProductDescription } from "@/lib/product-description";
import { ShowroomLocked } from "@/components/showroom/ShowroomLocked";
import { useSampleCart } from "@/lib/use-sample-cart";
import { SampleCartDrawer } from "@/components/showroom/SampleCartDrawer";
import {
  useShowroomProduct,
  useUpsertShowroomProduct,
  useDeleteShowroomProduct,
  useSetShowroomProductActive,
} from "@/lib/use-showroom";
import { useActingOrgId } from "@/lib/use-comms";
import type { Entity } from "@/seed/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Package,
  Edit2,
  Trash2,
  Send,
  Lock,
  Loader2,
  Building2,
  ShoppingBag,
} from "lucide-react";

interface ProductDetailPageProps {
  entity: Entity;
  productId: string;
  /** "member" = inside the org workspace; "public" = reached via the network directory. */
  mode?: "member" | "public";
}

export function ProductDetailPage({ entity, productId, mode = "member" }: ProductDetailPageProps) {
  const navigate = useNavigate();
  const myOrgId = useActingOrgId(null);
  const targetOrgUuid = entity.orgUuid ?? entity.id;

  const { data, isLoading, error } = useShowroomProduct(targetOrgUuid, productId, myOrgId);
  const upsertMutation = useUpsertShowroomProduct(targetOrgUuid);
  const deleteMutation = useDeleteShowroomProduct(targetOrgUuid);
  const activeMutation = useSetShowroomProductActive(targetOrgUuid);

  const cart = useSampleCart(targetOrgUuid);
  const inCart = data?.product ? cart.isInCart(data.product.id) : false;

  const [activeImage, setActiveImage] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const product = data?.product ?? null;
  const canManage = data?.canManage ?? false;
  const isOwner = data?.isOwner ?? false;
  const isConnected = data?.isConnected ?? false;

  const images = useMemo(() => product?.images ?? [], [product]);
  const cover = images[Math.min(activeImage, Math.max(images.length - 1, 0))] ?? null;
  const parsed = useMemo(() => parseProductDescription(product?.description), [product?.description]);

  const backLink =
    mode === "public" ? (
      <Link to="/directory/$id/showroom" params={{ id: entity.id }}>
        <ArrowLeft className="h-4 w-4" /> Back to showroom
      </Link>
    ) : (
      <Link to="/organizations/$id/showroom" params={{ id: entity.id }}>
        <ArrowLeft className="h-4 w-4" /> Back to showroom
      </Link>
    );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data?.locked) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <ShowroomLocked entity={entity} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <Card className="mx-auto max-w-lg border-dashed p-10 text-center">
        <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h1 className="mt-3 text-lg font-semibold">Product unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This product may have been removed or is not published.
        </p>
        <Button asChild variant="ghost" size="sm" className="mt-4 gap-1.5">
          {backLink}
        </Button>
      </Card>
    );
  }

  const actionCard = (
    <div className="flex flex-col items-end gap-1.5 pt-2">
      {isOwner ? (
        <p className="text-right text-xs leading-relaxed text-muted-foreground">
          This is your own listing. Connected partners can request samples from this page.
        </p>
      ) : isConnected ? (
        <>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button
              variant={inCart ? "secondary" : "outline"}
              size="lg"
              className="gap-2 px-5 shadow-sm"
              onClick={() => {
                if (inCart) {
                  cart.removeItem(product.id);
                } else {
                  cart.addItem(product);
                }
              }}
            >
              <ShoppingBag className="h-4 w-4" />
              {inCart ? "In Sample Cart" : "Add to Sample Cart"}
            </Button>
            <Button asChild size="lg" className="gap-2 px-6 shadow-sm">
              <Link
                to="/directory/$id/showroom/$productId/order"
                params={{ id: entity.id, productId: product.id }}
              >
                <Send className="h-4 w-4" /> Request sample directly
              </Link>
            </Button>
          </div>
          <p className="text-right text-[11px] text-muted-foreground">
            Order single sample or add multiple fabrics to your cart for a combined request.
          </p>
        </>
      ) : (
        <>
          <Button asChild variant="outline" size="lg" className="gap-2 px-6">
            <Link to="/directory/$id" params={{ id: entity.id }}>
              <Lock className="h-4 w-4" /> Connect to request samples
            </Link>
          </Button>
          <p className="text-right text-[11px] text-muted-foreground">
            Sample requests are reserved for connected partner organizations.
          </p>
        </>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          {backLink}
        </Button>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 items-center gap-2 rounded-md border px-3">
              {product.isActive ? (
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <Label htmlFor="publish-toggle" className="text-xs font-medium">
                {product.isActive ? "Published" : "Hidden"}
              </Label>
              <Switch
                id="publish-toggle"
                checked={product.isActive}
                disabled={activeMutation.isPending}
                onCheckedChange={(checked) =>
                  activeMutation.mutate({ productId: product.id, isActive: checked })
                }
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditorOpen(true)}>
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-rose-600 hover:text-rose-700"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted">
            <ProductImage src={cover} alt={product.name} fit="contain" />
            {!product.isActive && (
              <Badge className="absolute left-3 top-3 bg-slate-800 text-white">Hidden</Badge>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  aria-label={`Show image ${idx + 1}`}
                  aria-pressed={idx === activeImage}
                  className={`aspect-square overflow-hidden rounded-md border bg-muted transition ${
                    idx === activeImage
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <ProductImage src={img} alt="" placeholderLabel={null} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>{data?.org?.name ?? entity.name}</span>
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {product.name}
            </h1>
            {product.materials.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.materials.map((m) => (
                  <Badge key={m} variant="outline" className="font-normal">
                    {m}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Description</h2>
            {parsed.prose.length > 0 ? (
              parsed.prose.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {para}
                </p>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {parsed.specs.length > 0
                  ? "See specifications below."
                  : "No description provided for this product yet."}
              </p>
            )}
          </section>

          {parsed.specs.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Specifications</h2>
              <dl className="overflow-hidden rounded-lg border text-sm">
                {parsed.specs.map((row, i) => (
                  <div
                    key={`${row.label}-${i}`}
                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-b px-3 py-2 last:border-b-0 odd:bg-muted/40"
                  >
                    <dt className="min-w-0 truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd className="min-w-0 break-words text-foreground">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {actionCard}
        </div>
      </div>

      {canManage && (
        <ProductEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          product={product}
          orgId={targetOrgUuid}
          onSave={async (prodData) => {
            await upsertMutation.mutateAsync(prodData);
            setEditorOpen(false);
          }}
        />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{product.name}&rdquo; will be removed from your showroom permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={async () => {
                await deleteMutation.mutateAsync(product.id);
                setDeleteOpen(false);
                navigate({ to: "/organizations/$id/showroom", params: { id: entity.id } });
              }}
            >
              Delete product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SampleCartDrawer sellerEntity={entity} canOrder={isConnected} />
    </div>
  );
}
