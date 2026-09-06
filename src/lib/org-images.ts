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

export interface ThumbnailOptions {
  width?: number;
  quality?: number;
}

/**
 * Derives a properly resized, anti-aliased thumbnail URL from an image URL.
 * Prevents moiré/wavy distortion artifacts on fine fabric patterns when displayed in showroom cards.
 * Never crops the image; preserves full framing and original aspect ratio.
 */
export function getOptimizedThumbnailUrl(
  url: string | null | undefined,
  options: ThumbnailOptions = {},
): string | null {
  if (!url || typeof url !== "string") return null;
  const width = options.width ?? 480;
  const quality = options.quality ?? 80;

  try {
    const parsed = new URL(url);

    // 1. Unsplash (Imgix CDN)
    if (parsed.hostname.includes("images.unsplash.com") || parsed.hostname.includes("unsplash.com")) {
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", String(quality));
      parsed.searchParams.set("auto", "format");
      // Use fit=max so the image scales cleanly without cropping
      parsed.searchParams.set("fit", "max");
      parsed.searchParams.delete("h");
      parsed.searchParams.delete("crop");
      return parsed.toString();
    }

    // 2. Supabase Storage URLs (supports transformation endpoint)
    if (parsed.pathname.includes("/storage/v1/object/public/")) {
      const transformPath = parsed.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/",
      );
      parsed.pathname = transformPath;
      parsed.searchParams.set("width", String(width));
      parsed.searchParams.set("quality", String(quality));
      parsed.searchParams.set("resize", "contain");
      return parsed.toString();
    }

    if (parsed.pathname.includes("/storage/v1/object/sign/")) {
      const transformPath = parsed.pathname.replace(
        "/storage/v1/object/sign/",
        "/storage/v1/render/image/sign/",
      );
      parsed.pathname = transformPath;
      parsed.searchParams.set("width", String(width));
      parsed.searchParams.set("quality", String(quality));
      parsed.searchParams.set("resize", "contain");
      return parsed.toString();
    }

    // 3. URLs with existing width query parameters (e.g. w=, width=)
    if (parsed.searchParams.has("w")) {
      parsed.searchParams.set("w", String(width));
      return parsed.toString();
    }
    if (parsed.searchParams.has("width")) {
      parsed.searchParams.set("width", String(width));
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Returns an uncropped, high-resolution display URL for detail pages.
 */
export function getOptimizedHighResUrl(
  url: string | null | undefined,
  options: ThumbnailOptions = {},
): string | null {
  if (!url || typeof url !== "string") return null;
  const width = options.width ?? 1400;
  const quality = options.quality ?? 85;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("images.unsplash.com") || parsed.hostname.includes("unsplash.com")) {
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", String(quality));
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "max");
      parsed.searchParams.delete("h");
      parsed.searchParams.delete("crop");
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

/** Resolve a thumbnail stored value using an explicit client or URL transformation. */
export async function resolveThumbnailWith(
  client: StorageClient,
  value: string,
  width = 480,
): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    return getOptimizedThumbnailUrl(value, { width });
  }
  const ref = parseRef(value);
  if (!ref) return null;

  const cacheKey = `${ref.bucket}:${ref.path}:thumb:${width}`;
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
      const { data } = await (client.storage.from(ref.bucket) as any).createSignedUrl(
        ref.path,
        60 * 60,
        {
          transform: {
            width,
            quality: 80,
            resize: "contain",
          },
        },
      );
      let url = data?.signedUrl ?? null;
      if (!url) {
        url = await resolveImageWith(client, value);
        if (url) url = getOptimizedThumbnailUrl(url, { width }) ?? url;
      }
      if (url) {
        SIGNED_URL_CACHE.set(cacheKey, { url, expiresAt: Date.now() + 50 * 60 * 1000 });
      }
      return url;
    } catch {
      const fallbackUrl = await resolveImageWith(client, value);
      return fallbackUrl ? getOptimizedThumbnailUrl(fallbackUrl, { width }) ?? fallbackUrl : null;
    } finally {
      IN_FLIGHT_URLS.delete(cacheKey);
    }
  })();

  IN_FLIGHT_URLS.set(cacheKey, promise);
  return promise;
}

export async function resolveThumbnailsWith(
  client: StorageClient,
  values: string[],
  width = 480,
): Promise<(string | null)[]> {
  return Promise.all(values.map((v) => resolveThumbnailWith(client, v, width)));
}

