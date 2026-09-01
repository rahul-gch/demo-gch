import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { supabase } from "@/integrations/supabase/client";
import type { ResearchRun } from "@/seed/research-runs";

const InputSchema = z.object({
  query: z.string().min(1),
  countries: z.string().optional().default(""),
  industry: z.string().optional().default(""),
  entityType: z.string().optional().default(""),
  limit: z.number().int().min(1).max(50).optional().default(20),
});

const CandidateSchema = z.object({
  name: z.string(),
  country: z.string(),
  city: z.string().optional().default(""),
  entityType: z.string(),
  materials: z.array(z.string()).optional().default([]),
  capabilities: z.array(z.string()).optional().default([]),
  moq: z.string().optional().default(""),
  leadTimeDays: z.number().optional().default(0),
  certifications: z.array(z.string()).optional().default([]),
  rationale: z.string(),
  sourceUrl: z.string().optional().default(""),
});

export const runAiResearch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const filters = [
      data.countries && `Countries: ${data.countries}`,
      data.industry && `Industry: ${data.industry}`,
      data.entityType && `Entity type: ${data.entityType}`,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `You are a sourcing research assistant for an apparel supply-chain platform.
Given the user's research request, suggest up to ${data.limit} real-world or plausible candidate organizations matching the criteria. Include MOQ, lead time, materials/capabilities, and certifications when you can reasonably infer them.

REQUEST:
${data.query}

${filters}

Return concise, structured candidates with a one-sentence rationale per candidate.`;

    try {
      const { experimental_output } = await generateText({
        model,
        prompt,
        experimental_output: Output.object({
          schema: z.object({ candidates: z.array(CandidateSchema) }),
        }),
      });
      return { candidates: experimental_output.candidates };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const lower = message.toLowerCase();
      if (!process.env.LOVABLE_API_KEY || lower.includes("missing lovable_api_key")) {
        throw new Error(
          "AI suggestions disabled — Lovable AI is not configured for this workspace.",
        );
      }
      if (
        lower.includes("402") ||
        lower.includes("payment required") ||
        lower.includes("insufficient") ||
        lower.includes("credits") ||
        lower.includes("quota") ||
        lower.includes("balance")
      ) {
        throw new Error("AI credits exhausted — top up Lovable AI to enable external suggestions.");
      }
      if (lower.includes("429") || lower.includes("rate")) {
        throw new Error("AI rate limit reached — try again in a moment.");
      }
      throw new Error(`AI research unavailable: ${message}`);
    }
  });

// Resilient memory store for runs across sessions
const researchRunsMemory = new Map<string, ResearchRun[]>();

export const getOrgResearchRuns = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ orgId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const orgId = data.orgId;
    if (researchRunsMemory.has(orgId)) {
      return researchRunsMemory.get(orgId)!;
    }

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
      const sb = supabase as any;
      const query = sb.from("orgs").select("id, profile_answers");
      const { data: org } = isUuid ? await query.eq("id", orgId).maybeSingle() : await query.eq("slug", orgId).maybeSingle();
      const meta = org?.profile_answers as Record<string, unknown> | undefined;
      if (meta?.research_runs && Array.isArray(meta.research_runs)) {
        const loaded = meta.research_runs as ResearchRun[];
        researchRunsMemory.set(orgId, loaded);
        return loaded;
      }
    } catch {
      // fallback
    }

    return [];
  });

export const saveOrgResearchRun = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        run: z.any(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const run = data.run as ResearchRun;
    const orgId = run.orgId;
    const existing = researchRunsMemory.get(orgId) ?? [];
    const idx = existing.findIndex((r) => r.id === run.id);
    const updated = idx >= 0
      ? existing.map((r) => (r.id === run.id ? run : r))
      : [run, ...existing];

    researchRunsMemory.set(orgId, updated);

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
      const sb = supabase as any;
      const query = sb.from("orgs").select("id, profile_answers");
      const { data: org } = isUuid ? await query.eq("id", orgId).maybeSingle() : await query.eq("slug", orgId).maybeSingle();
      if (org) {
        const existingMeta = (org.profile_answers as Record<string, unknown> | undefined) || {};
        const newMeta = { ...existingMeta, research_runs: updated };
        await sb.from("orgs").update({ profile_answers: newMeta }).eq("id", org.id);
      }
    } catch {
      // memory cached
    }

    return { ok: true, runs: updated };
  });

export const deleteOrgResearchRun = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        orgId: z.string(),
        runId: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { orgId, runId } = data;
    const existing = researchRunsMemory.get(orgId) ?? [];
    const updated = existing.filter((r) => r.id !== runId);
    researchRunsMemory.set(orgId, updated);

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
      const sb = supabase as any;
      const query = sb.from("orgs").select("id, profile_answers");
      const { data: org } = isUuid ? await query.eq("id", orgId).maybeSingle() : await query.eq("slug", orgId).maybeSingle();
      if (org) {
        const existingMeta = (org.profile_answers as Record<string, unknown> | undefined) || {};
        const newMeta = { ...existingMeta, research_runs: updated };
        await sb.from("orgs").update({ profile_answers: newMeta }).eq("id", org.id);
      }
    } catch {
      // memory cached
    }

    return { ok: true, runs: updated };
  });
