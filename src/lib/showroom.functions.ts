import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveImages } from "@/lib/org-images";
import { getEntity } from "@/seed/all-entities";

export interface ShowroomProduct {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  images: string[];
  materials: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SampleOrderStatus =
  | "requested"
  | "accepted"
  | "declined"
  | "completed"
  | "withdrawn"
  | "cancelled"
  | "shipped"
  | "delivered";

export interface SampleOrder {
  id: string;
  productId: string | null;
  product?: {
    id: string;
    name: string;
    images: string[];
    materials: string[];
  } | null;
  sellerOrgId: string;
  sellerOrg?: {
    id: string;
    name: string;
    country: string | null;
    logoUrl: string | null;
  } | null;
  buyerOrgId: string;
  buyerOrg?: {
    id: string;
    name: string;
    country: string | null;
    logoUrl: string | null;
  } | null;
  requestedBy: string;
  quantity: number;
  material: string | null;
  notes: string | null;
  shippingAddress: string;
  neededBy: string | null;
  status: SampleOrderStatus;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShowroomSummary {
  products: ShowroomProduct[];
  isConnected: boolean;
  isOwner: boolean;
  canManage: boolean;
}

/**
 * Resolves an entity route ID (which might be a legacy slug like 'gch-nike')
 * to its Supabase database UUID, or returns the UUID directly.
 */
function resolveOrgUuid(idOrSlug: string): string | null {
  if (!idOrSlug) return null;
  // If it's already a UUID format
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)) {
    return idOrSlug;
  }
  const entity = getEntity(idOrSlug);
  return entity?.orgUuid ?? null;
}

export const listShowroomProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        orgId: z.string().min(1),
        viewingOrgId: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<ShowroomSummary> => {
    const { supabase, userId } = context;
    const targetUuid = resolveOrgUuid(data.orgId);

    if (!targetUuid) {
      return {
        products: [],
        isConnected: false,
        isOwner: false,
        canManage: false,
      };
    }

    // Check ownership / edit permission
    const [{ data: isMember }, { data: canEdit }] = await Promise.all([
      supabase.rpc("is_org_member", { _user: userId, _org: targetUuid }),
      supabase.rpc("user_can_edit", { _user: userId, _org: targetUuid }),
    ]);

    const isOwner = Boolean(isMember);
    const canManage = Boolean(canEdit);

    let isConnected = isOwner;
    if (!isConnected && data.viewingOrgId) {
      const { data: conn } = await supabase.rpc("orgs_are_connected", {
        _org_a: data.viewingOrgId,
        _org_b: targetUuid,
      });
      isConnected = Boolean(conn);
    }

    // Query products
    let query = supabase
      .from("showroom_products")
      .select("id, org_id, name, description, images, materials, is_active, created_at, updated_at")
      .eq("org_id", targetUuid);

    // Non-owners only see active products
    if (!isOwner) {
      query = query.eq("is_active", true);
    }

    const { data: rows, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.warn("[Showroom] listShowroomProducts error:", error.message);
      return { products: [], isConnected, isOwner, canManage };
    }

    const products: ShowroomProduct[] = await Promise.all(
      (rows ?? []).map(async (r) => {
        const rawImages = Array.isArray(r.images) ? (r.images as string[]) : [];
        const resolved = await resolveImages(rawImages);
        return {
          id: r.id,
          orgId: r.org_id,
          name: r.name,
          description: r.description,
          images: resolved.length > 0 ? resolved : rawImages,
          materials: Array.isArray(r.materials) ? (r.materials as string[]) : [],
          isActive: r.is_active,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      }),
    );

    return {
      products,
      isConnected,
      isOwner,
      canManage,
    };
  });

