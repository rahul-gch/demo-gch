/**
 * Central policy + security constants.
 *
 * Bump the version strings whenever the legal text changes — consent records
 * store the version that was accepted, so a bump asks users to re-accept.
 */
export const TERMS_VERSION = "2026-08-05";
export const PRIVACY_VERSION = "2026-08-05";
export const MARKETING_CONSENT_VERSION = "2026-08-05";

export type PolicyType = "terms" | "privacy" | "marketing";

export const POLICY_VERSIONS: Record<PolicyType, string> = {
  terms: TERMS_VERSION,
  privacy: PRIVACY_VERSION,
  marketing: MARKETING_CONSENT_VERSION,
};

/* -------------------------------------------------------------------------- */
/* Password policy                                                             */
/* -------------------------------------------------------------------------- */

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES = ["At least 8 characters"] as const;

/** Returns an error message, or null when the password satisfies the policy. */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  return null;
}

export function passwordStrength(password: string): { label: string; tone: string; pct: number } {
  if (!password) return { label: "", tone: "text-muted-foreground", pct: 0 };
  if (password.length < PASSWORD_MIN_LENGTH) return { label: "Too short", tone: "text-destructive", pct: 25 };
  const variety =
    Number(/[a-z]/.test(password) && /[A-Z]/.test(password)) +
    Number(/\d/.test(password)) +
    Number(/[^A-Za-z0-9]/.test(password)) +
    Number(password.length >= 12);
  if (variety <= 1) return { label: "Good", tone: "text-amber-600", pct: 55 };
  if (variety <= 2) return { label: "Strong", tone: "text-emerald-600", pct: 80 };
  return { label: "Very strong", tone: "text-emerald-700", pct: 100 };
}

/* -------------------------------------------------------------------------- */
/* Upload policy — documents & certificates are private by default             */
/* -------------------------------------------------------------------------- */

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

export const ALLOWED_DOCUMENT_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "text/csv": [".csv"],
};

export const ALLOWED_DOCUMENT_EXTENSIONS = Object.values(ALLOWED_DOCUMENT_TYPES).flat();

/** Client-side guard. Storage RLS remains the authoritative access control. */
export function validateUploadFile(
  file: File,
  opts?: { extensions?: string[]; maxBytes?: number },
): string | null {
  const extensions = opts?.extensions ?? ALLOWED_DOCUMENT_EXTENSIONS;
  const maxBytes = opts?.maxBytes ?? MAX_UPLOAD_BYTES;
  const ext = ("." + (file.name.split(".").pop() ?? "")).toLowerCase();
  if (!extensions.includes(ext)) {
    return `Unsupported file type "${ext}". Allowed: ${extensions.join(", ")}`;
  }
  if (file.size > maxBytes) {
    return `File is too large (${Math.round(file.size / 1024 / 1024)} MB). Maximum is ${Math.round(
      maxBytes / 1024 / 1024,
    )} MB.`;
  }
  if (file.size === 0) return "File appears to be empty";
  return null;
}

/** Sanitises a filename before it becomes a storage object key. */
export function safeFileName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-120);
}
