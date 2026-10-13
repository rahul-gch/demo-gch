import { supabase } from "@/integrations/supabase/client";

export const VERIFICATION_MAX_BYTES = 10 * 1024 * 1024;
export const VERIFICATION_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export type VerificationStatus = "not_submitted" | "pending" | "verified" | "rejected";

/** Returns an error message, or null when the file is acceptable. */
export function validateVerificationFile(file: { size: number; type: string }): string | null {
  if (!VERIFICATION_TYPES.includes(file.type)) return "Upload a PDF, JPG or PNG file";
  if (file.size > VERIFICATION_MAX_BYTES) return "File must be 10 MB or smaller";
  return null;
}

/** Signup may continue only with a valid document or the "upload later" choice. */
export function verificationChoiceValid(file: { size: number; type: string } | null, later: boolean) {
  if (later) return true;
  return !!file && validateVerificationFile(file) === null;
}

/** Only platform admins may set a reviewed status. */
export function canSetVerificationStatus(status: VerificationStatus, isAdmin: boolean) {
  return isAdmin || status === "not_submitted" || status === "pending";
}

// ---- Holding the signup file until the account is confirmed (IndexedDB) ----
const DB = "gch-pending";
const STORE = "files";
const KEY = "verification";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function stashPendingVerificationFile(file: File | null) {
  try {
    const db = await openDb();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      if (file) tx.objectStore(STORE).put(file, KEY);
      else tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch {
    /* storage unavailable — user can upload from the workspace */
  }
}

export async function takePendingVerificationFile(): Promise<File | null> {
  try {
    const db = await openDb();
    const file = await new Promise<File | null>((res) => {
      const req = db.transaction(STORE).objectStore(STORE).get(KEY);
      req.onsuccess = () => res((req.result as File) ?? null);
      req.onerror = () => res(null);
    });
    await stashPendingVerificationFile(null);
    return file;
  } catch {
    return null;
  }
}

// ---- Data access (RLS enforces who can do what) ----
export async function getVerification(orgId: string) {
  const { data } = await supabase.from("org_verification").select("*").eq("org_id", orgId).maybeSingle();
  return data;
}

export async function submitVerificationDocument(orgId: string, file: File) {
  const err = validateVerificationFile(file);
  if (err) throw new Error(err);
  const { data: u } = await supabase.auth.getUser();
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${orgId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from("org-verification").upload(path, file, {
    contentType: file.type,
  });
  if (error) throw error;
  const { error: e2 } = await supabase.from("org_verification").upsert({
    org_id: orgId,
    status: "pending",
    document_path: path,
    document_name: file.name.slice(0, 200),
    submitted_by: u.user?.id ?? null,
    submitted_at: new Date().toISOString(),
  });
  if (e2) throw e2;
}

export async function markVerificationLater(orgId: string) {
  await supabase.from("org_verification").upsert({ org_id: orgId, status: "not_submitted" });
}

export async function listPendingVerifications() {
  const { data } = await supabase
    .from("org_verification")
    .select("*, orgs(name, type, country)")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });
  return data ?? [];
}

export async function reviewVerification(orgId: string, status: "verified" | "rejected", note?: string) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("org_verification")
    .update({ status, note: note ?? null, reviewed_by: u.user?.id ?? null, reviewed_at: new Date().toISOString() })
    .eq("org_id", orgId);
  if (error) throw error;
}

export async function verificationDocumentUrl(path: string) {
  const { data } = await supabase.storage.from("org-verification").createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}
