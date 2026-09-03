import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ShowroomProduct } from "@/lib/showroom.functions";
import { ProductImage } from "@/components/showroom/ProductImage";
import {
  Edit2,
  Trash2,
  Send,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
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

export function ProductCard({
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

  const detailLink = orgRouteId ? (
    <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
      <DetailLink>
        <Eye className="h-3.5 w-3.5" /> View
      </DetailLink>
    </Button>
  ) : null;

  const media = (
    <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
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
      <Card className="group flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md border-slate-200/80">
        <DetailLink className="block">{media}</DetailLink>

        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              <DetailLink className={orgRouteId ? "hover:underline" : undefined}>{product.name}</DetailLink>
            </h3>
          </div>
          {product.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground mt-1">{product.description}</p>
          )}
        </CardHeader>

        <CardContent className="flex-1 p-4 pt-1">
          {product.materials && product.materials.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {product.materials.map((mat) => (
                <Badge
                  key={mat}
                  variant="outline"
                  className="bg-slate-50 text-[11px] font-normal text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {mat}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t bg-slate-50/50 p-3 dark:bg-slate-900/50">
          {canManage ? (
            <>
              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={product.isActive}
                    onCheckedChange={(checked) => onToggleActive?.(product, checked)}
                    aria-label="Toggle published"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {product.isActive ? "Visible to partners" : "Hidden"}
                  </span>
                </div>
                {detailLink}
              </div>
              <div className="flex w-full items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onEdit?.(product)}
                >
                  <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50"
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </>
          ) : (
            <div className="flex w-full items-center gap-2">
              {detailLink}
              {isConnected ? (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs font-medium shadow-sm"
                  onClick={() => onOrderSample?.(product)}
                >
                  <Send className="h-3.5 w-3.5" />
                  Order Sample
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                  onClick={onConnect}
                >
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  Connect to Order
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product from showroom?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{product.name}&rdquo;? Connected partners will
              no longer be able to see or order samples of this product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
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
}
