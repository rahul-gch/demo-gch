import { supabase } from "@/integrations/supabase/client";

/**
 * Browser-side error reporting.
 *
 * Failures are written to `app_errors` so admins can see what broke, where and
 * for whom. Reporting is best-effort: it never throws, never blocks a user
 * flow, and is both deduped and capped so an error loop can't flood the table.
 */

const MAX_REPORTS_PER_PAGE_LOAD = 10;
const seen = new Set<string>();
let sent = 0;

const SENSITIVE = /(pass(word)?|token|secret|api[-_]?key|bearer|session|credential|authorization)/gi;

function scrub(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.replace(SENSITIVE, "[redacted]").slice(0, 4000);
}

/** Strips the query string, which frequently carries tokens or emails. */
function safeRoute(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    return `${url.pathname}${url.hash}`;
  } catch {
    return null;
  }
}

function toMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  try {
    return JSON.stringify(error)?.slice(0, 500) ?? "Unknown error";
  } catch {
    return "Unknown error";
  }
}

/** Fire-and-forget client error report. */
export function reportClientError(error: unknown, extra?: { route?: string }): void {
  if (typeof window === "undefined") return;
  try {
    const message = scrub(toMessage(error)) ?? "Unknown error";
    // Ignore noisy, non-actionable browser/extension errors.
    if (/ResizeObserver loop|Load failed|NetworkError when attempting/i.test(message)) return;

    const route = extra?.route ?? safeRoute();
    const key = `${message}::${route ?? ""}`;
    if (seen.has(key)) return;
    if (sent >= MAX_REPORTS_PER_PAGE_LOAD) return;
    seen.add(key);
    sent += 1;

    const stack = scrub(error instanceof Error ? error.stack : null);
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null;

    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        await supabase.from("app_errors").insert({
          source: "browser",
          message,
          stack,
          route,
          user_id: data.user?.id ?? null,
          user_agent: userAgent,
        });
      } catch {
        /* logging is best-effort */
      }
    })();
  } catch {
    /* logging must never break the app */
  }
}

let installed = false;

/** Installs global window listeners once (called from the root component). */
export function installGlobalErrorReporting(): () => void {
  if (typeof window === "undefined" || installed) return () => {};
  installed = true;

  const onError = (event: ErrorEvent) => reportClientError(event.error ?? event.message);
  const onRejection = (event: PromiseRejectionEvent) => reportClientError(event.reason);

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    installed = false;
  };
}
