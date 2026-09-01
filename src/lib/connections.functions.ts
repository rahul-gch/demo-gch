import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getEntity, ALL_ENTITIES } from "@/seed/all-entities";

export interface ConnectionRecord {
  id: string;
  fromOrgId: string;
  toOrgId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

// In-memory shared server-side registry of connections (dev & demo fallback)
const SERVER_CONNECTIONS = new Map<string, ConnectionRecord>();

function matchesOrg(recordOrgId: string, queryOrgId: string): boolean {
  if (!recordOrgId || !queryOrgId) return false;
  if (recordOrgId.toLowerCase() === queryOrgId.toLowerCase()) return true;

  const e1 = getEntity(recordOrgId) || ALL_ENTITIES.find((e) => e.id === recordOrgId || e.orgUuid === recordOrgId);
  const e2 = getEntity(queryOrgId) || ALL_ENTITIES.find((e) => e.id === queryOrgId || e.orgUuid === queryOrgId);

  if (e1 && e2) {
    return e1.id === e2.id || (!!e1.orgUuid && e1.orgUuid === e2.orgUuid);
  }
  if (e1) {
    return (
      e1.id.toLowerCase() === queryOrgId.toLowerCase() ||
      e1.slug?.toLowerCase() === queryOrgId.toLowerCase() ||
      e1.orgUuid?.toLowerCase() === queryOrgId.toLowerCase()
    );
  }
  if (e2) {
    return (
      e2.id.toLowerCase() === recordOrgId.toLowerCase() ||
      e2.slug?.toLowerCase() === recordOrgId.toLowerCase() ||
      e2.orgUuid?.toLowerCase() === recordOrgId.toLowerCase()
    );
  }
  return false;
}

function canonicalId(id: string): string {
  const e = getEntity(id) || ALL_ENTITIES.find((item) => item.id === id || item.orgUuid === id || item.slug === id);
  return e?.id ?? id;
}

function getOrgUuid(id: string): string | null {
  const e = getEntity(id) || ALL_ENTITIES.find((item) => item.id === id || item.orgUuid === id || item.slug === id);
  return e?.orgUuid ?? null;
}

async function getSupabaseServiceClient() {
  const url = process.env["SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !serviceKey) return null;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}

export const getOrgConnections = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ orgId: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<ConnectionRecord[]> => {
    const results: ConnectionRecord[] = [];
    const supabase = await getSupabaseServiceClient();

    if (supabase) {
      try {
        const orgUuid = getOrgUuid(data.orgId);
        const searchIds = [data.orgId, orgUuid].filter(Boolean) as string[];

        const { data: rows, error } = await supabase
          .from("org_connections")
          .select("id, from_org_id, to_org_id, status, created_at")
          .or(`from_org_id.in.(${searchIds.join(",")}),to_org_id.in.(${searchIds.join(",")})`);

        if (!error && rows) {
          for (const r of rows) {
            results.push({
              id: r.id,
              fromOrgId: canonicalId(r.from_org_id),
              toOrgId: canonicalId(r.to_org_id),
              status: r.status as "pending" | "accepted" | "declined",
              createdAt: r.created_at,
            });
          }
        }
      } catch {
        // Fallback to memory
      }
    }

    // Merge in-memory fallback records
    const memList = Array.from(SERVER_CONNECTIONS.values()).filter(
      (r) => matchesOrg(r.fromOrgId, data.orgId) || matchesOrg(r.toOrgId, data.orgId),
    );

    for (const m of memList) {
      if (!results.some((r) => r.id === m.id || (matchesOrg(r.fromOrgId, m.fromOrgId) && matchesOrg(r.toOrgId, m.toOrgId)))) {
        results.push(m);
      }
    }

    return results;
  });

export const sendOrgConnection = createServerFn({ method: "POST" })
  .validator(
    (data: unknown) =>
      z.object({ fromOrgId: z.string().min(1), toOrgId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }): Promise<ConnectionRecord> => {
    const from = canonicalId(data.fromOrgId);
    const to = canonicalId(data.toOrgId);

    const fromUuid = getOrgUuid(data.fromOrgId);
    const toUuid = getOrgUuid(data.toOrgId);

    const supabase = await getSupabaseServiceClient();
    if (supabase && fromUuid && toUuid) {
      try {
        const { data: inserted, error } = await supabase
          .from("org_connections")
          .upsert(
            {
              from_org_id: fromUuid,
              to_org_id: toUuid,
              status: "pending",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "from_org_id,to_org_id" },
          )
          .select("id, from_org_id, to_org_id, status, created_at")
          .single();

        if (!error && inserted) {
          const rec: ConnectionRecord = {
            id: inserted.id,
            fromOrgId: from,
            toOrgId: to,
            status: inserted.status,
            createdAt: inserted.created_at,
          };
          SERVER_CONNECTIONS.set(rec.id, rec);
          return rec;
        }
      } catch {
        // Fallback
      }
    }

    // In-memory fallback
    const existing = Array.from(SERVER_CONNECTIONS.values()).find(
      (r) =>
        (matchesOrg(r.fromOrgId, from) && matchesOrg(r.toOrgId, to)) ||
        (matchesOrg(r.fromOrgId, to) && matchesOrg(r.toOrgId, from)),
    );

    if (existing) {
      if (existing.status === "declined") {
        existing.status = "pending";
        existing.fromOrgId = from;
        existing.toOrgId = to;
      }
      return existing;
    }

    const newRecord: ConnectionRecord = {
      id: `conn_${from}_${to}_${Date.now()}`,
      fromOrgId: from,
      toOrgId: to,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    SERVER_CONNECTIONS.set(newRecord.id, newRecord);
    return newRecord;
  });

export const respondOrgConnection = createServerFn({ method: "POST" })
  .validator(
    (data: unknown) =>
      z
        .object({
          myOrgId: z.string().min(1),
          otherOrgId: z.string().min(1),
          status: z.enum(["accepted", "declined"]),
        })
        .parse(data),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const myUuid = getOrgUuid(data.myOrgId);
    const otherUuid = getOrgUuid(data.otherOrgId);

    const supabase = await getSupabaseServiceClient();
    if (supabase && myUuid && otherUuid) {
      try {
        await supabase
          .from("org_connections")
          .update({ status: data.status, updated_at: new Date().toISOString() })
          .or(
            `and(from_org_id.eq.${otherUuid},to_org_id.eq.${myUuid}),and(from_org_id.eq.${myUuid},to_org_id.eq.${otherUuid})`,
          );
      } catch {
        // Fallback
      }
    }

    const existing = Array.from(SERVER_CONNECTIONS.values()).find(
      (r) =>
        (matchesOrg(r.fromOrgId, data.otherOrgId) && matchesOrg(r.toOrgId, data.myOrgId)) ||
        (matchesOrg(r.fromOrgId, data.myOrgId) && matchesOrg(r.toOrgId, data.otherOrgId)),
    );

    if (existing) {
      existing.status = data.status;
      return { success: true };
    }
    return { success: true };
  });
