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

const SIGNED_URL_CACHE = new Map<string, { url: string; expiresAt: number }>();
const IN_FLIGHT_URLS = new Map<string, Promise<string | null>>();

export function clearImageCache(refValue?: string) {
  if (refValue) {
    SIGNED_URL_CACHE.delete(refValue);
  } else {
    SIGNED_URL_CACHE.clear();
  }
}

/** Resolve a stored value using an explicit client (browser or authenticated server client). */
export async function resolveImageWith(client: StorageClient, value: string): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const ref = parseRef(value);
  if (!ref) return null;

  const cacheKey = `${ref.bucket}:${ref.path}`;
  const now = Date.now();
  const cached = SIGNED_URL_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const inFlight = IN_FLIGHT_URLS.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    try {
      // 1 hour validity; cache for 50 minutes so it stays valid and avoids cache-busting
      const { data } = await client.storage.from(ref.bucket).createSignedUrl(ref.path, 60 * 60);
      const url = data?.signedUrl ?? null;
      if (url) {
        SIGNED_URL_CACHE.set(cacheKey, { url, expiresAt: Date.now() + 50 * 60 * 1000 });
      }
      return url;
    } catch {
      return null;
    } finally {
      IN_FLIGHT_URLS.delete(cacheKey);
    }
  })();

  IN_FLIGHT_URLS.set(cacheKey, promise);
  return promise;
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
