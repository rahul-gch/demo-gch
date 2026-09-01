import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const inputSchema = z.object({ query: z.string().trim().min(2).max(500) });

const filterSchema = z.object({
  materials: z.array(z.string()).nullable(),
  certifications: z.array(z.string()).nullable(),
  countries: z.array(z.string()).nullable(),
  tiers: z.array(z.string()).nullable(),
  productCategories: z.array(z.string()).nullable(),
  maxLeadTimeDays: z.number().nullable(),
  minOnTimeRate: z.number().nullable(),
});

export type PartnerSearchFilters = z.infer<typeof filterSchema>;

export const aiSearchPartners = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<PartnerSearchFilters> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      const queryLower = data.query.toLowerCase();
      const knownMaterials = [
        "cotton",
        "organic cotton",
        "denim",
        "wool",
        "viscose",
        "polyester",
        "recycled polyester",
        "linen",
        "silk",
      ];
      const knownCerts = ["gots", "grs", "ocs", "oeko-tex", "bsci", "sa8000", "fair trade"];
      const knownCountries = [
        "turkey",
        "pakistan",
        "portugal",
        "china",
        "germany",
        "egypt",
        "india",
        "italy",
        "bangladesh",
        "vietnam",
        "usa",
      ];
      const knownTiers = ["tier 0", "tier 1", "tier 2", "tier 3", "tier 4"];

      const matchedMaterials = knownMaterials.filter((m) => queryLower.includes(m));
      const matchedCerts = knownCerts.filter((c) => queryLower.includes(c));
      const matchedCountries = knownCountries
        .filter((c) => queryLower.includes(c))
        .map((c) => c.charAt(0).toUpperCase() + c.slice(1));
      const matchedTiers = knownTiers.filter((t) => queryLower.includes(t));

      return {
        materials: matchedMaterials.length > 0 ? matchedMaterials : null,
        certifications: matchedCerts.length > 0 ? matchedCerts : null,
        countries: matchedCountries.length > 0 ? matchedCountries : null,
        tiers: matchedTiers.length > 0 ? matchedTiers : null,
        productCategories: null,
        maxLeadTimeDays: null,
        minOnTimeRate: null,
      };
    }
    const gateway = createLovableAiGatewayProvider(key);
    try {
      const { output } = await generateText({
        model: gateway("google/gemini-2.5-flash-lite"),
        output: Output.object({ schema: filterSchema }),
        prompt: `Extract supply-chain partner search filters from the user's request. Return null for any field the user did not specify. Never invent values. Materials examples: Cotton, Organic Cotton, Denim, Recycled Polyester, Wool, Linen. Certifications examples: GOTS, GRS, OCS, OEKO-TEX, BSCI, SA8000, Fair Trade. Tiers: "Tier 0"…"Tier 4". Product categories: Women, Men, Kids, Baby, Unisex.\n\nUser request: ${data.query}`,
      });
      return output;
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) {
        return {
          materials: null,
          certifications: null,
          countries: null,
          tiers: null,
          productCategories: null,
          maxLeadTimeDays: null,
          minOnTimeRate: null,
        };
      }
      throw e;
    }
  });
