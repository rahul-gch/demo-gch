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

const FALLBACK_PRODUCTS = new Map<string, ShowroomProduct[]>();
const FALLBACK_SAMPLE_ORDERS: SampleOrder[] = [];

function initSeedProducts() {
  if (FALLBACK_PRODUCTS.size > 0) return;

  const defaultSeed = [
    {
      orgKey: "gch-nike",
      products: [
        {
          id: "prod-nike-1",
          orgId: "gch-nike",
          name: "Next-Gen Flyknit Recycled Yarn Knit (300gsm)",
          description:
            "Engineered circular knit made with 100% recycled post-consumer polyester. High tensile strength, zero-waste seam construction, moisture-wicking finish.",
          images: [
            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=60",
            "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=60",
          ],
          materials: ["Recycled Polyester", "Elastane"],
          isActive: true,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: "prod-nike-2",
          orgId: "gch-nike",
          name: "Dri-FIT Organic Cotton & Hemp Fleece",
          description:
            "Heavyweight 380gsm brushed back fleece combining regenerative organic cotton and breathable hemp fibers with low-impact botanical reactive dyes.",
          images: [
            "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=60",
          ],
          materials: ["Organic Cotton", "Hemp"],
          isActive: true,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      ],
    },
    {
      orgKey: "gch-hm",
      products: [
        {
          id: "prod-hm-1",
          orgId: "gch-hm",
          name: "Circulose® Recycled Cotton Denim Twill 12oz",
          description:
            "Rigid twill denim woven with 50% Circulose pulp made from worn-out cotton textiles and 50% GOTS organic cotton. Cradle-to-Cradle Gold certified.",
          images: [
            "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=800&auto=format&fit=crop&q=60",
          ],
          materials: ["Circulose", "Organic Cotton"],
          isActive: true,
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
      ],
    },
    {
      orgKey: "gch-textilegenesis",
      products: [
        {
          id: "prod-tg-1",
          orgId: "gch-textilegenesis",
          name: "Fibercoin™ Digital Traceability Swatch Pack",
          description:
            "Physical fiber token sample kit with embedded QR and NFC forensic markers for chain-of-custody verification from farm to retail store.",
          images: [
            "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=60",
          ],
          materials: ["Traceable Fiber", "NFC Tag"],
          isActive: true,
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
      ],
    },
  ];

  for (const item of defaultSeed) {
    FALLBACK_PRODUCTS.set(item.orgKey, item.products);
  }

  // No seeded sample orders: real requests are persisted in the sample_orders table.

}

initSeedProducts();

function resolveOrgUuid(idOrSlug: string): string | null {
  if (!idOrSlug) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)) {
    return idOrSlug;
  }
  const entity = getEntity(idOrSlug);
  return entity?.orgUuid ?? idOrSlug;
}

export const listShowroomProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().min(1),
        viewingOrgId: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<ShowroomSummary> => {
    initSeedProducts();
    const { supabase, userId } = context;
    const rawOrgId = data.orgId;
    const targetUuid = resolveOrgUuid(rawOrgId) ?? rawOrgId;

    let isOwner = false;
    let canManage = false;
    let isConnected = true;

    try {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUuid)) {
        const [{ data: isMember }, { data: canEdit }] = await Promise.all([
          supabase.rpc("is_org_member", { _user: userId, _org: targetUuid }),
          supabase.rpc("user_can_edit", { _user: userId, _org: targetUuid }),
        ]);
        isOwner = Boolean(isMember);
        canManage = Boolean(canEdit);

        if (!isOwner && data.viewingOrgId) {
          const { data: conn } = await supabase.rpc("orgs_are_connected", {
            _org_a: data.viewingOrgId,
            _org_b: targetUuid,
          });
          isConnected = conn !== null ? Boolean(conn) : true;
        }
      } else {
        isOwner = true;
        canManage = true;
        isConnected = true;
      }
    } catch {
      isOwner = true;
      canManage = true;
      isConnected = true;
    }

    try {
      let query = supabase
        .from("showroom_products")
        .select("id, org_id, name, description, images, materials, is_active, created_at, updated_at")
        .eq("org_id", targetUuid);

      if (!isOwner) {
        query = query.eq("is_active", true);
      }

      const { data: rows, error } = await query.order("created_at", { ascending: false });

      if (!error && rows) {
        const products: ShowroomProduct[] = await Promise.all(
          rows.map(async (r: any) => {
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
        return { products, isConnected, isOwner, canManage };
      }
    } catch {
      // Fallback
    }

    // Only fall back to demo catalogues for the seeded (non-UUID) showcase orgs.
    // A real organisation with an empty showroom must render as empty.
    const fallbackList = FALLBACK_PRODUCTS.get(targetUuid) ?? FALLBACK_PRODUCTS.get(rawOrgId) ?? [];


    const filtered = isOwner ? fallbackList : fallbackList.filter((p) => p.isActive);

    return {
      products: filtered,
      isConnected,
      isOwner,
      canManage,
    };
  });

export interface ShowroomProductDetail {
  product: ShowroomProduct;
  org: { id: string; name: string; country: string | null; logoUrl: string | null } | null;
  isOwner: boolean;
  canManage: boolean;
  isConnected: boolean;
}

export const getShowroomProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().min(1),
        productId: z.string().min(1),
        viewingOrgId: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<ShowroomProductDetail> => {
    initSeedProducts();
    const { supabase, userId } = context;
    const targetUuid = resolveOrgUuid(data.orgId) ?? data.orgId;
    const isUuid = (v: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

    let isOwner = false;
    let canManage = false;
    let isConnected = true;

    if (isUuid(targetUuid)) {
      const [{ data: isMember }, { data: canEdit }] = await Promise.all([
        supabase.rpc("is_org_member", { _user: userId, _org: targetUuid }),
        supabase.rpc("user_can_edit", { _user: userId, _org: targetUuid }),
      ]);
      isOwner = Boolean(isMember);
      canManage = Boolean(canEdit);

      if (!isOwner && data.viewingOrgId && isUuid(data.viewingOrgId)) {
        const { data: conn } = await supabase.rpc("orgs_are_connected", {
          _org_a: data.viewingOrgId,
          _org_b: targetUuid,
        });
        isConnected = Boolean(conn);
      } else if (!isOwner) {
        isConnected = false;
      }
    } else {
      isOwner = true;
      canManage = true;
    }

    let product: ShowroomProduct | null = null;

    if (isUuid(data.productId)) {
      const { data: row, error } = await supabase
        .from("showroom_products")
        .select("id, org_id, name, description, images, materials, is_active, created_at, updated_at")
        .eq("id", data.productId)
        .eq("org_id", targetUuid)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (row) {
        const rawImages = Array.isArray(row.images) ? (row.images as string[]) : [];
        const resolved = await resolveImages(rawImages);
        product = {
          id: row.id,
          orgId: row.org_id,
          name: row.name,
          description: row.description,
          images: resolved.length > 0 ? resolved : rawImages,
          materials: Array.isArray(row.materials) ? (row.materials as string[]) : [],
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } else {
      const list = FALLBACK_PRODUCTS.get(targetUuid) ?? FALLBACK_PRODUCTS.get(data.orgId) ?? [];
      product = list.find((p) => p.id === data.productId) ?? null;
    }

    if (!product) throw new Error("Product not found.");
    if (!product.isActive && !isOwner) throw new Error("This product is not published.");

    let org: ShowroomProductDetail["org"] = null;
    if (isUuid(targetUuid)) {
      const { data: orgRow } = await supabase
        .from("orgs")
        .select("id, name, country, logo_url")
        .eq("id", targetUuid)
        .maybeSingle();
      if (orgRow) {
        org = {
          id: orgRow.id,
          name: orgRow.name,
          country: orgRow.country ?? null,
          logoUrl: orgRow.logo_url ?? null,
        };
      }
    }

    return { product, org, isOwner, canManage, isConnected };
  });

export const setShowroomProductActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().min(1),
        productId: z.string().min(1),
        isActive: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    initSeedProducts();
    const { supabase } = context;
    const targetUuid = resolveOrgUuid(data.orgId) ?? data.orgId;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      data.productId,
    );

    if (isUuid) {
      const { error } = await supabase
        .from("showroom_products")
        .update({ is_active: data.isActive, updated_at: new Date().toISOString() })
        .eq("id", data.productId)
        .eq("org_id", targetUuid);
      if (error) throw new Error(error.message);
      return { ok: true, isActive: data.isActive };
    }

    const list = FALLBACK_PRODUCTS.get(targetUuid) ?? [];
    const found = list.find((p) => p.id === data.productId);
    if (found) {
      found.isActive = data.isActive;
      found.updatedAt = new Date().toISOString();
    }
    return { ok: true, isActive: data.isActive };
  });

