import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const filterSchema = z.object({
  intent: z.enum(["search", "chat"]),
  reply: z.string().nullable(),
  keywords: z.array(z.string()).nullable(),
  materials: z.array(z.string()).nullable(),
  certifications: z.array(z.string()).nullable(),
  countries: z.array(z.string()).nullable(),
  cities: z.array(z.string()).nullable(),
  orgTypes: z.array(z.string()).nullable(),
  maxMoq: z.number().nullable(),
  maxLeadTimeDays: z.number().nullable(),
});
type Filters = Omit<z.infer<typeof filterSchema>, "intent" | "reply">;

export type AskGchResult = {
  id: string;
  slug: string | null;
  name: string;
  type: string | null;
  city: string | null;
  country: string | null;
  moq: string | null;
  leadTimeDays: number | null;
  materials: string[];
  certifications: string[];
  description: string | null;
};

export type AskGchAnswer = { summary: string; filters: Filters; results: AskGchResult[] };

// Only sustainable materials are ever suggested or shown.
export const SUSTAINABLE_MATERIALS = [
  "organic cotton", "recycled cotton", "regenerative cotton", "bci cotton", "organic denim", "recycled denim",
  "recycled polyester", "rpet", "recycled nylon", "econyl", "tencel", "lyocell", "modal", "ecovero",
  "hemp", "organic linen", "linen", "responsible wool", "recycled wool", "rws", "deadstock",
  "bio-based", "plant-based leather", "mushroom leather", "cupro", "piñatex", "organic", "recycled",
];
const isSustainable = (m: string) => {
  const l = m.toLowerCase();
  return SUSTAINABLE_MATERIALS.some((s) => l.includes(s));
};
const CERTS = ["gots", "grs", "ocs", "rcs", "oeko-tex", "bsci", "sa8000", "fair trade", "bluesign", "rws", "fsc", "cradle to cradle", "zdhc", "higg"];
const GREETING = /^(hi|hello|hey|hola|yo|thanks|thank you|good (morning|afternoon|evening)|how are you|who are you|what can you do|help)\b/i;

function fallbackFilters(q: string): Filters {
  const l = q.toLowerCase();
  const moq = l.match(/moq[^\d]{0,15}(\d[\d,]*)/);
  const mats = SUSTAINABLE_MATERIALS.filter((m) => l.includes(m));
  if (l.includes("denim") && !mats.length) mats.push("organic denim");
  const certs = CERTS.filter((c) => l.includes(c));
  return {
    keywords: l.split(/\W+/).filter((w) => w.length > 3),
    materials: mats.length ? mats : null,
    certifications: certs.length ? certs : null,
    countries: null,
    cities: null,
    orgTypes: null,
    maxMoq: moq ? Number(moq[1].replace(/,/g, "")) : null,
    maxLeadTimeDays: null,
  };
}

const CHAT_FALLBACK =
  "Hi! I'm Ask GCH, your sustainable sourcing assistant. I search the GCH network for suppliers working with sustainable materials — organic and recycled cotton, recycled polyester, TENCEL™, hemp, responsible wool and more. Try: \"GOTS organic denim mills in Turkey with MOQ under 1000\".";

function parseMoq(v: string | null): number | null {
  if (!v) return null;
  const m = v.replace(/,/g, "").match(/\d+/);
  return m ? Number(m[0]) : null;
}

const lc = (a: string[] | null | undefined) => (a ?? []).map((x) => x.toLowerCase());
const hit = (hay: string[], needles: string[]) =>
  needles.some((n) => hay.some((h) => h.includes(n.toLowerCase()) || n.toLowerCase().includes(h)));

