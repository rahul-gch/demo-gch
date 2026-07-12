import type { Entity } from "./types";

function seed(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

export type AuditStatus = "Passed" | "Minor NC" | "Major NC" | "Expired";
export interface SocialAudit {
  id: string;
  standard: string;
  auditor: string;
  scope: string;
  auditDate: string;
  nextDue: string;
  status: AuditStatus;
}

export type TCStatus = "Issued" | "Pending" | "Void";
export interface TransactionCert {
  id: string;
  number: string;
  standard: string;
  issuedBy: string;
  issueDate: string;
  products: string;
  buyer: string;
  status: TCStatus;
}

const SOCIAL_STANDARDS = [
  { standard: "SMETA 4-Pillar", auditor: "SGS" },
  { standard: "SLCP", auditor: "Bureau Veritas" },
  { standard: "amfori BSCI", auditor: "Intertek" },
  { standard: "Higg FSLM", auditor: "SLCP Verifier" },
  { standard: "WRAP", auditor: "WRAP Certified Auditor" },
  { standard: "Sedex SMETA 2-Pillar", auditor: "TÜV Rheinland" },
];

const TC_STANDARDS = ["GOTS TC", "GRS TC", "RCS TC", "OCS TC"];
const TC_ISSUERS = ["Control Union", "CU Inspections", "Ecocert", "ICEA"];
const BUYERS = ["Nike Inc.", "H&M Group", "Primark", "Marks & Spencer", "Zalando", "Puma"];

export function getMockSocialAudits(e: Entity): SocialAudit[] {
  const rand = seed(e.id + ":audits");
  const count = 3 + Math.floor(rand() * 3);
  const facility = e.city || e.country || "Main facility";
  const out: SocialAudit[] = [];
  for (let i = 0; i < count; i++) {
    const src = SOCIAL_STANDARDS[Math.floor(rand() * SOCIAL_STANDARDS.length)];
    const year = 2025 - Math.floor(rand() * 2);
    const m = 1 + Math.floor(rand() * 12);
    const d = 1 + Math.floor(rand() * 27);
    const auditDate = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const nextYear = year + 1;
    const nextDue = `${nextYear}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const r = rand();
    const status: AuditStatus =
      r > 0.8 ? "Major NC" : r > 0.6 ? "Minor NC" : new Date(nextDue) < new Date() ? "Expired" : "Passed";
    out.push({
      id: `${e.id}-audit-${i}`,
      standard: src.standard,
      auditor: src.auditor,
      scope: `${facility} — Unit ${i + 1}`,
      auditDate,
      nextDue,
      status,
    });
  }
  return out;
}

export function getMockTransactionCerts(e: Entity): TransactionCert[] {
  const rand = seed(e.id + ":tc");
  const count = 4 + Math.floor(rand() * 3);
  const materials = e.materials.length ? e.materials : ["Organic Cotton", "Recycled Polyester"];
  const out: TransactionCert[] = [];
  for (let i = 0; i < count; i++) {
    const standard = TC_STANDARDS[Math.floor(rand() * TC_STANDARDS.length)];
    const issuedBy = TC_ISSUERS[Math.floor(rand() * TC_ISSUERS.length)];
    const buyer = BUYERS[Math.floor(rand() * BUYERS.length)];
    const year = 2026;
    const m = 1 + Math.floor(rand() * 6);
    const d = 1 + Math.floor(rand() * 27);
    const issueDate = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const num = `${standard.split(" ")[0]}-${year}-${String(1000 + Math.floor(rand() * 8999))}`;
    const r = rand();
    const status: TCStatus = r > 0.85 ? "Pending" : r > 0.95 ? "Void" : "Issued";
    out.push({
      id: `${e.id}-tc-${i}`,
      number: num,
      standard,
      issuedBy,
      issueDate,
      products: materials.slice(0, 1 + Math.floor(rand() * 2)).join(", "),
      buyer,
      status,
    });
  }
  return out;
}

export function daysUntil(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.round((then - now) / (1000 * 60 * 60 * 24));
}

export type ExpiryTone = "ok" | "soon" | "expired";
export function expiryTone(dateStr: string): ExpiryTone {
  const d = daysUntil(dateStr);
  if (d < 0) return "expired";
  if (d < 90) return "soon";
  return "ok";
}
