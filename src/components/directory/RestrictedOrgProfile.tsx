import { Lock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useActingOrgId } from "@/lib/use-comms";
import { useRequestConnection } from "@/lib/org-connections";
import { toast } from "sonner";

interface Props {
  /** Null when the viewer has no existing relationship with the hidden org. */
  orgUuid: string | null;
  name: string | null;
  logoUrl: string | null;
}

/**
 * Shown when a signed-in user opens an organization that a platform admin has
 * hidden from public discovery. No profile data is loaded for this view.
 * Without an existing relationship the organization stays anonymous — only a
 * generic "private organization" card is shown.
 */
export function RestrictedOrgProfile({ orgUuid, name, logoUrl }: Props) {
  const actingOrgId = useActingOrgId();
  const requestMutation = useRequestConnection();

  const known = orgUuid !== null && name !== null;

  const handleConnect = () => {
    if (!orgUuid || !name) return;
    if (!actingOrgId) {
      toast.error("Join or create an organization first.");
      return;
    }
    requestMutation.mutate(
      { fromOrgId: actingOrgId, toOrgId: orgUuid },
      { onSuccess: () => toast.success(`Connection request sent to ${name}`) },
    );
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-4">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          {known && logoUrl ? (
            <img
              src={logoUrl}
              alt={name ?? ""}
              className="h-14 w-14 rounded-lg border object-contain p-1"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold tracking-tight">
              {known ? name : "Private organization"}
            </h1>
            <p className="text-sm text-muted-foreground">
              This organization profile is private. Only connected partners can view their
              capabilities, showroom and supply chain data.
            </p>
          </div>
          {known && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleConnect}
              disabled={requestMutation.isPending}
            >
              <UserPlus className="h-4 w-4" /> Request connection
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
