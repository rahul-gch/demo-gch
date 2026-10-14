import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  resolveImagesWith,
  resolveThumbnailsWith,
  getOptimizedThumbnailUrl,
  getOptimizedHighResUrl,
} from "@/lib/org-images";
import { getEntity } from "@/seed/all-entities";
import { assertOrgRole } from "@/lib/rbac.server";
import type { Database } from "@/integrations/supabase/types";

export interface ShowroomProduct {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  /** Display URLs (signed links for uploaded files, or external https links) - high resolution for detail page. */
  images: string[];
  /** Optimized thumbnail URLs for showroom cards and preview grids (prevents moiré distortion). */
  thumbnails?: string[];
  /** Raw stored values (`showroom:<path>` refs or https links) — use these when editing. */
  imageRefs: string[];
  materials: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


type ImageClient = Parameters<typeof resolveImagesWith>[0];

/** Resolve stored image values with the caller's authenticated client. Unresolvable refs are dropped. */
async function resolveProductImages(
  client: ImageClient,
  raw: unknown,
): Promise<{ images: string[]; thumbnails: string[]; imageRefs: string[] }> {
  const allRefs = Array.isArray(raw)
    ? (raw as unknown[]).filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];
  const [resolvedImages, resolvedThumbnails] = await Promise.all([
    resolveImagesWith(client, allRefs),
    resolveThumbnailsWith(client, allRefs, 480),
  ]);

  // Keep all arrays positionally aligned: drop refs that could not be resolved.
  const images: string[] = [];
  const thumbnails: string[] = [];
  const imageRefs: string[] = [];
  resolvedImages.forEach((url, i) => {
    if (url) {
      // Ensure high-resolution display URL for detail view
      const highRes = getOptimizedHighResUrl(url) ?? url;
      const thumb = resolvedThumbnails[i] ?? getOptimizedThumbnailUrl(url, { width: 480 }) ?? url;
      images.push(highRes);
      thumbnails.push(thumb);
      imageRefs.push(allRefs[i]);
    }
  });
  return { images, thumbnails, imageRefs };
}

export type SampleOrderStatus =
  | "requested"
  | "quoted"
  | "confirmed"
  | "declined"
  | "withdrawn"
  | "shipped"
  | "delivered";

export type SampleOrderAction = "quote" | "unquote" | "decline" | "confirm" | "withdraw" | "ship" | "deliver";

export interface SampleOrderParty {
  id: string;
  name: string;
  country: string | null;
  logoUrl: string | null;
}

export interface SampleOrderEvent {
  id: string;
  actorOrgId: string | null;
  actorUserId: string | null;
  fromStatus: SampleOrderStatus | null;
  toStatus: SampleOrderStatus;
  note: string | null;
  createdAt: string;
}

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
  sellerOrg?: SampleOrderParty | null;
  buyerOrgId: string;
  buyerOrg?: SampleOrderParty | null;
  requestedBy: string;
  quantity: number;
  material: string | null;
  notes: string | null;
  shippingAddress: string;
  neededBy: string | null;
  status: SampleOrderStatus;
  conversationId: string | null;
  quotedPrice: number | null;
  quoteCurrency: string;
  shippingCost: number | null;
  leadTimeDays: number | null;
  quoteNote: string | null;
  trackingRef: string | null;
  quotedAt: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShowroomSummary {
  products: ShowroomProduct[];
  isConnected: boolean;
  isOwner: boolean;
  canManage: boolean;
  /** True when the viewer is not connected to this org and may not see its products. */
  locked?: boolean;
}

const FALLBACK_PRODUCTS = new Map<string, ShowroomProduct[]>();