export const upsertShowroomProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        orgId: z.string().uuid(),
        product: z.object({
          id: z.string().uuid().optional(),
          name: z.string().trim().min(1).max(200),
          description: z.string().trim().max(3000).nullable().optional(),
          images: z.array(z.string()).default([]),
          materials: z.array(z.string()).default([]),
          isActive: z.boolean().default(true),
        }),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<ShowroomProduct> => {
    const { supabase, userId } = context;

    const { data: canEdit } = await supabase.rpc("user_can_edit", {
      _user: userId,
      _org: data.orgId,
    });
    if (!canEdit) {
      throw new Error("You do not have permission to manage products for this organization.");
    }

    const payload = {
      org_id: data.orgId,
      name: data.product.name,
      description: data.product.description ?? null,
      images: data.product.images ?? [],
      materials: data.product.materials ?? [],
      is_active: data.product.isActive ?? true,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (data.product.id) {
      const { data: updated, error } = await supabase
        .from("showroom_products")
        .update(payload)
        .eq("id", data.product.id)
        .eq("org_id", data.orgId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      result = updated;
    } else {
      const { data: inserted, error } = await supabase
        .from("showroom_products")
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw new Error(error.message);
      result = inserted;
    }

    const rawImages = Array.isArray(result.images) ? (result.images as string[]) : [];
    const resolved = await resolveImages(rawImages);

    return {
      id: result.id,
      orgId: result.org_id,
      name: result.name,
      description: result.description,
      images: resolved.length > 0 ? resolved : rawImages,
      materials: Array.isArray(result.materials) ? (result.materials as string[]) : [],
      isActive: result.is_active,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  });

export const deleteShowroomProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        orgId: z.string().uuid(),
        productId: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: canEdit } = await supabase.rpc("user_can_edit", {
      _user: userId,
      _org: data.orgId,
    });
    if (!canEdit) {
      throw new Error("You do not have permission to delete products for this organization.");
    }

    const { error } = await supabase
      .from("showroom_products")
      .delete()
      .eq("id", data.productId)
      .eq("org_id", data.orgId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createSampleOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        buyerOrgId: z.string().uuid(),
        sellerOrgId: z.string().uuid(),
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(10000).default(1),
        material: z.string().trim().nullable().optional(),
        notes: z.string().trim().max(2000).nullable().optional(),
        shippingAddress: z.string().trim().min(3).max(1000),
        neededBy: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify buyer org membership
    const { data: isMember } = await supabase.rpc("is_org_member", {
      _user: userId,
      _org: data.buyerOrgId,
    });
    if (!isMember) {
      throw new Error("You must be an active member of your organization to place a sample order.");
    }

    // Verify connection
    const { data: isConnected } = await supabase.rpc("orgs_are_connected", {
      _org_a: data.buyerOrgId,
      _org_b: data.sellerOrgId,
    });
    if (!isConnected) {
      throw new Error(
        "You must be a connected partner (sharing a conversation or project) to request samples.",
      );
    }

    // Fetch product details
    const { data: product } = await supabase
      .from("showroom_products")
      .select("id, name, images, materials")
      .eq("id", data.productId)
      .single();

    // Auto-create or reuse conversation
    const { data: conversationId, error: convErr } = await supabase.rpc(
      "get_or_create_conversation",
      { _org_a: data.buyerOrgId, _org_b: data.sellerOrgId },
    );
    if (convErr) throw new Error(convErr.message);

    // Create the sample order
    const { data: order, error: orderErr } = await supabase
      .from("sample_orders")
      .insert({
        product_id: data.productId,
        seller_org_id: data.sellerOrgId,
        buyer_org_id: data.buyerOrgId,
        requested_by: userId,
        quantity: data.quantity,
        material: data.material ?? null,
        notes: data.notes ?? null,
        shipping_address: data.shippingAddress,
        needed_by: data.neededBy ?? null,
        status: "requested",
        conversation_id: conversationId as string,
      })
      .select()
      .single();

    if (orderErr) throw new Error(orderErr.message);

    // Send summary message into conversation
    const { data: member } = await supabase
      .from("org_members")
      .select("display_name, title, role")
      .eq("org_id", data.buyerOrgId)
      .eq("user_id", userId)
      .maybeSingle();

    const productName = product?.name ?? "Showroom Product";
    const materialSnippet = data.material ? ` · Material: ${data.material}` : "";
    const neededSnippet = data.neededBy ? ` · Needed by: ${data.neededBy}` : "";
    const notesSnippet = data.notes ? `\n\nNotes: "${data.notes}"` : "";

    const messageBody = `📦 Sample Order Request: ${productName} (Qty: ${data.quantity}${materialSnippet}${neededSnippet})\nShipping Address:\n${data.shippingAddress}${notesSnippet}`;

    const { data: msgRow } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId as string,
        sender_org_id: data.buyerOrgId,
        sender_user_id: userId,
        author_name: member?.display_name ?? "Buyer",
        author_role: member?.title ?? member?.role ?? "Member",
        body: messageBody,
      })
      .select("created_at")
      .single();

    if (msgRow) {
      await supabase
        .from("conversations")
        .update({ last_message_at: msgRow.created_at })
        .eq("id", conversationId as string);
      await supabase
        .from("conversation_participants")
        .update({ last_read_at: msgRow.created_at })
        .eq("conversation_id", conversationId as string)
        .eq("org_id", data.buyerOrgId);
    }

    return { orderId: order.id, conversationId: conversationId as string };
  });

