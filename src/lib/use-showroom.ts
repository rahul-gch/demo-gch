import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listShowroomProducts,
  getShowroomProduct,
  setShowroomProductActive,
  upsertShowroomProduct,
  deleteShowroomProduct,
  createSampleOrder,
  listSampleOrders,
  getSampleOrder,
  transitionSampleOrder,
  type SampleOrderAction,
} from "@/lib/showroom.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

async function hasSession() {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

export function useShowroomProducts(
  orgId: string | null | undefined,
  viewingOrgId?: string | null,
) {
  const listProducts = useServerFn(listShowroomProducts);

  return useQuery({
    queryKey: ["showroom-products", orgId, viewingOrgId],
    queryFn: async () => {
      const empty: ShowroomSummary = { products: [], isConnected: false, isOwner: false, canManage: false };
      if (!orgId || !(await hasSession())) return empty;
      return listProducts({ data: { orgId, viewingOrgId } });
    },
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });
}

export function useShowroomProduct(
  orgId: string | null | undefined,
  productId: string | null | undefined,
  viewingOrgId?: string | null,
) {
  const fetchProduct = useServerFn(getShowroomProduct);

  return useQuery({
    queryKey: ["showroom-product", orgId, productId, viewingOrgId],
    queryFn: async () => {
      if (!orgId || !productId) throw new Error("Product not found.");
      if (!(await hasSession())) throw new Error("Please sign in to view this product.");
      return fetchProduct({ data: { orgId, productId, viewingOrgId } });
    },
    enabled: Boolean(orgId && productId),
    retry: false,
    staleTime: 15_000,
  });
}

export function useSetShowroomProductActive(orgId: string | null | undefined) {
  const qc = useQueryClient();
  const setActive = useServerFn(setShowroomProductActive);

  return useMutation({
    mutationFn: async (vars: { productId: string; isActive: boolean }) => {
      if (!orgId) throw new Error("No organization selected.");
      return setActive({ data: { orgId, productId: vars.productId, isActive: vars.isActive } });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? "Product published" : "Product hidden from partners");
      qc.invalidateQueries({ queryKey: ["showroom-products"] });
      qc.invalidateQueries({ queryKey: ["showroom-product"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update visibility");
    },
  });
}

export function useUpsertShowroomProduct(orgId: string | null | undefined) {
  const qc = useQueryClient();
  const saveProduct = useServerFn(upsertShowroomProduct);

  return useMutation({
    mutationFn: async (product: {
      id?: string;
      name: string;
      description?: string | null;
      images?: string[];
      materials?: string[];
      isActive?: boolean;
    }) => {
      if (!orgId) throw new Error("No organization selected.");
      return saveProduct({
        data: {
          orgId,
          product: {
            id: product.id,
            name: product.name,
            description: product.description ?? undefined,
            images: product.images ?? [],
            materials: product.materials ?? [],
            isActive: product.isActive ?? true,
          },
        },
      });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.id ? "Product updated" : "Product added to showroom");
      qc.invalidateQueries({ queryKey: ["showroom-products"] });
      qc.invalidateQueries({ queryKey: ["showroom-product"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    },
  });
}

export function useDeleteShowroomProduct(orgId: string | null | undefined) {
  const qc = useQueryClient();
  const removeProduct = useServerFn(deleteShowroomProduct);

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!orgId) throw new Error("No organization selected.");
      return removeProduct({
        data: { orgId, productId },
      });
    },
    onSuccess: () => {
      toast.success("Product removed from showroom");
      qc.invalidateQueries({ queryKey: ["showroom-products"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete product");
    },
  });
}

export function useSampleOrders(orgId: string | null | undefined) {
  const listOrders = useServerFn(listSampleOrders);

  return useQuery({
    queryKey: ["sample-orders", orgId],
    queryFn: async () => {
      if (!orgId || !(await hasSession())) return { inbound: [], outbound: [], pendingCount: 0 };
      return listOrders({ data: { orgId } });
    },
    enabled: Boolean(orgId),
    staleTime: 15_000,
  });
}

export function usePendingSampleOrderCount(orgId: string | null | undefined): number {
  const { data } = useSampleOrders(orgId);
  return data?.pendingCount ?? 0;
}

export function useSampleOrder(orderId: string | null | undefined, orgId: string | null | undefined) {
  const fetchOrder = useServerFn(getSampleOrder);

  return useQuery({
    queryKey: ["sample-order", orderId, orgId],
    queryFn: async () => {
      if (!orderId || !orgId) throw new Error("Order not found.");
      if (!(await hasSession())) throw new Error("Please sign in to view this order.");
      return fetchOrder({ data: { orderId, orgId } });
    },
    enabled: Boolean(orderId && orgId),
    retry: false,
    staleTime: 10_000,
  });
}

export interface CreateSampleOrderInput {
  buyerOrgId: string;
  sellerOrgId: string;
  productId: string;
  quantity: number;
  material?: string | null;
  notes?: string | null;
  shippingAddress: string;
  neededBy?: string | null;
}

export function useCreateSampleOrder() {
  const qc = useQueryClient();
  const createOrder = useServerFn(createSampleOrder);

  return useMutation({
    mutationFn: async (vars: CreateSampleOrderInput) => {
      if (!vars.buyerOrgId) throw new Error("Please select the organization you are ordering as.");
      return createOrder({ data: vars });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sample-orders"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not place the sample order");
    },
  });
}

const ACTION_LABEL: Record<SampleOrderAction, string> = {
  quote: "Quote sent to the buyer",
  unquote: "Quote withdrawn — you can send a revised quote",
  decline: "Order declined",
  confirm: "Quote confirmed",
  withdraw: "Request withdrawn",
  ship: "Order marked as shipped",
  deliver: "Order marked as delivered",
};

export function useTransitionSampleOrder(orgId: string | null | undefined) {
  const qc = useQueryClient();
  const transition = useServerFn(transitionSampleOrder);

  return useMutation({
    mutationFn: async (vars: {
      orderId: string;
      action: SampleOrderAction;
      note?: string;
      quote?: {
        price: number;
        currency: string;
        shippingCost?: number | null;
        leadTimeDays?: number | null;
      };
      trackingRef?: string;
    }) => {
      if (!orgId) throw new Error("No active organization.");
      return transition({ data: { orgId, ...vars } });
    },
    onSuccess: (_, vars) => {
      toast.success(ACTION_LABEL[vars.action]);
      qc.invalidateQueries({ queryKey: ["sample-orders"] });
      qc.invalidateQueries({ queryKey: ["sample-order"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update the order");
    },
  });
}