function initSeedProducts() {
  if (FALLBACK_PRODUCTS.size > 0) return;

  const defaultSeed: { orgKey: string; products: Omit<ShowroomProduct, "imageRefs">[] }[] = [
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
            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1400&auto=format&fit=max&q=85",
            "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1400&auto=format&fit=max&q=85",
          ],
          thumbnails: [
            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=480&auto=format&fit=max&q=80",
            "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=480&auto=format&fit=max&q=80",
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
            "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1400&auto=format&fit=max&q=85",
          ],
          thumbnails: [
            "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=480&auto=format&fit=max&q=80",
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
            "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=1400&auto=format&fit=max&q=85",
          ],
          thumbnails: [
            "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=480&auto=format&fit=max&q=80",
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
            "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1400&auto=format&fit=max&q=85",
          ],
          thumbnails: [
            "https://images.unsplash.com/photo-1544816155-12df9643f363?w=480&auto=format&fit=max&q=80",
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
    FALLBACK_PRODUCTS.set(
      item.orgKey,
      item.products.map((p) => {
        const highResImages = p.images.map((img) => getOptimizedHighResUrl(img) ?? img);
        const thumbnails =
          p.thumbnails ?? p.images.map((img) => getOptimizedThumbnailUrl(img, { width: 480 }) ?? img);
        return {
          ...p,
          images: highResImages,
          thumbnails,
          imageRefs: p.images,
        };
      }),
    );
  }

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ShowroomAccess {
  isOwner: boolean;
  canManage: boolean;
  isConnected: boolean;
  isAdmin: boolean;
  /** True when the viewer may not see this showroom at all. */
  locked: boolean;
}

/**
 * Resolve what the current user may see of an org's showroom. Showrooms are
 * visible to members, platform admins and organizations with an accepted
 * connection; everyone else is locked out (fail closed).
 */
async function resolveShowroomAccess(
  supabase: any,
  userId: string,
  targetUuid: string,
  viewingOrgId: string | null | undefined,
): Promise<ShowroomAccess> {
  // Seeded showcase orgs (non-UUID ids) have no real ownership rows.
  if (!UUID_RE.test(targetUuid)) {
    return { isOwner: true, canManage: true, isConnected: true, isAdmin: false, locked: false };
  }
  try {
    const [{ data: isMember }, { data: canEdit }, { data: admin }] = await Promise.all([
      supabase.rpc("is_org_member", { _user: userId, _org: targetUuid }),
      supabase.rpc("user_can_edit", { _user: userId, _org: targetUuid }),
      supabase.rpc("is_platform_admin", { _user: userId }),
    ]);
    const isOwner = Boolean(isMember);
    const isAdmin = Boolean(admin);
    let isConnected = isOwner;
    if (!isOwner && viewingOrgId && UUID_RE.test(viewingOrgId)) {
      const { data: conn } = await supabase.rpc("orgs_are_connected", {
        _org_a: viewingOrgId,
        _org_b: targetUuid,
      });
      isConnected = Boolean(conn);
    }
    return {
      isOwner,
      canManage: Boolean(canEdit),
      isConnected,
      isAdmin,
      locked: !(isOwner || isConnected || isAdmin),
    };
  } catch {
    return { isOwner: false, canManage: false, isConnected: false, isAdmin: false, locked: true };
  }
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

    const access = await resolveShowroomAccess(supabase, userId, targetUuid, data.viewingOrgId);
    const { isOwner, canManage, isConnected } = access;
    if (access.locked) {
      return { products: [], isConnected: false, isOwner: false, canManage: false, locked: true };
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
            const imgs = await resolveProductImages(supabase, r.images);
            return {
              id: r.id,
              orgId: r.org_id,
              name: r.name,
              description: r.description,
              images: imgs.images,
              thumbnails: imgs.thumbnails,
              imageRefs: imgs.imageRefs,
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
  product: ShowroomProduct | null;
  org: { id: string; name: string; country: string | null; logoUrl: string | null } | null;
  isOwner: boolean;
  canManage: boolean;
  isConnected: boolean;
  locked?: boolean;
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
    const isUuid = (v: string) => UUID_RE.test(v);

    const access = await resolveShowroomAccess(supabase, userId, targetUuid, data.viewingOrgId);
    const { isOwner, canManage, isConnected } = access;
    if (access.locked) {
      return {
        product: null,
        org: null,
        isOwner: false,
        canManage: false,
        isConnected: false,
        locked: true,
      };
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
        const imgs = await resolveProductImages(supabase, row.images);
        product = {
          id: row.id,
          orgId: row.org_id,
          name: row.name,
          description: row.description,
          images: imgs.images,
          thumbnails: imgs.thumbnails,
          imageRefs: imgs.imageRefs,
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
    const { supabase, userId } = context;
    const targetUuid = resolveOrgUuid(data.orgId) ?? data.orgId;
    await assertOrgRole(supabase, userId, targetUuid, "editor");

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
    await assertOrgRole(supabase, userId, targetUuid, "editor");

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
        const imgs = await resolveProductImages(supabase, result.images);
        return {
          id: result.id,
          orgId: result.org_id,
          name: result.name,
          description: result.description,
          images: imgs.images,
          thumbnails: imgs.thumbnails,
          imageRefs: imgs.imageRefs,
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
        thumbnails: (data.product.images ?? []).map(
          (img) => getOptimizedThumbnailUrl(img, { width: 480 }) ?? img,
        ),
        imageRefs: data.product.images ?? [],
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
        thumbnails: (data.product.images ?? []).map(
          (img) => getOptimizedThumbnailUrl(img, { width: 480 }) ?? img,
        ),
        imageRefs: data.product.images ?? [],
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
    const { supabase, userId } = context;
    const targetUuid = resolveOrgUuid(data.orgId) ?? data.orgId;
    await assertOrgRole(supabase, userId, targetUuid, "editor");

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

// ---------------------------------------------------------------------------
// Sample orders — request → quote → confirm → ship → deliver
// ---------------------------------------------------------------------------

const isUuidStr = (v: string | null | undefined): v is string => Boolean(v && UUID_RE.test(v));

const ORDER_SELECT =
  "id, product_id, seller_org_id, buyer_org_id, requested_by, quantity, material, notes, shipping_address, needed_by, status, conversation_id, quoted_price, quote_currency, shipping_cost, lead_time_days, quote_note, tracking_ref, quoted_at, confirmed_at, shipped_at, delivered_at, created_at, updated_at, product:showroom_products(id, name, images, materials), sellerOrg:orgs!sample_orders_seller_org_id_fkey(id, name, country, logo_url), buyerOrg:orgs!sample_orders_buyer_org_id_fkey(id, name, country, logo_url)";

function mapParty(o: any): SampleOrderParty | null {
  if (!o) return null;
  const row = Array.isArray(o) ? o[0] : o;
  if (!row) return null;
  return { id: row.id, name: row.name, country: row.country ?? null, logoUrl: row.logo_url ?? null };
}

async function mapOrderRow(client: ImageClient, r: any): Promise<SampleOrder> {
  const prod = Array.isArray(r.product) ? r.product[0] : r.product;
  let productImages: string[] = [];
  if (prod && Array.isArray(prod.images)) {
    productImages = (await resolveProductImages(client, prod.images)).images;
  }
  return {
    id: r.id,
    productId: r.product_id,
    product: prod
      ? {
          id: prod.id,
          name: prod.name,
          images: productImages,
          materials: Array.isArray(prod.materials) ? prod.materials : [],
        }
      : null,
    sellerOrgId: r.seller_org_id,
    sellerOrg: mapParty(r.sellerOrg),
    buyerOrgId: r.buyer_org_id,
    buyerOrg: mapParty(r.buyerOrg),
    requestedBy: r.requested_by ?? "",
    quantity: r.quantity,
    material: r.material,
    notes: r.notes,
    shippingAddress: r.shipping_address,
    neededBy: r.needed_by,
    status: r.status as SampleOrderStatus,
    conversationId: r.conversation_id,
    quotedPrice: r.quoted_price === null || r.quoted_price === undefined ? null : Number(r.quoted_price),
    quoteCurrency: r.quote_currency ?? "EUR",
    shippingCost: r.shipping_cost === null || r.shipping_cost === undefined ? null : Number(r.shipping_cost),
    leadTimeDays: r.lead_time_days ?? null,
    quoteNote: r.quote_note ?? null,
    trackingRef: r.tracking_ref ?? null,
    quotedAt: r.quoted_at ?? null,
    confirmedAt: r.confirmed_at ?? null,
    shippedAt: r.shipped_at ?? null,
    deliveredAt: r.delivered_at ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function postOrderMessage(
  supabase: any,
  order: { conversationId: string | null },
  senderOrgId: string,
  senderName: string,
  userId: string,
  body: string,
) {
  if (!order.conversationId) return;
  try {
    await supabase.from("messages").insert({
      conversation_id: order.conversationId,
      sender_org_id: senderOrgId,
      sender_user_id: userId,
      author_name: senderName,
      author_role: "Member",
      body,
    });
  } catch {
    // messaging is best-effort
  }
}

export function formatSamplePackage(
  hangerQty?: number | null,
  metersQty?: number | null,
  fallbackQty = 1,
): string {
  const h = hangerQty ?? 0;
  const m = metersQty ?? 0;
  if (h > 0 && m > 0) return `1 Hanger + ${m}m`;
  if (h > 0) return `1 Hanger`;
  if (m > 0) return `${m} Meter${m > 1 ? "s" : ""}`;
  return `${fallbackQty} unit${fallbackQty > 1 ? "s" : ""}`;
}

export const createSampleOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        buyerOrgId: z.string().uuid(),
        sellerOrgId: z.string().uuid(),
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(10000).default(1),
        hangerQty: z.number().int().min(0).max(1).optional(),
        metersQty: z.number().int().min(0).max(3).optional(),
        material: z.string().trim().max(200).nullable().optional(),
        notes: z.string().trim().max(2000).nullable().optional(),
        shippingAddress: z.string().trim().min(3).max(1000),
        neededBy: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.buyerOrgId === data.sellerOrgId) {
      throw new Error("You cannot order samples from your own organization.");
    }

    if (
      (data.hangerQty !== undefined || data.metersQty !== undefined) &&
      (data.hangerQty ?? 0) <= 0 &&
      (data.metersQty ?? 0) <= 0
    ) {
      throw new Error("Please select at least 1 hanger or at least 1 meter.");
    }

    // Never trust the posted buyer id: the caller must be a member of it.
    const { data: isBuyerMember } = await supabase.rpc("is_org_member", {
      _user: userId,
      _org: data.buyerOrgId,
    });
    if (!isBuyerMember) throw new Error("You are not a member of the ordering organization.");

    const { data: connected } = await supabase.rpc("orgs_are_connected", {
      _org_a: data.buyerOrgId,
      _org_b: data.sellerOrgId,
    });
    if (!connected) throw new Error("Connect with this organization before ordering samples.");

    const { data: prod, error: prodErr } = await supabase
      .from("showroom_products")
      .select("id, name, org_id, is_active")
      .eq("id", data.productId)
      .eq("org_id", data.sellerOrgId)
      .maybeSingle();
    if (prodErr) throw new Error(prodErr.message);
    if (!prod || !prod.is_active) throw new Error("This product is not available for ordering.");

    const [{ data: buyerRow }, { data: sellerRow }] = await Promise.all([
      supabase.from("orgs").select("name").eq("id", data.buyerOrgId).maybeSingle(),
      supabase.from("orgs").select("name").eq("id", data.sellerOrgId).maybeSingle(),
    ]);

    let conversationId: string | null = null;
    try {
      const { data: convId } = await supabase.rpc("get_or_create_conversation", {
        _org_a: data.buyerOrgId,
        _org_b: data.sellerOrgId,
      });
      conversationId = (convId as string) ?? null;
    } catch {
      conversationId = null;
    }

    const hasSpecificUnit = data.hangerQty !== undefined || data.metersQty !== undefined;
    const samplePkg = hasSpecificUnit
      ? formatSamplePackage(data.hangerQty, data.metersQty, data.quantity)
      : null;
    const effectiveQty =
      (data.metersQty && data.metersQty > 0)
        ? data.metersQty
        : (data.hangerQty && data.hangerQty > 0 ? data.hangerQty : data.quantity);
    const materialLabel = data.material
      ? samplePkg
        ? `${data.material} (${samplePkg})`
        : data.material
      : samplePkg ?? null;

    const { data: inserted, error } = await supabase
      .from("sample_orders")
      .insert({
        product_id: data.productId,
        seller_org_id: data.sellerOrgId,
        buyer_org_id: data.buyerOrgId,
        requested_by: userId,
        quantity: effectiveQty,
        material: materialLabel,
        notes: data.notes ?? null,
        shipping_address: data.shippingAddress,
        needed_by: data.neededBy ?? null,
        status: "requested",
        conversation_id: conversationId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("sample_order_events").insert({
      order_id: inserted.id,
      actor_org_id: data.buyerOrgId,
      actor_user_id: userId,
      from_status: null,
      to_status: "requested",
      note: data.notes ?? null,
    });

    const packageSummary = samplePkg ? ` (${samplePkg})` : ` (Qty: ${data.quantity})`;
    const materialSnippet = data.material ? ` · Colorway/Material: ${data.material}` : "";
    const neededSnippet = data.neededBy ? ` · Needed by: ${data.neededBy}` : "";
    const notesSnippet = data.notes ? `\n\nNotes: "${data.notes}"` : "";
    await postOrderMessage(
      supabase,
      { conversationId },
      data.buyerOrgId,
      buyerRow?.name ?? "Buyer",
      userId,
      `📦 Sample order request: ${prod.name}${packageSummary}${materialSnippet}${neededSnippet}\nShip to:\n${data.shippingAddress}${notesSnippet}`,
    );

    return {
      orderId: inserted.id as string,
      conversationId,
      sellerName: sellerRow?.name ?? "Supplier",
    };
  });

export const createBatchSampleOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        buyerOrgId: z.string().uuid(),
        sellerOrgId: z.string().uuid(),
        items: z
          .array(
            z.object({
              productId: z.string().uuid(),
              hangerQty: z.number().int().min(0).max(1).default(0),
              metersQty: z.number().int().min(0).max(3).default(0),
              material: z.string().trim().max(200).nullable().optional(),
            }),
          )
          .min(1)
          .max(50),
        notes: z.string().trim().max(2000).nullable().optional(),
        shippingAddress: z.string().trim().min(3).max(1000),
        neededBy: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.buyerOrgId === data.sellerOrgId) {
      throw new Error("You cannot order samples from your own organization.");
    }

    const { data: isBuyerMember } = await supabase.rpc("is_org_member", {
      _user: userId,
      _org: data.buyerOrgId,
    });
    if (!isBuyerMember) throw new Error("You are not a member of the ordering organization.");

    const { data: connected } = await supabase.rpc("orgs_are_connected", {
      _org_a: data.buyerOrgId,
      _org_b: data.sellerOrgId,
    });
    if (!connected) throw new Error("Connect with this organization before ordering samples.");

    const [{ data: buyerRow }, { data: sellerRow }] = await Promise.all([
      supabase.from("orgs").select("name").eq("id", data.buyerOrgId).maybeSingle(),
      supabase.from("orgs").select("name").eq("id", data.sellerOrgId).maybeSingle(),
    ]);

    let conversationId: string | null = null;
    try {
      const { data: convId } = await supabase.rpc("get_or_create_conversation", {
        _org_a: data.buyerOrgId,
        _org_b: data.sellerOrgId,
      });
      conversationId = (convId as string) ?? null;
    } catch {
      conversationId = null;
    }

    const orderIds: string[] = [];
    const itemSummaries: string[] = [];

    for (const item of data.items) {
      if ((item.hangerQty ?? 0) <= 0 && (item.metersQty ?? 0) <= 0) {
        throw new Error("Each sample item must have at least 1 hanger or at least 1 meter requested.");
      }

      const { data: prod } = await supabase
        .from("showroom_products")
        .select("id, name, org_id, is_active")
        .eq("id", item.productId)
        .eq("org_id", data.sellerOrgId)
        .maybeSingle();

      if (!prod || !prod.is_active) continue;

      const samplePkg = formatSamplePackage(item.hangerQty, item.metersQty, 1);
      const effectiveQty = item.metersQty > 0 ? item.metersQty : item.hangerQty > 0 ? item.hangerQty : 1;
      const materialLabel = item.material ? `${item.material} (${samplePkg})` : samplePkg;

      const { data: inserted, error } = await supabase
        .from("sample_orders")
        .insert({
          product_id: item.productId,
          seller_org_id: data.sellerOrgId,
          buyer_org_id: data.buyerOrgId,
          requested_by: userId,
          quantity: effectiveQty,
          material: materialLabel,
          notes: data.notes ?? null,
          shipping_address: data.shippingAddress,
          needed_by: data.neededBy ?? null,
          status: "requested",
          conversation_id: conversationId,
        })
        .select("id")
        .single();

      if (!error && inserted) {
        orderIds.push(inserted.id as string);
        await supabase.from("sample_order_events").insert({
          order_id: inserted.id,
          actor_org_id: data.buyerOrgId,
          actor_user_id: userId,
          from_status: null,
          to_status: "requested",
          note: data.notes ?? null,
        });
        const colorSnippet = item.material ? ` · ${item.material}` : "";
        itemSummaries.push(`• ${prod.name}: ${samplePkg}${colorSnippet}`);
      }
    }

    if (orderIds.length === 0) {
      throw new Error("Could not place sample order for the selected products.");
    }

    const neededSnippet = data.neededBy ? ` · Needed by: ${data.neededBy}` : "";
    const notesSnippet = data.notes ? `\n\nNotes: "${data.notes}"` : "";
    const msg = `📦 Sample batch request (${orderIds.length} fabric${orderIds.length > 1 ? "s" : ""}):\n${itemSummaries.join("\n")}${neededSnippet}\n\nShip to:\n${data.shippingAddress}${notesSnippet}`;

    await postOrderMessage(
      supabase,
      { conversationId },
      data.buyerOrgId,
      buyerRow?.name ?? "Buyer",
      userId,
      msg,
    );

    return {
      orderIds,
      firstOrderId: orderIds[0],
      conversationId,
      sellerName: sellerRow?.name ?? "Supplier",
      count: orderIds.length,
    };
  });

export const getSampleOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ orderId: z.string().uuid(), orgId: z.string().min(1) }).parse(d),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      order: SampleOrder;
      events: SampleOrderEvent[];
      role: "buyer" | "seller";
    }> => {
      const { supabase } = context;
      const orgUuid = resolveOrgUuid(data.orgId) ?? data.orgId;

      const { data: row, error } = await supabase
        .from("sample_orders")
        .select(ORDER_SELECT)
        .eq("id", data.orderId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("Order not found.");

      const order = await mapOrderRow(supabase, row);
      let role: "buyer" | "seller";
      if (order.sellerOrgId === orgUuid) role = "seller";
      else if (order.buyerOrgId === orgUuid) role = "buyer";
      else throw new Error("This order does not belong to your organization.");

      const { data: evRows } = await supabase
        .from("sample_order_events")
        .select("id, actor_org_id, actor_user_id, from_status, to_status, note, created_at")
        .eq("order_id", data.orderId)
        .order("created_at", { ascending: true });

      const events: SampleOrderEvent[] = (evRows ?? []).map((e: any) => ({
        id: e.id,
        actorOrgId: e.actor_org_id,
        actorUserId: e.actor_user_id,
        fromStatus: e.from_status,
        toStatus: e.to_status,
        note: e.note,
        createdAt: e.created_at,
      }));

      return { order, events, role };
    },
  );

export const listSampleOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orgId: z.string().min(1) }).parse(d))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ inbound: SampleOrder[]; outbound: SampleOrder[]; pendingCount: number }> => {
      const { supabase } = context;
      const targetUuid = resolveOrgUuid(data.orgId) ?? data.orgId;

      const inbound: SampleOrder[] = [];
      const outbound: SampleOrder[] = [];
      let pendingCount = 0;

      if (!isUuidStr(targetUuid)) return { inbound, outbound, pendingCount };

      const { data: rows, error } = await supabase
        .from("sample_orders")
        .select(ORDER_SELECT)
        .or(`seller_org_id.eq.${targetUuid},buyer_org_id.eq.${targetUuid}`)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);

      for (const r of (rows ?? []) as any[]) {
        const order = await mapOrderRow(supabase, r);
        if (order.sellerOrgId === targetUuid) {
          inbound.push(order);
          // Seller has something to do on new requests and confirmed orders.
          if (order.status === "requested" || order.status === "confirmed") pendingCount += 1;
        } else {
          outbound.push(order);
          // Buyer must act on quotes.
          if (order.status === "quoted") pendingCount += 1;
        }
      }

      return { inbound, outbound, pendingCount };
    },
  );