export const upsertShowroomProduct = createServerFn({ method: "POST" })

  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().min(1),
        product: z.object({
          id: z.string().optional(),
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
    initSeedProducts();
    const { supabase, userId } = context;
    const targetUuid = resolveOrgUuid(data.orgId) ?? data.orgId;

    const payload = {
      org_id: targetUuid,
      name: data.product.name,
      description: data.product.description ?? null,
      images: data.product.images ?? [],
      materials: data.product.materials ?? [],
      is_active: data.product.isActive ?? true,
      updated_at: new Date().toISOString(),
    };

    try {
      let result;
      if (data.product.id && !data.product.id.startsWith("prod-")) {
        const { data: updated, error } = await supabase
          .from("showroom_products")
          .update(payload)
          .eq("id", data.product.id)
          .select()
          .single();
        if (!error && updated) result = updated;
      } else {
        const { data: inserted, error } = await supabase
          .from("showroom_products")
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (!error && inserted) result = inserted;
      }

      if (result) {
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
      }
    } catch {
      // Proceed to fallback
    }

    const existingList = FALLBACK_PRODUCTS.get(targetUuid) ?? FALLBACK_PRODUCTS.get(data.orgId) ?? [];
    let savedProduct: ShowroomProduct;

    if (data.product.id) {
      const idx = existingList.findIndex((p) => p.id === data.product.id);
      savedProduct = {
        id: data.product.id,
        orgId: targetUuid,
        name: data.product.name,
        description: data.product.description ?? null,
        images: data.product.images ?? [],
        materials: data.product.materials ?? [],
        isActive: data.product.isActive ?? true,
        createdAt: idx >= 0 ? existingList[idx].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (idx >= 0) {
        existingList[idx] = savedProduct;
      } else {
        existingList.unshift(savedProduct);
      }
    } else {
      savedProduct = {
        id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        orgId: targetUuid,
        name: data.product.name,
        description: data.product.description ?? null,
        images: data.product.images ?? [],
        materials: data.product.materials ?? [],
        isActive: data.product.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      existingList.unshift(savedProduct);
    }

    FALLBACK_PRODUCTS.set(targetUuid, existingList);
    FALLBACK_PRODUCTS.set(data.orgId, existingList);

    return savedProduct;
  });

export const deleteShowroomProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().min(1),
        productId: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    initSeedProducts();
    const { supabase } = context;
    const targetUuid = resolveOrgUuid(data.orgId) ?? data.orgId;

    try {
      await supabase
        .from("showroom_products")
        .delete()
        .eq("id", data.productId)
        .eq("org_id", targetUuid);
    } catch {
      // ignore
    }

    const listA = FALLBACK_PRODUCTS.get(targetUuid) ?? [];
    FALLBACK_PRODUCTS.set(
      targetUuid,
      listA.filter((p) => p.id !== data.productId),
    );

    const listB = FALLBACK_PRODUCTS.get(data.orgId) ?? [];
    FALLBACK_PRODUCTS.set(
      data.orgId,
      listB.filter((p) => p.id !== data.productId),
    );

    return { ok: true };
  });

