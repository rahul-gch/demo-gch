import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listShowroomProducts,
  upsertShowroomProduct,
  deleteShowroomProduct,
  createSampleOrder,
  listSampleOrders,
  updateSampleOrderStatus,
  type ShowroomProduct,
  type SampleOrderStatus,
} from "@/lib/showroom.functions";
import { toast } from "sonner";

export function useShowroomProducts(
  orgId: string | null | undefined,
  viewingOrgId?: string | null,
) {
  return useQuery({
    queryKey: ["showroom-products", orgId, viewingOrgId],
    queryFn: async () => {
      if (!orgId) return { products: [], isConnected: false, isOwner: false, canManage: false };
      return listShowroomProducts({ data: { orgId, viewingOrgId } });
    },
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });
}

export function useUpsertShowroomProduct(orgId: string | null | undefined) {
  const qc = useQueryClient();
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
      return upsertShowroomProduct({
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
  return useMutation({
    mutationFn: async (productId: string) => {
      if (!orgId) throw new Error("No organization selected.");
      return deleteShowroomProduct({
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
  return useQuery({
    queryKey: ["sample-orders", orgId],
    queryFn: async () => {
      if (!orgId) return { inbound: [], outbound: [], pendingCount: 0 };
      return listSampleOrders({ data: { orgId } });
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
      return createSampleOrder({
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
  return useMutation({
    mutationFn: async (vars: { orderId: string; status: SampleOrderStatus; message?: string }) => {
      if (!orgId) throw new Error("No active organization.");
      return updateSampleOrderStatus({
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
