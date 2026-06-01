import { ORGS, EDGES, USERS, type EcosystemOrg, type EcosystemEdge, type EcosystemUser } from "./ecosystem-data";
import { topMatches, loadSettings, type MatchSettings } from "./matchmaking";
import type { AuthRole } from "./auth";

const ROLE_ORG: Record<Exclude<AuthRole, "admin">, string> = {
  rahul: "patagonia",
  george: "arvind",
  maria: "control-union",
};

export function getOrgForUser(role: AuthRole): EcosystemOrg | null {
  if (role === "admin") return null;
  const id = ROLE_ORG[role];
  return ORGS.find((o) => o.id === id) ?? null;
}

export type PartnerLink = {
  org: EcosystemOrg;
  edge: EcosystemEdge;
  direction: "in" | "out";
  kind: EcosystemEdge["kind"];
};

export function getPartners(orgId: string): PartnerLink[] {
  const out: PartnerLink[] = [];
  for (const e of EDGES) {
    if (e.from === orgId) {
      const o = ORGS.find((x) => x.id === e.to);
      if (o) out.push({ org: o, edge: e, direction: "out", kind: e.kind });
    } else if (e.to === orgId) {
      const o = ORGS.find((x) => x.id === e.from);
      if (o) out.push({ org: o, edge: e, direction: "in", kind: e.kind });
    }
  }
  // de-dupe by org id (keep strongest)
  const map = new Map<string, PartnerLink>();
  for (const p of out) {
    const prev = map.get(p.org.id);
    if (!prev || prev.edge.strength < p.edge.strength) map.set(p.org.id, p);
  }
  return [...map.values()];
}

export function getPartnerIds(orgId: string): Set<string> {
  const ids = new Set<string>([orgId]);
  for (const p of getPartners(orgId)) ids.add(p.org.id);
  return ids;
}

export function getRiskSignals(orgId: string) {
  const partners = getPartners(orgId);
  const highRiskPartners = partners.filter((p) => p.org.risk > 0.5);
  const lowConfidencePartners = partners.filter((p) => p.org.confidence < 0.6);
  const flaggedPartners = partners.filter((p) => p.org.status === "Flagged");
  const missingEvidenceEdges = partners.filter((p) => p.edge.evidenceCount === 0);
  const avgPartnerRisk = partners.length
    ? partners.reduce((s, p) => s + p.org.risk, 0) / partners.length
    : 0;
  const avgPartnerConfidence = partners.length
    ? partners.reduce((s, p) => s + p.org.confidence, 0) / partners.length
    : 0;
  return {
    partners,
    highRiskPartners,
    lowConfidencePartners,
    flaggedPartners,
    missingEvidenceEdges,
    avgPartnerRisk,
    avgPartnerConfidence,
  };
}

export function getIncomingVerifications(orgId: string) {
  return EDGES.filter((e) => e.kind === "verification" && e.to === orgId)
    .map((e) => {
      const verifier = ORGS.find((o) => o.id === e.from);
      return verifier ? { verifier, edge: e } : null;
    })
    .filter((x): x is { verifier: EcosystemOrg; edge: EcosystemEdge } => !!x);
}

export function getTopMatchSuggestions(orgId: string, n = 5, settings?: MatchSettings) {
  const s = settings ?? loadSettings();
  const partnerIds = getPartnerIds(orgId);
  return topMatches(orgId, s, 30).filter((m) => !partnerIds.has(m.org.id)).slice(0, n);
}

export function getPrimaryUserForOrg(orgId: string): EcosystemUser | undefined {
  return USERS.find((u) => u.orgId === orgId);
}
