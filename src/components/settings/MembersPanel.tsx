import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Link as LinkIcon, Mail, Trash2, X } from "lucide-react";
import {
  createInvite,
  listInvites,
  listMembers,
  removeMember,
  revokeInvite,
  updateMemberRole,
} from "@/lib/invites.functions";

type Role = "owner" | "admin" | "editor" | "viewer";
const ROLES: Role[] = ["owner", "admin", "editor", "viewer"];

export function MembersPanel({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const members = useQuery({
    queryKey: ["members", orgId],
    queryFn: () => listMembers({ data: { orgId } }),
  });
  const invites = useQuery({
    queryKey: ["invites", orgId],
    queryFn: () => listInvites({ data: { orgId } }),
  });

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [linkRole, setLinkRole] = useState<Role>("viewer");
  const [linkMaxUses, setLinkMaxUses] = useState<number>(10);

  const createMut = useMutation({
    mutationFn: async (payload: { email: string | null; role: Role; maxUses: number }) =>
      createInvite({
        data: {
          orgId,
          email: payload.email,
          role: payload.role,
          maxUses: payload.maxUses,
          expiresInDays: 14,
        },
      }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["invites", orgId] });
      const url = `${window.location.origin}/invite/${row.token}`;
      navigator.clipboard?.writeText(url).catch(() => {});
      toast.success(row.email ? `Invite created for ${row.email}` : "Shareable link copied");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => revokeInvite({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invites", orgId] });
      toast.success("Invite revoked");
    },
  });

  const roleMut = useMutation({
    mutationFn: (v: { id: string; role: Role }) => updateMemberRole({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", orgId] });
      toast.success("Role updated");
    },
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => removeMember({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", orgId] });
      toast.success("Member removed");
    },
  });

  const copy = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast.success("Link copied");
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Invite by email</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Email address
            </Label>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                if (!email.includes("@")) {
                  toast.error("Enter a valid email");
                  return;
                }
                createMut.mutate({ email, role, maxUses: 1 });
                setEmail("");
              }}
              disabled={createMut.isPending}
              className="w-full md:w-auto"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send invite
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Shareable invite link</CardTitle>
          <p className="text-xs text-muted-foreground">
            Anyone with the link can join this organization with the selected role.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[180px_140px_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Role</Label>
            <Select value={linkRole} onValueChange={(v) => setLinkRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Max uses
            </Label>
            <Input
              type="number"
              min={1}
              max={500}
              value={linkMaxUses}
              onChange={(e) => setLinkMaxUses(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() =>
                createMut.mutate({ email: null, role: linkRole, maxUses: linkMaxUses })
              }
              disabled={createMut.isPending}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Generate link
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Pending invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {invites.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : invites.data && invites.data.length > 0 ? (
            <ul className="divide-y">
              {invites.data.map((inv) => {
                const status = inv.revoked_at
                  ? "revoked"
                  : new Date(inv.expires_at) < new Date()
                    ? "expired"
                    : inv.uses >= inv.max_uses
                      ? "used"
                      : "active";
                return (
                  <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{inv.email ?? "Shareable link"}</p>
                      <p className="text-xs text-muted-foreground">
                        Role: <span className="capitalize">{inv.role}</span> · {inv.uses}/
                        {inv.max_uses} used · expires{" "}
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        status === "active"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : status === "expired"
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : "border-slate-200 bg-slate-100 text-slate-700"
                      }
                    >
                      {status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copy(inv.token)}
                        title="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {status === "active" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => revokeMut.mutate(inv.id)}
                          title="Revoke"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No pending invitations.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Members</CardTitle>
        </CardHeader>
        <CardContent>
          {members.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : members.data && members.data.length > 0 ? (
            <ul className="divide-y">
              {members.data.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.display_name}</p>
                    {m.title && <p className="text-xs text-muted-foreground">{m.title}</p>}
                  </div>
                  <Select
                    value={m.role}
                    onValueChange={(v) => roleMut.mutate({ id: m.id, role: v as Role })}
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="capitalize">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMut.mutate(m.id)}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
