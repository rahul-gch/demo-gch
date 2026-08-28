import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ShowroomProduct } from "@/lib/showroom.functions";
import {
  Package,
  Edit2,
  Trash2,
  Send,
  Sparkles,
  Lock,
  ChevronLeft,
  ChevronRight,
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
  isOwner?: boolean;
  canManage?: boolean;
  isConnected?: boolean;
  onEdit?: (product: ShowroomProduct) => void;
  onDelete?: (productId: string) => void;
  onOrderSample?: (product: ShowroomProduct) => void;
  onConnect?: () => void;
}

export function ProductCard({
  product,
  isOwner,
  canManage,
  isConnected,
  onEdit,
  onDelete,
  onOrderSample,
  onConnect,
}: ProductCardProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[activeImageIdx] ?? null;

  return (
    <>
      <Card className="group flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md border-slate-200/80">
        {/* Image Preview Container */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
          {currentImage ? (
            <img
              src={currentImage}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Package className="h-10 w-10 stroke-[1.25] text-slate-400" />
              <span className="text-xs">No image provided</span>
            </div>
          )}

          {/* Multiple Images Navigation */}
          {images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-full bg-background/80 backdrop-blur"
                onClick={(e) => {
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
                  e.stopPropagation();
                  setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Active indicator badge */}
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
                {product.isActive ? "Active" : "Draft / Inactive"}
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {product.name}
            </h3>
          </div>
          {product.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground mt-1">{product.description}</p>
          )}
        </CardHeader>

        <CardContent className="flex-1 p-4 pt-1">
          {/* Materials Tag List */}
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

        <CardFooter className="flex items-center justify-between border-t bg-slate-50/50 p-3 dark:bg-slate-900/50">
          {canManage ? (
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
          ) : isConnected ? (
            <Button
              variant="default"
              size="sm"
              className="w-full gap-1.5 text-xs font-medium shadow-sm"
              onClick={() => onOrderSample?.(product)}
            >
              <Send className="h-3.5 w-3.5" />
              Order Sample
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              onClick={onConnect}
            >
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              Connect to Order
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Delete confirmation dialog */}
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