const TRANSITIONS: Record<
  SampleOrderAction,
  { role: "buyer" | "seller"; from: SampleOrderStatus[]; to: SampleOrderStatus }
> = {
  quote: { role: "seller", from: ["requested"], to: "quoted" },
  unquote: { role: "seller", from: ["quoted"], to: "requested" },
  decline: { role: "seller", from: ["requested", "quoted", "confirmed"], to: "declined" },
  confirm: { role: "buyer", from: ["quoted"], to: "confirmed" },
  withdraw: { role: "buyer", from: ["requested", "quoted"], to: "withdrawn" },
  ship: { role: "seller", from: ["confirmed"], to: "shipped" },
  deliver: { role: "seller", from: ["shipped"], to: "delivered" },
};

export const transitionSampleOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        orgId: z.string().min(1),
        action: z.enum(["quote", "unquote", "decline", "confirm", "withdraw", "ship", "deliver"]),
        note: z.string().trim().max(1000).optional(),
        quote: z
          .object({
            price: z.number().min(0).max(1_000_000),
            currency: z.string().trim().min(3).max(3).default("EUR"),
            shippingCost: z.number().min(0).max(1_000_000).nullable().optional(),
            leadTimeDays: z.number().int().min(0).max(365).nullable().optional(),
          })
          .optional(),
        trackingRef: z.string().trim().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const orgUuid = resolveOrgUuid(data.orgId) ?? data.orgId;

    const { data: row, error } = await supabase
      .from("sample_orders")
      .select(ORDER_SELECT)
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Order not found.");
    const order = await mapOrderRow(supabase, row);

    const rule = TRANSITIONS[data.action];
    const actorRole: "buyer" | "seller" | null =
      order.sellerOrgId === orgUuid ? "seller" : order.buyerOrgId === orgUuid ? "buyer" : null;
    if (!actorRole) throw new Error("This order does not belong to your organization.");
    if (actorRole !== rule.role) {
      throw new Error(`Only the ${rule.role} can ${data.action} this order.`);
    }
    if (!rule.from.includes(order.status)) {
      throw new Error(`Cannot ${data.action} an order that is ${order.status}.`);
    }

    const { data: isMember } = await supabase.rpc("is_org_member", { _user: userId, _org: orgUuid });
    if (!isMember) throw new Error("You are not a member of this organization.");

    const now = new Date().toISOString();
    const patch: Database["public"]["Tables"]["sample_orders"]["Update"] = {
      status: rule.to,
      updated_at: now,
    };

    if (data.action === "quote") {
      if (!data.quote) throw new Error("A quote requires a price.");
      patch.quoted_price = data.quote.price;
      patch.quote_currency = data.quote.currency.toUpperCase();
      patch.shipping_cost = data.quote.shippingCost ?? null;
      patch.lead_time_days = data.quote.leadTimeDays ?? null;
      patch.quote_note = data.note ?? null;
      patch.quoted_at = now;
    }
    if (data.action === "unquote") {
      patch.quoted_price = null;
      patch.shipping_cost = null;
      patch.lead_time_days = null;
      patch.quote_note = null;
      patch.quoted_at = null;
    }
    if (data.action === "confirm") patch.confirmed_at = now;
    if (data.action === "ship") {
      patch.shipped_at = now;
      patch.tracking_ref = data.trackingRef ?? null;
    }
    if (data.action === "deliver") patch.delivered_at = now;

    const { error: updErr } = await supabase
      .from("sample_orders")
      .update(patch)
      .eq("id", data.orderId);
    if (updErr) throw new Error(updErr.message);

    await supabase.from("sample_order_events").insert({
      order_id: data.orderId,
      actor_org_id: orgUuid,
      actor_user_id: userId,
      from_status: order.status,
      to_status: rule.to,
      note: data.note ?? (data.action === "ship" && data.trackingRef ? `Tracking: ${data.trackingRef}` : null),
    });

    const actorName =
      (actorRole === "seller" ? order.sellerOrg?.name : order.buyerOrg?.name) ?? "Partner";
    const productName = order.product?.name ?? "sample order";
    const fmt = (n: number | null | undefined, cur: string) =>
      n === null || n === undefined ? null : `${cur} ${n.toFixed(2)}`;

    let body: string;
    switch (data.action) {
      case "quote": {
        const price = fmt(data.quote!.price, data.quote!.currency.toUpperCase());
        const ship = fmt(data.quote!.shippingCost ?? null, data.quote!.currency.toUpperCase());
        const lead = data.quote!.leadTimeDays ? ` · Lead time: ${data.quote!.leadTimeDays} days` : "";
        body = `💬 Quote for ${productName}: ${price}${ship ? ` + shipping ${ship}` : ""}${lead}${data.note ? `\n\n${data.note}` : ""}`;
        break;
      }
      case "confirm":
        body = `✅ Quote confirmed for ${productName}. Please prepare the samples.${data.note ? `\n\n${data.note}` : ""}`;
        break;
      case "unquote":
        body = `↩️ ${actorName} withdrew their quote for ${productName}. A revised quote will follow.${data.note ? `\n\n${data.note}` : ""}`;
        break;
      case "decline":
        body = `❌ Sample order for ${productName} was declined.${data.note ? `\n\n${data.note}` : ""}`;
        break;
      case "withdraw":
        body = `↩️ Sample request for ${productName} was withdrawn.${data.note ? `\n\n${data.note}` : ""}`;
        break;
      case "ship":
        body = `🚚 Samples for ${productName} have shipped.${data.trackingRef ? ` Tracking: ${data.trackingRef}` : ""}${data.note ? `\n\n${data.note}` : ""}`;
        break;
      case "deliver":
      default:
        body = `📬 Samples for ${productName} marked as delivered.${data.note ? `\n\n${data.note}` : ""}`;
        break;
    }
    await postOrderMessage(supabase, order, orgUuid, actorName, userId, body);

    return { ok: true, status: rule.to };
  });
