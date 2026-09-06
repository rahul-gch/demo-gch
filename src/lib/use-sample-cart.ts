import { useState, useEffect, useCallback } from "react";
import type { ShowroomProduct } from "@/lib/showroom.functions";
import { toast } from "sonner";

export interface SampleCartItem {
  productId: string;
  productName: string;
  image: string | null;
  availableMaterials: string[];
  selectedMaterial: string;
  hangerQty: number; // 0 or 1
  metersQty: number; // 0..3
}

const STORAGE_PREFIX = "gch_sample_cart_";
const CART_EVENT = "gch-sample-cart-changed";

function getStorageKey(sellerOrgId: string) {
  return `${STORAGE_PREFIX}${sellerOrgId}`;
}

function loadCart(sellerOrgId: string): SampleCartItem[] {
  if (typeof window === "undefined" || !sellerOrgId) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(sellerOrgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(sellerOrgId: string, items: SampleCartItem[]) {
  if (typeof window === "undefined" || !sellerOrgId) return;
  try {
    localStorage.setItem(getStorageKey(sellerOrgId), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { sellerOrgId } }));
  } catch {
    // Storage full or restricted
  }
}

export function useSampleCart(sellerOrgId?: string | null) {
  const orgId = sellerOrgId ?? "";
  const [items, setItems] = useState<SampleCartItem[]>(() => (orgId ? loadCart(orgId) : []));

  useEffect(() => {
    if (!orgId) {
      setItems([]);
      return;
    }
    setItems(loadCart(orgId));

    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent<{ sellerOrgId?: string }>).detail;
      if (!detail || detail.sellerOrgId === orgId) {
        setItems(loadCart(orgId));
      }
    };

    window.addEventListener(CART_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(CART_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [orgId]);

  const addItem = useCallback(
    (
      product: ShowroomProduct,
      options?: {
        hangerQty?: number;
        metersQty?: number;
        material?: string;
      },
    ) => {
      if (!orgId) return;
      const current = loadCart(orgId);
      const existingIdx = current.findIndex((i) => i.productId === product.id);

      const defaultMaterial = options?.material ?? product.materials?.[0] ?? "";
      const hangerQty = options?.hangerQty ?? 1; // Default to 1 hanger
      const metersQty = options?.metersQty ?? 0;

      if (existingIdx >= 0) {
        // Update existing item
        current[existingIdx] = {
          ...current[existingIdx],
          selectedMaterial: options?.material ?? current[existingIdx].selectedMaterial,
          hangerQty: options?.hangerQty ?? current[existingIdx].hangerQty,
          metersQty: options?.metersQty ?? current[existingIdx].metersQty,
        };
        saveCart(orgId, current);
        setItems(current);
        toast.info(`Updated "${product.name}" in sample cart`);
      } else {
        // Add new item
        const newItem: SampleCartItem = {
          productId: product.id,
          productName: product.name,
          image: product.thumbnails?.[0] ?? product.images?.[0] ?? null,
          availableMaterials: product.materials ?? [],
          selectedMaterial: defaultMaterial,
          hangerQty: Math.min(1, Math.max(0, hangerQty)),
          metersQty: Math.min(3, Math.max(0, metersQty)),
        };
        const next = [...current, newItem];
        saveCart(orgId, next);
        setItems(next);
        toast.success(`Added "${product.name}" to sample cart`, {
          description: "1 Hanger included. Adjust quantity or meters in your Sample Cart.",
        });
      }
    },
    [orgId],
  );

  const removeItem = useCallback(
    (productId: string) => {
      if (!orgId) return;
      const current = loadCart(orgId);
      const next = current.filter((i) => i.productId !== productId);
      saveCart(orgId, next);
      setItems(next);
    },
    [orgId],
  );

  const updateItem = useCallback(
    (
      productId: string,
      updates: Partial<Pick<SampleCartItem, "hangerQty" | "metersQty" | "selectedMaterial">>,
    ) => {
      if (!orgId) return;
      const current = loadCart(orgId);
      const next = current.map((i) => {
        if (i.productId !== productId) return i;
        const newHanger = updates.hangerQty !== undefined ? Math.min(1, Math.max(0, updates.hangerQty)) : i.hangerQty;
        const newMeters = updates.metersQty !== undefined ? Math.min(3, Math.max(0, updates.metersQty)) : i.metersQty;
        return {
          ...i,
          hangerQty: newHanger,
          metersQty: newMeters,
          selectedMaterial: updates.selectedMaterial ?? i.selectedMaterial,
        };
      });
      saveCart(orgId, next);
      setItems(next);
    },
    [orgId],
  );

  const clearCart = useCallback(() => {
    if (!orgId) return;
    saveCart(orgId, []);
    setItems([]);
  }, [orgId]);

  const isInCart = useCallback(
    (productId: string) => {
      return items.some((i) => i.productId === productId);
    },
    [items],
  );

  const getItem = useCallback(
    (productId: string) => {
      return items.find((i) => i.productId === productId) ?? null;
    },
    [items],
  );

  return {
    items,
    count: items.length,
    addItem,
    removeItem,
    updateItem,
    clearCart,
    isInCart,
    getItem,
  };
}
