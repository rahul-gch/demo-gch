import type { Entity } from "./types";
import { ENTITIES } from "./entities";

export interface EcosystemConnection {
  entity: Entity;
  role: "Upstream" | "Downstream" | "Verifier";
  relationship: string;
}

const TIER_ORDER = ["Tier 4", "Tier 3", "Tier 2", "Tier 1", "Tier 0"] as const;

export function getEcosystemConnections(e: Entity): EcosystemConnection[] {
  const rand = seed(e.id + ":eco");
  const idx = TIER_ORDER.indexOf(e.actorType);
  const upstreamTier = TIER_ORDER[Math.max(0, idx - 1)];
  const downstreamTier = TIER_ORDER[Math.min(TIER_ORDER.length - 1, idx + 1)];
  const pool = ENTITIES.filter((x) => x.id !== e.id);

  const pick = (n: number, filter: (x: Entity) => boolean): Entity[] => {
    const matches = pool.filter(filter);
    const out: Entity[] = [];
    while (out.length < n && matches.length) {
      const i = Math.floor(rand() * matches.length);
      out.push(matches.splice(i, 1)[0]);
    }
    return out;
  };

  const upstream = pick(3, (x) => x.actorType === upstreamTier && x.entityType !== "Certification Body");
  const downstream = pick(2, (x) => x.actorType === downstreamTier && x.entityType !== "Certification Body");
  const verifiers = pick(2, (x) => x.entityType === "Certification Body" || x.entityType === "Sustainability Partner");

  return [
    ...upstream.map((entity) => ({ entity, role: "Upstream" as const, relationship: `Supplies ${e.name.split(" ")[0]}` })),
    ...downstream.map((entity) => ({ entity, role: "Downstream" as const, relationship: `Buyer of ${e.name.split(" ")[0]} output` })),
    ...verifiers.map((entity) => ({ entity, role: "Verifier" as const, relationship: "Audits and certification" })),
  ];
}

export interface MatchSuggestion {
  entity: Entity;
  score: number;
  reasons: string[];
}