export const createSampleOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        buyerOrgId: z.string().min(1),
        sellerOrgId: z.string().min(1),
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(10000).default(1),
        material: z.string().trim().nullable().optional(),
        notes: z.string().trim().max(2000).nullable().optional(),
        shippingAddress: z.string().trim().min(3).max(1000),
        neededBy: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    initSeedProducts();
    const { supabase, userId } = context;

    const buyerEntity = getEntity(data.buyerOrgId);
    const sellerEntity = getEntity(data.sellerOrgId);

    const isUuid = (v: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

    let productName = "Showroom Product";
    let productImages: string[] = [];
    let productMaterials: string[] = [];

    if (isUuid(data.productId)) {
      try {
        const { data: prod } = await supabase
          .from("showroom_products")
          .select("name, images, materials")
          .eq("id", data.productId)
          .maybeSingle();
        if (prod) {
          productName = prod.name;
          productImages = Array.isArray(prod.images) ? (prod.images as string[]) : [];
          productMaterials = Array.isArray(prod.materials) ? (prod.materials as string[]) : [];
        }
      } catch {
        // ignore
      }
    } else {
      const sellerProducts = FALLBACK_PRODUCTS.get(data.sellerOrgId) ?? [];
      const foundProduct = sellerProducts.find((p) => p.id === data.productId);
      if (foundProduct) {
        productName = foundProduct.name;
        productImages = foundProduct.images;
        productMaterials = foundProduct.materials;
      }
    }


    let conversationId: string | null = null;
    try {
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.buyerOrgId) &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.sellerOrgId)
      ) {
        const { data: convId } = await supabase.rpc("get_or_create_conversation", {
          _org_a: data.buyerOrgId,
          _org_b: data.sellerOrgId,
        });
        conversationId = convId as string;
      }
    } catch {
      // ignore
    }

    const newOrder: SampleOrder = {
      id: `sample-order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: data.productId,
      product: {
        id: data.productId,
        name: productName,
        images: productImages,
        materials: productMaterials,
      },
      sellerOrgId: data.sellerOrgId,
      sellerOrg: {
        id: data.sellerOrgId,
        name: sellerEntity?.name ?? "Supplier",
        country: sellerEntity?.country ?? null,
        logoUrl: sellerEntity?.logoUrl ?? null,
      },
      buyerOrgId: data.buyerOrgId,
      buyerOrg: {
        id: data.buyerOrgId,
        name: buyerEntity?.name ?? "Partner Organization",
        country: buyerEntity?.country ?? null,
        logoUrl: buyerEntity?.logoUrl ?? null,
      },
      requestedBy: userId ?? "user-1",
      quantity: data.quantity,
      material: data.material ?? null,
      notes: data.notes ?? null,
      shippingAddress: data.shippingAddress,
      neededBy: data.neededBy ?? null,
      status: "requested",
      conversationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Persist real orders (UUID orgs) to the database.
    let persisted = false;
    if (isUuid(data.buyerOrgId) && isUuid(data.sellerOrgId)) {
      const { data: inserted, error } = await supabase
        .from("sample_orders")
        .insert({
          product_id: isUuid(data.productId) ? data.productId : null,
          seller_org_id: data.sellerOrgId,
          buyer_org_id: data.buyerOrgId,
          requested_by: userId,
          quantity: data.quantity,
          material: data.material ?? null,
          notes: data.notes ?? null,
          shipping_address: data.shippingAddress,
          needed_by: data.neededBy ?? null,
          status: "requested",
          conversation_id: conversationId,
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      if (inserted) {
        newOrder.id = inserted.id;
        persisted = true;
      }
    }

    if (!persisted) {
      FALLBACK_SAMPLE_ORDERS.unshift(newOrder);
    }


    if (conversationId) {
      try {
        const materialSnippet = data.material ? ` · Material: ${data.material}` : "";
        const neededSnippet = data.neededBy ? ` · Needed by: ${data.neededBy}` : "";
        const notesSnippet = data.notes ? `\n\nNotes: "${data.notes}"` : "";

        const messageBody = `📦 Sample Order Request: ${productName} (Qty: ${data.quantity}${materialSnippet}${neededSnippet})\nShipping Address:\n${data.shippingAddress}${notesSnippet}`;

        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_org_id: data.buyerOrgId,
          sender_user_id: userId,
          author_name: buyerEntity?.name ?? "Buyer",
          author_role: "Member",
          body: messageBody,
        });
      } catch {
        // ignore
      }
    }

    return { orderId: newOrder.id, conversationId };
  });

export const listSampleOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orgId: z.string().min(1) }).parse(d))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ inbound: SampleOrder[]; outbound: SampleOrder[]; pendingCount: number }> => {
      initSeedProducts();
      const { supabase } = context;
      const targetUuid = resolveOrgUuid(data.orgId) ?? data.orgId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        targetUuid,
      );

      const inbound: SampleOrder[] = [];
      const outbound: SampleOrder[] = [];
      let pendingCount = 0;

      if (isUuid) {
        const { data: rows, error } = await supabase
          .from("sample_orders")
          .select(
            "id, product_id, seller_org_id, buyer_org_id, requested_by, quantity, material, notes, shipping_address, needed_by, status, conversation_id, created_at, updated_at, product:showroom_products(id, name, images, materials), sellerOrg:orgs!sample_orders_seller_org_id_fkey(id, name, country, logo_url), buyerOrg:orgs!sample_orders_buyer_org_id_fkey(id, name, country, logo_url)",
          )
          .or(`seller_org_id.eq.${targetUuid},buyer_org_id.eq.${targetUuid}`)
          .order("created_at", { ascending: false });

        if (error) throw new Error(error.message);

        for (const r of (rows ?? []) as any[]) {
          const mapOrg = (o: any) =>
            o
              ? { id: o.id, name: o.name, country: o.country ?? null, logoUrl: o.logo_url ?? null }
              : null;

          const order: SampleOrder = {
            id: r.id,
            productId: r.product_id,
            product: r.product
              ? {
                  id: r.product.id,
                  name: r.product.name,
                  images: Array.isArray(r.product.images) ? r.product.images : [],
                  materials: Array.isArray(r.product.materials) ? r.product.materials : [],
                }
              : null,
            sellerOrgId: r.seller_org_id,
            sellerOrg: mapOrg(r.sellerOrg),
            buyerOrgId: r.buyer_org_id,
            buyerOrg: mapOrg(r.buyerOrg),
            requestedBy: r.requested_by ?? "",
            quantity: r.quantity,
            material: r.material,
            notes: r.notes,
            shippingAddress: r.shipping_address,
            neededBy: r.needed_by,
            status: r.status as SampleOrderStatus,
            conversationId: r.conversation_id,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          };

          if (order.sellerOrgId === targetUuid) {
            inbound.push(order);
            if (order.status === "requested") pendingCount += 1;
          } else {
            outbound.push(order);
          }
        }

        for (const order of FALLBACK_SAMPLE_ORDERS) {
          if (inbound.some((o) => o.id === order.id) || outbound.some((o) => o.id === order.id)) continue;
          if (order.sellerOrgId === targetUuid || order.sellerOrgId === data.orgId) {
            inbound.push(order);
            if (order.status === "requested") pendingCount += 1;
          } else if (order.buyerOrgId === targetUuid || order.buyerOrgId === data.orgId) {
            outbound.push(order);
          }
        }

        return { inbound, outbound, pendingCount };
      }

      for (const order of FALLBACK_SAMPLE_ORDERS) {
        if (order.sellerOrgId === targetUuid || order.sellerOrgId === data.orgId) {
          inbound.push(order);
          if (order.status === "requested") pendingCount += 1;
        } else if (order.buyerOrgId === targetUuid || order.buyerOrgId === data.orgId) {
          outbound.push(order);
        }
      }

      return { inbound, outbound, pendingCount };
    },
  );

export const updateSampleOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orderId: z.string().min(1),
        orgId: z.string().min(1),
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
    initSeedProducts();
    const { supabase } = context;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      data.orderId,
    );

    if (isUuid) {
      const { error } = await supabase
        .from("sample_orders")
        .update({ status: data.status, updated_at: new Date().toISOString() })
        .eq("id", data.orderId);
      if (error) throw new Error(error.message);
      return { ok: true, status: data.status };
    }

    const order = FALLBACK_SAMPLE_ORDERS.find((o) => o.id === data.orderId);
    if (order) {
      order.status = data.status;
      order.updatedAt = new Date().toISOString();
    }
    return { ok: true, status: data.status };
  });

