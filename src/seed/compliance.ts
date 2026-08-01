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
export type Severity = "Info" | "Minor" | "Major" | "Critical";

export interface AuditFinding {
  id: string;
  title: string;
  area: string;
  severity: Severity;
  description: string;
  correctiveAction: string;
  dueDate: string;
  status: "Open" | "In progress" | "Closed";
}

export interface AuditDocument {
  name: string;
  type: "PDF" | "XLSX" | "Image";
  size: string;
  uploadedAt: string;
}

export interface SocialAudit {
  id: string;
  standard: string;
  auditor: string;
  scope: string;
  auditDate: string;
  nextDue: string;
  status: AuditStatus;
  score: number;
  findings: AuditFinding[];
  documents: AuditDocument[];
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
  weightKg: number;
  documents: AuditDocument[];
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

const FINDING_TEMPLATES = [
  { title: "Overtime records incomplete", area: "Working hours", severity: "Minor" as Severity, action: "Implement daily digital timekeeping." },
  { title: "Fire extinguisher inspection overdue", area: "Health & safety", severity: "Major" as Severity, action: "Complete inspection and monthly log." },
  { title: "PPE not consistently worn in dye area", area: "Health & safety", severity: "Minor" as Severity, action: "Reinforce PPE policy with supervisor spot-checks." },
  { title: "Wage payment slips missing signatures", area: "Wages & benefits", severity: "Minor" as Severity, action: "Digitize slip acknowledgement." },
  { title: "Grievance mechanism not clearly communicated", area: "Worker voice", severity: "Info" as Severity, action: "Post multi-lingual grievance posters." },
  { title: "Chemical inventory MSDS gaps", area: "Chemicals", severity: "Major" as Severity, action: "Update MSDS binder; retrain staff." },
  { title: "Emergency exit partially blocked", area: "Fire safety", severity: "Critical" as Severity, action: "Immediate clearance and daily inspection." },
  { title: "Waste segregation inconsistent", area: "Environment", severity: "Minor" as Severity, action: "Add color-coded bins and signage." },
];

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function getMockSocialAudits(e: Entity): SocialAudit[] {
  if (e.isSeeded !== true) return [];
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
    const baseScore = status === "Passed" ? 85 + Math.floor(rand() * 13) : status === "Minor NC" ? 65 + Math.floor(rand() * 15) : 45 + Math.floor(rand() * 20);

    const nFindings = 2 + Math.floor(rand() * 4);
    const findings: AuditFinding[] = [];
    for (let f = 0; f < nFindings; f++) {
      const t = pick(rand, FINDING_TEMPLATES);
      const sev: Severity = status === "Major NC" && f === 0 ? "Major" : status === "Minor NC" ? "Minor" : t.severity;
      const dueM = 1 + Math.floor(rand() * 12);
      const dueD = 1 + Math.floor(rand() * 27);
      findings.push({
        id: `${e.id}-audit-${i}-f-${f}`,
        title: t.title,
        area: t.area,
        severity: sev,
        description: `${t.title} observed during ${src.standard} audit at ${facility}.`,
        correctiveAction: t.action,
        dueDate: `${nextYear}-${String(dueM).padStart(2, "0")}-${String(dueD).padStart(2, "0")}`,
        status: rand() > 0.6 ? "Closed" : rand() > 0.5 ? "In progress" : "Open",
      });
    }

    out.push({
      id: `${e.id}-audit-${i}`,
      standard: src.standard,
      auditor: src.auditor,
      scope: `${facility} — Unit ${i + 1}`,
      auditDate,
      nextDue,
      status,
      score: baseScore,
      findings,
      documents: [
        { name: `${src.standard.replace(/\s+/g, "_")}_Report_${auditDate}.pdf`, type: "PDF", size: `${(0.8 + rand() * 3).toFixed(1)} MB`, uploadedAt: auditDate },
        { name: `Corrective_Action_Plan_${auditDate}.xlsx`, type: "XLSX", size: `${(0.1 + rand() * 0.4).toFixed(2)} MB`, uploadedAt: auditDate },
      ],
    });
  }
  return out;
}

export function getMockTransactionCerts(e: Entity): TransactionCert[] {
  if (e.isSeeded !== true) return [];
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
    const status: TCStatus = r > 0.95 ? "Void" : r > 0.85 ? "Pending" : "Issued";
    out.push({
      id: `${e.id}-tc-${i}`,
      number: num,
      standard,
      issuedBy,
      issueDate,
      products: materials.slice(0, 1 + Math.floor(rand() * 2)).join(", "),
      buyer,
      status,
      weightKg: Math.round(1000 + rand() * 20000),
      documents: [
        { name: `${num}.pdf`, type: "PDF", size: `${(0.2 + rand() * 1).toFixed(2)} MB`, uploadedAt: issueDate },
      ],
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

export function scoreTone(score: number): "ok" | "amber" | "red" {
  if (score >= 85) return "ok";
  if (score >= 65) return "amber";
  return "red";
}
