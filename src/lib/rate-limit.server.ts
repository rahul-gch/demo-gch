export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

// Periodic cleanup of expired records every 5 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const store of stores.values()) {
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) {
        store.delete(key);
      }
    }
  }
}, 300_000);

if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
  (cleanupTimer as { unref: () => void }).unref();
}

/**
 * Checks whether an identifier has exceeded the rate limit.
 * Returns whether the request is allowed and remaining allowance.
 */
export function checkRateLimit(
  namespace: string,
  identifier: string,
  options: RateLimitOptions = { windowMs: 60_000, max: 15 },
): { success: boolean; remaining: number; resetAt: number } {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }

  const now = Date.now();
  const record = store.get(identifier);

  if (!record || now > record.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + options.windowMs });
    return { success: true, remaining: options.max - 1, resetAt: now + options.windowMs };
  }

  if (record.count >= options.max) {
    return { success: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { success: true, remaining: options.max - record.count, resetAt: record.resetAt };
}

/**
 * Throws an error if the identifier has exceeded the rate limit.
 */
export function assertRateLimit(
  namespace: string,
  identifier: string,
  options: RateLimitOptions = { windowMs: 60_000, max: 15 },
) {
  const result = checkRateLimit(namespace, identifier, options);
  if (!result.success) {
    const waitSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    throw new Error(`Too many attempts. Please wait ${waitSec} seconds before trying again.`);
  }
}

/**
 * Extracts client IP from incoming TanStack Start request headers.
 */
export async function getClientIp(): Promise<string> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    if (!req) return "127.0.0.1";
    // Prefer headers set by the deployment proxy. x-forwarded-for is last
    // because a client can forge it when the app is reached directly.
    return (
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "127.0.0.1"
    );
  } catch {
    return "127.0.0.1";
  }
}
