import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProductEditorDialog } from "@/components/showroom/ProductEditorDialog";
import { SampleOrderDialog } from "@/components/showroom/SampleOrderDialog";
import {
  useShowroomProduct,
  useUpsertShowroomProduct,
  useDeleteShowroomProduct,
  useSetShowroomProductActive,
  useCreateSampleOrder,
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
  Eye,
  EyeOff,
  Loader2,
  Building2,
} from "lucide-react";

interface ProductDetailPageProps {
  entity: Entity;
  productId: string;
}

export function ProductDetailPage({ entity, productId }: ProductDetailPageProps) {
  const navigate = useNavigate();
  const myOrgId = useActingOrgId(null);
  const targetOrgUuid = entity.orgUuid ?? entity.id;

  const { data, isLoading, error } = useShowroomProduct(targetOrgUuid, productId, myOrgId);
  const upsertMutation = useUpsertShowroomProduct(targetOrgUuid);
  const deleteMutation = useDeleteShowroomProduct(targetOrgUuid);
  const activeMutation = useSetShowroomProductActive(targetOrgUuid);
  const createOrderMutation = useCreateSampleOrder(myOrgId);

  const [activeImage, setActiveImage] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const product = data?.product ?? null;
  const canManage = data?.canManage ?? false;
  const isOwner = data?.isOwner ?? false;
  const isConnected = data?.isConnected ?? false;

  const images = useMemo(() => product?.images ?? [], [product]);
  const cover = images[Math.min(activeImage, Math.max(images.length - 1, 0))] ?? null;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/organizations/$id/showroom" params={{ id: entity.id }}>
            Back to showroom
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          <Link to="/organizations/$id/showroom" params={{ id: entity.id }}>
            <ArrowLeft className="h-4 w-4" /> Back to showroom
          </Link>
        </Button>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-muted">
            {cover ? (
              <img src={cover} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <Package className="h-10 w-10 stroke-[1.25]" />
                <span className="text-xs">No image provided</span>
              </div>
            )}
            {!product.isActive && (
              <Badge className="absolute left-3 top-3 bg-slate-800 text-white">Hidden</Badge>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`h-16 w-20 overflow-hidden rounded-md border transition ${
                    idx === activeImage ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>{data?.org?.name ?? entity.name}</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight">{product.name}</h1>
          </div>

          {product.materials.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.materials.map((m) => (
                <Badge key={m} variant="outline" className="font-normal">
                  {m}
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Description & specifications</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description || "No description provided for this product yet."}
            </p>
          </div>

          <Card>
            <CardContent className="space-y-3 p-4">
              {isOwner ? (
                <p className="text-xs text-muted-foreground">
                  This is your own listing. Connected partners can request samples from this page.
                </p>
              ) : isConnected ? (
                <>
                  <Button className="w-full gap-2" onClick={() => setOrderOpen(true)}>
                    <Send className="h-4 w-4" /> Order sample
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    A conversation thread is created automatically in Messages.
                  </p>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full gap-2">
                    <Link to="/organizations/$id/matchmaking" params={{ id: entity.id }}>
                      <Lock className="h-4 w-4" /> Connect to order samples
                    </Link>
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Sample ordering is reserved for connected partner organizations.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
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

      <SampleOrderDialog
        open={orderOpen}
        onOpenChange={setOrderOpen}
        product={product}
        sellerOrgId={targetOrgUuid}
        sellerName={entity.name}
        onSubmit={async (orderData) => {
          await createOrderMutation.mutateAsync(orderData);
          setOrderOpen(false);
        }}
      />

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
    </div>
  );
}
