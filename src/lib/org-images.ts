import { supabase } from "@/integrations/supabase/client";

/**
 * Branding images are stored in private buckets, so stored values are either
 * a full https URL (legacy / external) or a `bucket:path` reference that we
 * resolve to a short-lived signed URL in the browser.
 */
export const LOGO_BUCKET = "org-logos";
export const BANNER_BUCKET = "org-banners";

export function makeRef(bucket: string, path: string) {
  return `${bucket}:${path}`;
}

export function parseRef(value: string): { bucket: string; path: string } | null {
  const idx = value.indexOf(":");
  if (idx < 0) return null;
  const bucket = value.slice(0, idx);
  const path = value.slice(idx + 1);
  if (bucket !== LOGO_BUCKET && bucket !== BANNER_BUCKET) return null;
  return { bucket, path };
}

export async function resolveImage(value: string): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const ref = parseRef(value);
  if (!ref) return null;
  const { data } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function resolveImages(values: string[]): Promise<string[]> {
  const out = await Promise.all(values.map((v) => resolveImage(v)));
  return out.filter((u): u is string => !!u);
}