export const listSampleOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ inbound: SampleOrder[]; outbound: SampleOrder[]; pendingCount: number }> => {
      const { supabase, userId } = context;

      const { data: isMember } = await supabase.rpc("is_org_member", {
        _user: userId,
        _org: data.orgId,
      });
      if (!isMember) {
        return { inbound: [], outbound: [], pendingCount: 0 };
      }

      const { data: orders, error } = await supabase
        .from("sample_orders")
        .select(
          `
          id, product_id, seller_org_id, buyer_org_id, requested_by, quantity, material,
          notes, shipping_address, needed_by, status, conversation_id, created_at, updated_at,
          product:showroom_products(id, name, images, materials),
          seller:orgs!sample_orders_seller_org_id_fkey(id, name, country, logo_url),
          buyer:orgs!sample_orders_buyer_org_id_fkey(id, name, country, logo_url)
        `,
        )
        .or(`seller_org_id.eq.${data.orgId},buyer_org_id.eq.${data.orgId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Showroom] listSampleOrders error:", error.message);
        return { inbound: [], outbound: [], pendingCount: 0 };
      }

      const inbound: SampleOrder[] = [];
      const outbound: SampleOrder[] = [];
      let pendingCount = 0;

      for (const row of orders ?? []) {
        const item: SampleOrder = {
          id: row.id,
          productId: row.product_id,
          product: row.product
            ? {
                id: (row.product as { id: string }).id,
                name: (row.product as { name: string }).name,
                images: Array.isArray((row.product as { images: unknown }).images)
                  ? ((row.product as { images: string[] }).images as string[])
                  : [],
                materials: Array.isArray((row.product as { materials: unknown }).materials)
                  ? ((row.product as { materials: string[] }).materials as string[])
                  : [],
              }
            : null,
          sellerOrgId: row.seller_org_id,
          sellerOrg: row.seller
            ? {
                id: (row.seller as { id: string }).id,
                name: (row.seller as { name: string }).name,
                country: (row.seller as { country: string | null }).country,
                logoUrl: (row.seller as { logo_url: string | null }).logo_url,
              }
            : null,
          buyerOrgId: row.buyer_org_id,
          buyerOrg: row.buyer
            ? {
                id: (row.buyer as { id: string }).id,
                name: (row.buyer as { name: string }).name,
                country: (row.buyer as { country: string | null }).country,
                logoUrl: (row.buyer as { logo_url: string | null }).logo_url,
              }
            : null,
          requestedBy: row.requested_by,
          quantity: row.quantity,
          material: row.material,
          notes: row.notes,
          shippingAddress: row.shipping_address,
          neededBy: row.needed_by,
          status: row.status as SampleOrderStatus,
          conversationId: row.conversation_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        if (row.seller_org_id === data.orgId) {
          inbound.push(item);
          if (row.status === "requested") pendingCount += 1;
        } else {
          outbound.push(item);
        }
      }

      return { inbound, outbound, pendingCount };
    },
  );

export const updateSampleOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        orgId: z.string().uuid(),
        status: z.enum([
          "requested",
          "accepted",
          "declined",
          "completed",
          "withdrawn",
          "cancelled",
          "shipped",
          "delivered",
        ]),
        message: z.string().trim().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Fetch order to check permissions
    const { data: order, error: fetchErr } = await supabase
      .from("sample_orders")
      .select("id, seller_org_id, buyer_org_id, status, conversation_id")
      .eq("id", data.orderId)
      .single();

    if (fetchErr || !order) {
      throw new Error("Sample order not found.");
    }

    const isSeller = order.seller_org_id === data.orgId;
    const isBuyer = order.buyer_org_id === data.orgId;

    if (!isSeller && !isBuyer) {
      throw new Error("You do not have permission to update this sample order.");
    }

    // Buyer can only cancel/withdraw
    if (isBuyer && !["withdrawn", "cancelled"].includes(data.status)) {
      throw new Error("Buyers can only withdraw pending sample orders.");
    }

    const { error: updateErr } = await supabase
      .from("sample_orders")
      .update({
        status: data.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.orderId);

    if (updateErr) throw new Error(updateErr.message);

    // Optional follow-up message in conversation
    if (order.conversation_id) {
      const { data: member } = await supabase
        .from("org_members")
        .select("display_name, title, role")
        .eq("org_id", data.orgId)
        .eq("user_id", userId)
        .maybeSingle();

      const statusLabels: Record<string, string> = {
        accepted: "✅ Sample order accepted.",
        declined: "❌ Sample order declined.",
        completed: "📦 Sample order marked completed.",
        shipped: "🚚 Sample order shipped.",
        delivered: "📬 Sample order delivered.",
        withdrawn: "🚫 Sample order request was withdrawn by the buyer.",
        cancelled: "🚫 Sample order request cancelled.",
      };

      const statusText =
        statusLabels[data.status] ?? `Sample order status updated to ${data.status}.`;
      const extra = data.message ? `\nNote: ${data.message}` : "";

      await supabase.from("messages").insert({
        conversation_id: order.conversation_id,
        sender_org_id: data.orgId,
        sender_user_id: userId,
        author_name: member?.display_name ?? (isSeller ? "Seller" : "Buyer"),
        author_role: member?.title ?? member?.role ?? "Member",
        body: `${statusText}${extra}`,
      });
    }

    return { ok: true, status: data.status };
  });
