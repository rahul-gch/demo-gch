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
  updateSampleOrderStatus,
  type ShowroomProduct,
  type SampleOrderStatus,
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
      const empty = { products: [], isConnected: false, isOwner: false, canManage: false };
      if (!orgId || !(await hasSession())) return empty;
      return listProducts({ data: { orgId, viewingOrgId } });
    },
    enabled: Boolean(orgId),
    staleTime: 30_000,
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

export function useCreateSampleOrder(buyerOrgId: string | null | undefined) {
  const qc = useQueryClient();
  const createOrder = useServerFn(createSampleOrder);

  return useMutation({
    mutationFn: async (vars: {
      sellerOrgId: string;
      productId: string;
      quantity: number;
      material?: string | null;
      notes?: string | null;
      shippingAddress: string;
      neededBy?: string | null;
    }) => {
      if (!buyerOrgId) throw new Error("Please select your organization first.");
      return createOrder({
        data: {
          buyerOrgId,
          sellerOrgId: vars.sellerOrgId,
          productId: vars.productId,
          quantity: vars.quantity,
          material: vars.material,
          notes: vars.notes,
          shippingAddress: vars.shippingAddress,
          neededBy: vars.neededBy,
        },
      });
    },
    onSuccess: () => {
      toast.success("Sample order requested! Conversation started in Messages.");
      qc.invalidateQueries({ queryKey: ["sample-orders"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not request sample");
    },
  });
}

export function useUpdateSampleOrderStatus(orgId: string | null | undefined) {
  const qc = useQueryClient();
  const updateOrder = useServerFn(updateSampleOrderStatus);

  return useMutation({
    mutationFn: async (vars: { orderId: string; status: SampleOrderStatus; message?: string }) => {
      if (!orgId) throw new Error("No active organization.");
      return updateOrder({
        data: {
          orderId: vars.orderId,
          orgId,
          status: vars.status,
          message: vars.message,
        },
      });
    },
    onSuccess: (_, vars) => {
      toast.success(`Sample order marked as ${vars.status}`);
      qc.invalidateQueries({ queryKey: ["sample-orders"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update order status");
    },
  });
}
