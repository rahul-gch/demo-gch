import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lookupInvite } from "@/lib/invites.functions";
import { lookupPlatformInvite } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function extractToken(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "invite" || p === "onboarding");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
      return parts[parts.length - 1] ?? null;
    } catch {
      return null;
    }
  }
  // Bare token — strip any accidental path prefix
  const parts = v.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

function statusMessage(status: string): string {
  switch (status) {
    case "expired":
      return "This invite has expired. Ask the sender for a new one.";
    case "revoked":
      return "This invite was revoked. Ask the sender for a new one.";
    case "used":
      return "This invite has already been used.";
    default:
      return "This invite is no longer valid.";
  }
}

export function JoinWithInviteForm() {
  const nav = useNavigate();
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupOrgInvite = useServerFn(lookupInvite);
  const lookupPlatform = useServerFn(lookupPlatformInvite);

  const submit = async () => {
    const token = extractToken(value);
    if (!token) {
      setError("Enter an invite link or token");
      return;
    }
    setChecking(true);
    setError(null);
    try {
      // Try the organization invite first, then the platform invite. The token
      // itself decides the destination — never the shape of the pasted URL.
      const org = await lookupOrgInvite({ data: { token } }).catch(() => null);
      if (org) {
        if (org.status !== "active") {
          setError(statusMessage(org.status));
          return;
        }
        nav({ to: "/invite/$token", params: { token } });
        return;
      }

      const platform = await lookupPlatform({ data: { token } }).catch(() => null);
      if (platform) {
        if (platform.status !== "active") {
          setError(statusMessage(platform.status));
          return;
        }
        nav({ to: "/onboarding/$token", params: { token } });
        return;
      }

      setError("We couldn't find that invite. Check the link or ask the sender to resend it.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not check that invite";
      setError(message);
      toast.error(message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="invite">Invite link or token</Label>
        <Input
          id="invite"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && !checking && submit()}
          placeholder="https://…/invite/abc123 or abc123"
        />
        <p className="text-xs text-muted-foreground">
          Works with both organization invites and invites sent by Global Chain Hub.
        </p>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={submit} disabled={checking}>
          {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {checking ? "Checking…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