export const askGch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ query: z.string().trim().min(2).max(800) }).parse(d))
  .handler(async ({ data, context }): Promise<AskGchAnswer> => {
    let filters: Filters = fallbackFilters(data.query);
    const key = process.env.LOVABLE_API_KEY;
    if (key) {
      try {
        const gateway = createLovableAiGatewayProvider(key);
        const { output } = await generateText({
          model: gateway("google/gemini-3.1-flash-lite"),
          output: Output.object({ schema: filterSchema }),
          prompt: `Extract supplier-search filters from this apparel supply-chain question. Use null for anything not mentioned; never invent. Countries in English full names (e.g. Turkey, Pakistan). orgTypes like Manufacturer, Mill, Dye House, Brand, Laundry, Trim Supplier. maxMoq = the maximum minimum-order-quantity in units the user accepts. keywords = other important product terms (e.g. jeans, knitwear).\n\nQuestion: ${data.query}`,
        });
        filters = output;
      } catch (e) {
        console.error("askGch filter extraction failed", e);
      }
    }

    const { data: rows, error } = await (context.supabase as any)
      .from("orgs")
      .select("id,slug,name,type,organization_type,city,country,moq,lead_time_days,materials,certifications,capabilities,product_types,specializations,description")
      .limit(1000);
    if (error) throw new Error(error.message);

    const scored = (rows ?? [])
      .map((r: any) => {
        const tags = [...lc(r.materials), ...lc(r.capabilities), ...lc(r.product_types), ...lc(r.specializations)];
        const text = `${r.name} ${r.description ?? ""} ${tags.join(" ")}`.toLowerCase();
        let score = 0;
        if (filters.materials?.length) {
          if (!hit(tags, filters.materials) && !filters.materials.some((m) => text.includes(m.toLowerCase()))) return null;
          score += 3;
        }
        if (filters.certifications?.length) {
          if (!hit(lc(r.certifications), filters.certifications)) return null;
          score += 2;
        }
        if (filters.countries?.length) {
          if (!filters.countries.some((c) => (r.country ?? "").toLowerCase().includes(c.toLowerCase()))) return null;
          score += 2;
        }
        if (filters.cities?.length) {
          if (!filters.cities.some((c) => (r.city ?? "").toLowerCase().includes(c.toLowerCase()))) return null;
          score += 2;
        }
        if (filters.orgTypes?.length) {
          const t = `${r.type ?? ""} ${r.organization_type ?? ""}`.toLowerCase();
          if (filters.orgTypes.some((o) => t.includes(o.toLowerCase().split(" ")[0]))) score += 1;
        }
        if (filters.maxMoq != null) {
          const m = parseMoq(r.moq);
          if (m != null && m > filters.maxMoq) return null;
          if (m != null) score += 1;
        }
        if (filters.maxLeadTimeDays != null && r.lead_time_days != null && r.lead_time_days > filters.maxLeadTimeDays) return null;
        if (filters.keywords?.length) score += filters.keywords.filter((k) => text.includes(k.toLowerCase())).length;
        return { r, score };
      })
      .filter(Boolean) as { r: any; score: number }[];

    const hasFilter = Object.values(filters).some((v) => (Array.isArray(v) ? v.length : v != null));
    const list = (hasFilter ? scored : scored.filter((s) => s.score > 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(({ r }) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        type: r.organization_type ?? r.type,
        city: r.city,
        country: r.country,
        moq: r.moq,
        leadTimeDays: r.lead_time_days,
        materials: r.materials ?? [],
        certifications: r.certifications ?? [],
        description: r.description,
      }));

    const parts: string[] = [];
    if (filters.materials?.length) parts.push(filters.materials.join(", "));
    if (filters.orgTypes?.length) parts.push(filters.orgTypes.join("/"));
    const where = [...(filters.cities ?? []), ...(filters.countries ?? [])].join(", ");
    const desc = `${parts.join(" ") || "organizations"}${where ? ` in ${where}` : ""}${filters.certifications?.length ? ` with ${filters.certifications.join(", ")}` : ""}${filters.maxMoq != null ? ` and MOQ up to ${filters.maxMoq.toLocaleString()}` : ""}`;
    const summary = list.length
      ? `I found ${scored.length} match${scored.length === 1 ? "" : "es"} for ${desc} in the GCH network${scored.length > list.length ? ` — here are the top ${list.length}` : ""}.`
      : `I couldn't find any ${desc} in the GCH network. Try widening the location or MOQ.`;

    return { summary, filters, results: list };
  });
