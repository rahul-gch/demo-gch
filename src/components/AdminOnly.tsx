import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useIsPlatformAdmin } from "@/lib/use-platform-admin";

/** Temporarily restricts a feature to platform admins. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useIsPlatformAdmin();
  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!isAdmin)
    return (
      <div className="mx-auto mt-16 max-w-md rounded-lg border bg-card p-8 text-center">
        <Lock className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
        <h2 className="text-base font-semibold">Coming soon</h2>
        <p className="mt-1 text-sm text-muted-foreground">This feature is not available for your workspace yet.</p>
      </div>
    );
  return <>{children}</>;
}
