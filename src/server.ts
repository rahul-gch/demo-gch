import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// The client navigated away / closed the tab before SSR finished. Nothing to
// render for and nothing to report — the browser is no longer listening.
function isClientAbort(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; cause?: unknown };
  if (e.name === "AbortError") return true;
  return isClientAbort(e.cause);
}

function abortedResponse(): Response {
  // 499 (client closed request) — never reaches the client anyway.
  return new Response(null, { status: 499 });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  request: Request,
  response: Response,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  const captured = consumeLastCapturedError();
  if (request.signal?.aborted || isClientAbort(captured)) {
    return abortedResponse();
  }

  console.error(captured ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function withSecurityHeaders(response: Response): Response {
  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("text/html")) return response;
  try {
    const r = new Response(response.body, response);
    r.headers.set("X-Content-Type-Options", "nosniff");
    r.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    // Allow the Lovable editor preview to frame the app; block everyone else.
    r.headers.set(
      "Content-Security-Policy",
      "frame-ancestors 'self' https://lovable.dev https://*.lovable.dev https://*.lovable.app",
    );
    return r;
  } catch {
    return response;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(request, response));
    } catch (error) {
      if (request.signal?.aborted || isClientAbort(error)) {
        return abortedResponse();
      }
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
