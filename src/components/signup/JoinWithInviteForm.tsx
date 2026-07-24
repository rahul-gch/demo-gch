import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function extractToken(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  // Full URL — grab last segment
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.lastIndexOf("invite");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
      return parts[parts.length - 1] ?? null;
    } catch {
      return null;
    }
  }
  return v;
}

export function JoinWithInviteForm() {
  const nav = useNavigate();
  const [value, setValue] = useState("");

  const submit = () => {
    const token = extractToken(value);
    if (!token) {
      toast.error("Enter an invite link or token");
      return;
    }
    nav({ to: "/invite/$token", params: { token } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="invite">Invite link or token</Label>
        <Input
          id="invite"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="https://…/invite/abc123 or abc123"
        />
        <p className="text-xs text-muted-foreground">
          Ask an admin of the organization to send you an invite link.
        </p>
      </div>
      <div className="flex justify-end">
        <Button onClick={submit}>Continue</Button>
      </div>
    </div>
  );
}
