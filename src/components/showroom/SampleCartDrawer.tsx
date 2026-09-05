import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useSampleCart } from "@/lib/use-sample-cart";
import { SampleCartCheckoutDialog } from "@/components/showroom/SampleCartCheckoutDialog";
import { formatSamplePackage } from "@/lib/showroom.functions";
import type { Entity } from "@/seed/types";
import {
  ShoppingBag,
  X,
  Package,
  Trash2,
  Minus,
  Plus,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SampleCartDrawerProps {
  sellerEntity: Entity;
  canOrder?: boolean;
}

export function SampleCartDrawer({ sellerEntity, canOrder = true }: SampleCartDrawerProps) {
  const sellerUuid = sellerEntity.orgUuid ?? sellerEntity.id;
  const { items, count, updateItem, removeItem, clearCart } = useSampleCart(sellerUuid);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { totalHangers, totalMeters, hasInvalidItem } = useMemo(() => {
    let hangers = 0;
    let meters = 0;
    let invalid = false;
    items.forEach((item) => {
      hangers += item.hangerQty;
      meters += item.metersQty;
      if (item.hangerQty === 0 && item.metersQty === 0) {
        invalid = true;
      }
    });
    return { totalHangers: hangers, totalMeters: meters, hasInvalidItem: invalid };
  }, [items]);

  if (count === 0) return null;

  return (
    <>
      {/* Sleek, Non-Obtrusive Floating Cart Pill Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Button
          onClick={() => setSheetOpen(true)}
          className="h-12 px-5 rounded-full shadow-2xl bg-primary text-primary-foreground hover:bg-primary/95 gap-3 border border-white/15 cursor-pointer text-sm font-semibold transition-transform hover:scale-105 active:scale-95"
        >
          <div className="relative flex items-center justify-center">
            <ShoppingBag className="h-4 w-4" />
            <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-xs">
              {count}
            </span>
          </div>
          <span>Sample Cart</span>
          <span className="text-primary-foreground/70 font-normal hidden sm:inline">• View</span>
        </Button>
      </div>

      {/* Clean Right Slide-Over Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
            <div>
              <SheetTitle className="text-base font-semibold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Sample Cart ({count})
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                {sellerEntity.name}
              </SheetDescription>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </Button>
          </SheetHeader>

          {/* Body: Clean vertical list of fabrics */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y">
            {items.map((item, idx) => {
              const itemTotalInvalid = item.hangerQty === 0 && item.metersQty === 0;
              return (
                <div key={item.productId} className={cn("space-y-3", idx > 0 && "pt-3")}>
                  {/* Top: Photo, Name & Delete */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {item.image ? (
                          <img src={item.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{item.productName}</div>
                        {item.selectedMaterial ? (
                          <div className="text-xs text-muted-foreground truncate">
                            Color: {item.selectedMaterial}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            {formatSamplePackage(item.hangerQty, item.metersQty)}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeItem(item.productId)}
                      aria-label={`Remove ${item.productName}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Clean, Simple Option Steppers (matching Image 2) */}
                  <div className="rounded-lg border bg-muted/20 p-2.5 space-y-2">
                    {/* Hangers Stepper */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-foreground">HANGERS</div>
                        <div className="text-[10px] text-muted-foreground">max 1</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                          disabled={item.hangerQty <= 0}
                          onClick={() =>
                            updateItem(item.productId, {
                              hangerQty: Math.max(0, item.hangerQty - 1),
                            })
                          }
                          aria-label="Decrease hangers"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <span className="w-5 text-center font-semibold text-xs text-foreground tabular-nums">
                          {item.hangerQty}
                        </span>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                          disabled={item.hangerQty >= 1}
                          onClick={() =>
                            updateItem(item.productId, {
                              hangerQty: Math.min(1, item.hangerQty + 1),
                            })
                          }
                          aria-label="Increase hangers"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Meters Stepper */}
                    <div className="flex items-center justify-between border-t pt-2">
                      <div>
                        <div className="text-xs font-semibold text-foreground">METERS</div>
                        <div className="text-[10px] text-muted-foreground">max 3</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                          disabled={item.metersQty <= 0}
                          onClick={() =>
                            updateItem(item.productId, {
                              metersQty: Math.max(0, item.metersQty - 1),
                            })
                          }
                          aria-label="Decrease meters"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <span className="w-5 text-center font-semibold text-xs text-foreground tabular-nums">
                          {item.metersQty}
                        </span>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                          disabled={item.metersQty >= 3}
                          onClick={() =>
                            updateItem(item.productId, {
                              metersQty: Math.min(3, item.metersQty + 1),
                            })
                          }
                          aria-label="Increase meters"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {itemTotalInvalid && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-1">
                        ⚠️ Please select at least 1 hanger or meters
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer: Package Summary & Checkout Button */}
          <SheetFooter className="p-4 border-t bg-muted/20 flex flex-col gap-3 sm:flex-col sm:space-x-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Package:</span>
              <span className="font-semibold text-foreground">
                {totalHangers} Hanger{totalHangers !== 1 ? "s" : ""} · {totalMeters} Meter{totalMeters !== 1 ? "s" : ""}
              </span>
            </div>

            <Button
              onClick={() => {
                setSheetOpen(false);
                setCheckoutOpen(true);
              }}
              disabled={!canOrder || hasInvalidItem}
              className="w-full gap-2 h-10 font-semibold"
            >
              <Send className="h-3.5 w-3.5" />
              Request Samples ({count})
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <SampleCartCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        sellerEntity={sellerEntity}
        items={items}
        onClearCart={clearCart}
      />
    </>
  );
}
