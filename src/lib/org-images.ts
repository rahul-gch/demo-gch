import { supabase } from "@/integrations/supabase/client";

/**
 * Branding and showroom images are stored in private buckets, so stored values are either
 * a full https URL (legacy / external) or a `bucket:path` reference that we
 * resolve to a short-lived signed URL in the browser.
 */
export const LOGO_BUCKET = "org-logos";
export const BANNER_BUCKET = "org-banners";
export const SHOWROOM_BUCKET = "showroom";

export function makeRef(bucket: string, path: string) {
  return `${bucket}:${path}`;
}

export function parseRef(value: string): { bucket: string; path: string } | null {
  const idx = value.indexOf(":");
  if (idx < 0) return null;
  const bucket = value.slice(0, idx);
  const path = value.slice(idx + 1);
  if (bucket !== LOGO_BUCKET && bucket !== BANNER_BUCKET && bucket !== SHOWROOM_BUCKET) {
    return null;
  }
  return { bucket, path };
}

type StorageClient = {
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number,
      ) => Promise<{ data: { signedUrl: string } | null; error: unknown }>;
    };
  };
};

/** Resolve a stored value using an explicit client (browser or authenticated server client). */
export async function resolveImageWith(client: StorageClient, value: string): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const ref = parseRef(value);
  if (!ref) return null;
  try {
    const { data } = await client.storage.from(ref.bucket).createSignedUrl(ref.path, 60 * 60);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

/** Resolve many values; keeps array positions (null when a value cannot be resolved). */
export async function resolveImagesWith(
  client: StorageClient,
  values: string[],
): Promise<(string | null)[]> {
  return Promise.all(values.map((v) => resolveImageWith(client, v)));
}

export async function resolveImage(value: string): Promise<string | null> {
  return resolveImageWith(supabase, value);
}

export async function resolveImages(values: string[]): Promise<string[]> {
  const out = await resolveImagesWith(supabase, values);
  return out.filter((u): u is string => !!u);
}
