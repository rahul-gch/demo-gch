import { useState, memo } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ShowroomProduct } from "@/lib/showroom.functions";
import { ProductImage } from "@/components/showroom/ProductImage";
import { useSampleCart } from "@/lib/use-sample-cart";
import { Edit2, Trash2, Send, Lock, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
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

interface ProductCardProps {
  product: ShowroomProduct;
  orgRouteId?: string;
  /** Which route tree the detail page lives in: member workspace or public directory. */
  detailBase?: "organizations" | "directory";
  isOwner?: boolean;
  canManage?: boolean;
  isConnected?: boolean;
  onEdit?: (product: ShowroomProduct) => void;
  onDelete?: (productId: string) => void;
  onToggleActive?: (product: ShowroomProduct, isActive: boolean) => void;
  onOrderSample?: (product: ShowroomProduct) => void;
  onConnect?: () => void;
}

export const ProductCard = memo(function ProductCard({
  product,
  orgRouteId,
  detailBase = "organizations",
  isOwner,
  canManage,
  isConnected,
  onEdit,
  onDelete,
  onToggleActive,
  onOrderSample,
  onConnect,
}: ProductCardProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const cart = useSampleCart(product.orgId);
  const inCart = cart.isInCart(product.id);

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[activeImageIdx] ?? null;

  const DetailLink = ({ className, children }: { className?: string; children: React.ReactNode }) =>
    !orgRouteId ? (
      <span className={className}>{children}</span>
    ) : detailBase === "directory" ? (
      <Link
        to="/directory/$id/showroom/$productId"
        params={{ id: orgRouteId, productId: product.id }}
        className={className}
      >
        {children}
      </Link>
    ) : (
      <Link
        to="/organizations/$id/showroom/$productId"
        params={{ id: orgRouteId, productId: product.id }}
        className={className}
      >
        {children}
      </Link>
    );

  const media = (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
      <ProductImage
        src={currentImage}
        alt={product.name}
        className="transition-transform duration-300 group-hover:scale-105"
      />

      {images.length > 1 && (
        <div className="absolute inset-0 flex items-center justify-between p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded-full bg-background/80 backdrop-blur"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded-full bg-background/80 backdrop-blur"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isOwner && (
        <div className="absolute left-2.5 top-2.5">
          <Badge
            variant={product.isActive ? "default" : "secondary"}
            className={`text-[10px] font-medium ${
              product.isActive
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-slate-600 text-white"
            }`}
          >
            {product.isActive ? "Published" : "Hidden"}
          </Badge>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card className="group flex flex-col overflow-hidden border border-border/60 shadow-none transition-colors hover:border-primary/30">
        <DetailLink className="block">{media}</DetailLink>

        <div className="flex flex-col p-3">
          <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-foreground">
            <DetailLink className={orgRouteId ? "hover:underline" : undefined}>{product.name}</DetailLink>
          </h3>

          {canManage ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={product.isActive}
                  onCheckedChange={(checked) => onToggleActive?.(product, checked)}
                  aria-label="Toggle published"
                />
                <span className="text-[11px] text-muted-foreground">
                  {product.isActive ? "Visible" : "Hidden"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit?.(product)}
                  aria-label="Edit product"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteConfirm(true)}
                  aria-label="Delete product"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {isConnected ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant={inCart ? "secondary" : "default"}
                    size="sm"
                    className="h-8 flex-1 gap-1.5 text-xs font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (inCart) {
                        cart.removeItem(product.id);
                      } else {
                        cart.addItem(product);
                      }
                    }}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    {inCart ? "In Sample Cart" : "+ Sample Cart"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOrderSample?.(product);
                    }}
                    title="Request single sample directly"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-full gap-1.5 text-xs font-medium"
                  onClick={onConnect}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Connect to Order
                </Button>
              )}
              <div className="flex justify-end">
                <DetailLink className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  <Eye className="h-3 w-3" />
                  View details
                </DetailLink>
              </div>
            </div>
          )}
        </div>
      </Card>

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product from showroom?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{product.name}&rdquo;? Connected partners will
              no longer be able to see or request samples of this product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete?.(product.id);
                setDeleteConfirm(false);
              }}
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
