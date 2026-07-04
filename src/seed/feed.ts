// Deterministic seed posts per org for the Feed (Community) page.
import type { Entity } from "./types";

export type FeedKind =
  | "update"
  | "regulation"
  | "investment"
  | "partnership"
  | "event"
  | "ai-news"
  | "photo"
  | "video"
  | "document";

export interface FeedComment {
  id: string;
  author: string;
  role: string;
  body: string;
  at: string; // ISO
}

export interface FeedPost {
  id: string;
  orgId: string; // owning workspace
  authorName: string;
  authorRole: string;
  authorOrg: string;
  kind: FeedKind;
  title?: string;
  body: string;
  at: string; // ISO
  media?: { type: "photo" | "video" | "document"; label: string }[];
  likes: number;
  likedByMe?: boolean;
  comments: FeedComment[];
  rsvpCount?: number;
  rsvpByMe?: boolean;
  eventAt?: string; // ISO for event kind
}

const KIND_TEMPLATES: {
  kind: FeedKind;
  title: (e: Entity) => string;
  body: (e: Entity) => string;
  media?: FeedPost["media"];
  eventOffsetDays?: number;
}[] = [
  {
    kind: "update",
    title: (e) => `${e.name} publishes 2026 sustainability update`,
    body: (e) =>
      `Our ${e.country} operations reduced Scope 1+2 emissions by 12% YoY. Full breakdown attached for GCH partners.`,
  },
  {
    kind: "regulation",
    title: () => "EU CSRD phase-in: new reporting checkpoints",
    body: () =>
      "Mid-cap suppliers must file double-materiality assessments by Q3. GCH is preparing templates for members.",
  },
  {
    kind: "investment",
    title: () => "Blended-finance facility open for textile recyclers",
    body: () =>
      "USD 40M pooled facility from three DFIs. Ticket size 500k–5M, focus on MENA and South Asia recyclers.",
  },
  {
    kind: "partnership",
    title: (e) => `${e.name} × verified recycler consortium`,
    body: () =>
      "Signed a 3-year offtake covering 8,000 tons/year of post-industrial cotton scrap. Onboarding starts next month.",
  },
  {
    kind: "event",
    title: () => "GCH Roundtable: Traceability in the cotton value chain",
    body: () =>
      "Closed-door session with brands, ginners and DPP vendors. Chatham House rules. Limited to 40 seats.",
    eventOffsetDays: 21,
  },
  {
    kind: "ai-news",
    title: () => "AI digest — this week in sustainable supply chains",
    body: () =>
      "Bangladesh raises minimum wage floor · India cotton yields forecast down 4% · New DPP pilot in Türkiye.",
  },
  {
    kind: "photo",
    title: () => "Site walkthrough: retrofitted spinning line",
    body: () => "New drives cut kWh/kg by 18%. Photos from this morning's commissioning.",
    media: [{ type: "photo", label: "spinning-line-01.jpg" }],
  },
  {
    kind: "video",
    title: () => "3-minute tour of our closed-loop water system",
    body: () => "ZLD retrofit walkthrough with our plant manager.",
    media: [{ type: "video", label: "zld-tour.mp4" }],
  },
  {
    kind: "document",
    title: () => "2026 Code of Conduct — v3",
    body: () => "Updated Tier-2 traceability and grievance clauses. Effective 1 Sep.",
    media: [{ type: "document", label: "CoC-v3.pdf" }],
  },
  {
    kind: "update",
    title: (e) => `${e.name} joins Better Cotton uptake commitment`,
    body: () => "Targeting 75% preferred fibre share by 2028 across owned and franchise volumes.",
  },
  {
    kind: "partnership",
    title: () => "Joint LCA project — cotton to garment",
    body: () =>
      "Six GCH members co-funding a cradle-to-gate LCA covering Egypt, Türkiye and Portugal. Report Q4.",
  },
  {
    kind: "event",
    title: () => "Webinar: Preparing for DPP",
    body: () => "What brands actually need from Tier-2 suppliers. Live Q&A with regulators.",
    eventOffsetDays: 9,
  },
];

// Small deterministic hash to keep seeds stable per org.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function seedFeedForOrg(entity: Entity): FeedPost[] {
  const base = Date.now();
  return KIND_TEMPLATES.map((t, i) => {
    const seed = hash(`${entity.id}-${i}`);
    const daysAgo = (seed % 20) + 1;
    const at = new Date(base - daysAgo * 86400000).toISOString();
    return {
      id: `${entity.id}-post-${i}`,
      orgId: entity.id,
      authorName: i % 3 === 0 ? "You" : ["Network Admin", "Program Lead", "Sustainability Ops"][i % 3],
      authorRole: i % 3 === 0 ? `${entity.actorType} · Owner` : "GCH member",
      authorOrg: entity.name,
      kind: t.kind,
      title: t.title(entity),
      body: t.body(entity),
      at,
      media: t.media,
      likes: (seed % 42) + 3,
      likedByMe: false,
      comments:
        seed % 3 === 0
          ? [
              {
                id: `${entity.id}-c-${i}`,
                author: "Priya M.",
                role: "Sourcing lead",
                body: "Very useful — can you share the methodology?",
                at,
              },
            ]
          : [],
      rsvpCount: t.kind === "event" ? (seed % 60) + 8 : undefined,
      rsvpByMe: false,
      eventAt:
        t.eventOffsetDays !== undefined
          ? new Date(base + t.eventOffsetDays * 86400000).toISOString()
          : undefined,
    };
  });
}
