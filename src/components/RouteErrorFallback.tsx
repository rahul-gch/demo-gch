import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/error-log";
import { isCancelled } from "@/lib/registry";

export function errorMessage(error: unknown): string {
  return "Something went wrong while loading this page.";
}

const RELOAD_FLAG = "gch:cancelled-reload";

export function RouteErrorFallback({ error }: { error?: unknown }) {
  const cancelled = isCancelled(error);

  useEffect(() => {
    // A cancelled load (session restore racing a route guard) is transient:
    // reload once instead of showing the error card.
    if (cancelled && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
      return;
    }
    sessionStorage.removeItem(RELOAD_FLAG);
    reportClientError(error);
  }, [error, cancelled]);

  if (cancelled) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">This page didn't load</h1>
        <p className="text-sm text-muted-foreground">{errorMessage(error)}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => window.location.reload()}>Try again</Button>
          <Button asChild variant="outline">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RouteNotFoundFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This page doesn't exist, or you don't have access to it.
        </p>
        <Button asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