export function getMatchSuggestions(e: Entity): MatchSuggestion[] {
  const rand = seed(e.id + ":match");
  const pool = ENTITIES.filter((x) => x.id !== e.id && x.entityType !== e.entityType);
  const scored = pool.map((entity) => {
    const sameCountry = entity.country === e.country;
    const matOverlap = entity.materials.filter((m) => e.materials.includes(m)).length;
    const certOverlap = entity.certifications.filter((c) => e.certifications.includes(c)).length;
    const base = 55 + matOverlap * 6 + certOverlap * 4 + (sameCountry ? 8 : 0);
    const jitter = Math.floor(rand() * 12);
    const score = Math.min(95, base + jitter);
    const reasons: string[] = [];
    if (matOverlap) reasons.push(`${matOverlap} shared material${matOverlap > 1 ? "s" : ""}`);
    if (certOverlap) reasons.push(`${certOverlap} shared certification${certOverlap > 1 ? "s" : ""}`);
    if (sameCountry) reasons.push("Same country");
    if (reasons.length === 0) reasons.push("Complementary tier");
    return { entity, score, reasons };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}


export const SHOWCASE_IDS = Array.from({ length: 20 }, (_, i) =>
  `gch-${String(i + 1).padStart(3, "0")}`,
);

export function isShowcase(id: string) {
  return SHOWCASE_IDS.includes(id);
}

// Deterministic pseudo-random based on entity id, so the same entity always
// shows the same mock numbers.
function seed(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

export interface MockKpis {
  activeOrders: number;
  ordersSpark: number[];
  onTimeDelivery: number;
  onTimeTrend: number;
  monthlyVolume: { month: string; value: number }[];
  materialMix: { label: string; value: number }[];
}

export function getMockKpis(e: Entity): MockKpis {
  const rand = seed(e.id);
  const base = 30 + Math.floor(rand() * 80);
  const ordersSpark = Array.from({ length: 12 }, () =>
    Math.max(5, Math.round(base * (0.6 + rand() * 0.9))),
  );
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthlyVolume = months.map((m) => ({
    month: m,
    value: Math.round(base * (0.7 + rand() * 1.2)),
  }));

  const mats =
    e.materials.length > 0
      ? e.materials
      : ["Organic Cotton", "Recycled Polyester", "Tencel", "Linen"];
  const materialMix = mats.slice(0, 5).map((label) => ({
    label,
    value: Math.round(20 + rand() * 80),
  }));

  return {
    activeOrders: Math.max(2, Math.round(base / 5)),
    ordersSpark,
    onTimeDelivery: 78 + Math.floor(rand() * 20),
    onTimeTrend: Math.round((rand() - 0.4) * 8),
    monthlyVolume,
    materialMix,
  };
}

export interface MockMessage {
  id: string;
  from: "admin" | "entity";
  authorName: string;
  authorRole: string;
  body: string;
  at: string;
  read: boolean;
}

export function getMockMessages(e: Entity): MockMessage[] {
  const adminName = "Anya Sharma";
  const adminRole = "GCH Platform Admin";
  const entityName = e.contacts[0]?.name || "Operations Team";
  const entityRole = e.contacts[0]?.role || "Director";

  const baseDay = 21 - (parseInt(e.id.slice(-3)) % 8);
  const day = (offset: number) => `2026-05-${String(baseDay + offset).padStart(2, "0")}`;

  return [
    {
      id: `${e.id}-m1`,
      from: "admin",
      authorName: adminName,
      authorRole: adminRole,
      body: `Hi ${e.name.split(" ")[0]} team — welcome to Global Chain Hub. Could you upload your latest certifications so we can complete your verification?`,
      at: `${day(0)} 09:14`,
      read: true,
    },
    {
      id: `${e.id}-m2`,
      from: "entity",
      authorName: entityName,
      authorRole: entityRole,
      body: `Hello Anya, thank you. We'll share the updated ${e.certifications[0] || "GOTS"} certificate this week along with our facility audit report.`,
      at: `${day(0)} 11:47`,
      read: true,
    },
    {
      id: `${e.id}-m3`,
      from: "admin",
      authorName: adminName,
      authorRole: adminRole,
      body: `Perfect. We've also flagged ${e.missingFields.length || 2} missing fields on your profile — see the "Missing data" panel. Let us know if you need help.`,
      at: `${day(1)} 08:30`,
      read: true,
    },
    {
      id: `${e.id}-m4`,
      from: "entity",
      authorName: entityName,
      authorRole: entityRole,
      body: `Noted. We'll have our commercial lead complete the capacity and MOQ fields by Friday.`,
      at: `${day(2)} 15:02`,
      read: true,
    },
    {
      id: `${e.id}-m5`,
      from: "admin",
      authorName: adminName,
      authorRole: adminRole,
      body: `Great — once that's in, your matchmaking readiness should cross 80%. Talk soon.`,
      at: `${day(3)} 10:11`,
      read: false,
    },
  ];
}

export interface MockActivity {
  id: string;
  kind: "upload" | "review" | "score" | "message" | "edit";
  text: string;
  at: string;
}

export function getMockActivity(e: Entity): MockActivity[] {
  return [
    { id: "a1", kind: "score", text: `Confidence score updated to ${e.confidenceScore}%`, at: "2 days ago" },
    {
      id: "a2",
      kind: "upload",
      text: `${e.certifications[0] || "Certificate"} document uploaded`,
      at: "4 days ago",
    },
    { id: "a3", kind: "review", text: "Profile reviewed by GCH admin", at: "1 week ago" },
    { id: "a4", kind: "edit", text: "Contact details updated", at: "2 weeks ago" },
    { id: "a5", kind: "message", text: "New message thread opened", at: "3 weeks ago" },
  ];
}

export interface MockDocument {
  id: string;
  name: string;
  type: string;
  status: "Verified" | "Pending" | "Expired";
  size: string;
  uploadedAt: string;
}

export function getMockDocuments(e: Entity): MockDocument[] {
  const docs: MockDocument[] = [];
  e.certifications.slice(0, 3).forEach((c, i) => {
    docs.push({
      id: `d-c${i}`,
      name: `${c.replace(/\s+/g, "_")}_Certificate_2026.pdf`,
      type: "Certification",
      status: i === 0 ? "Verified" : i === 1 ? "Pending" : "Expired",
      size: `${(0.4 + i * 0.3).toFixed(1)} MB`,
      uploadedAt: `2026-0${(i % 4) + 2}-1${i + 2}`,
    });
  });
  docs.push(
    {
      id: "d-audit",
      name: "Factory_Social_Audit_2026.pdf",
      type: "Audit",
      status: "Verified",
      size: "1.2 MB",
      uploadedAt: "2026-04-08",
    },
    {
      id: "d-msds",
      name: "Material_Safety_Data_Sheet.pdf",
      type: "Compliance",
      status: "Pending",
      size: "0.6 MB",
      uploadedAt: "2026-05-02",
    },
  );
  return docs;
}
