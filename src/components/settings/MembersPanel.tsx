import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Copy, Link as LinkIcon, Mail, Trash2, X, ShieldAlert, Crown, Shield, LogOut } from "lucide-react";
import {
  createInvite,
  listInvites,
  listMembers,
  removeMember,
  revokeInvite,
  updateMemberRole,
} from "@/lib/invites.functions";
import { leaveOrganizationFn } from "@/lib/orgs.functions";
import { useOrgRole } from "@/lib/use-org-role";

type Role = "owner" | "admin" | "editor" | "viewer";
const ROLES: Role[] = ["owner", "admin", "editor", "viewer"];

export function MembersPanel({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { isOwner, isAdmin, canManage } = useOrgRole(orgId);

  const members = useQuery({
    queryKey: ["members", orgId],
    queryFn: () => listMembers({ data: { orgId } }),
  });
  const invites = useQuery({
    queryKey: ["invites", orgId],
    queryFn: () => listInvites({ data: { orgId } }),
    enabled: canManage,
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
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const roleMut = useMutation({
    mutationFn: (v: { id: string; role: Role }) => updateMemberRole({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", orgId] });
      toast.success("Role updated");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => removeMember({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", orgId] });
      toast.success("Member removed");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const leaveMut = useMutation({
    mutationFn: () => leaveOrganizationFn({ data: { orgId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orgs"] });
      qc.invalidateQueries({ queryKey: ["my-org-memberships-gate"] });
      toast.success("You have left the organization");
      nav({ to: "/", replace: true });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to leave"),
  });

  const copy = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {!canManage && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            You have standard member access. Only Organization <strong>Owners</strong> and <strong>Admins</strong> can invite new members or change team roles.
          </span>
        </div>
      )}

      {canManage && (
        <>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Invite by email</CardTitle>
              <CardDescription className="text-xs">
                Send a direct email invitation to a team member or contractor.
              </CardDescription>
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
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Assigned Role
                </Label>
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
                  disabled={!email || createMut.isPending}
                  onClick={() => {
                    createMut.mutate({ email, role, maxUses: 1 });
                    setEmail("");
                  }}
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
              <CardDescription className="text-xs">
                Generate a multi-use onboarding link for onboarding multiple partners or auditors.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-[160px_140px_auto]">
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
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Max uses</Label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={linkMaxUses}
                  onChange={(e) => setLinkMaxUses(Number(e.target.value) || 1)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  disabled={createMut.isPending}
                  onClick={() => createMut.mutate({ email: null, role: linkRole, maxUses: linkMaxUses })}
                  className="w-full md:w-auto"
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Generate link
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {canManage && invites.data && invites.data.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Active &amp; Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {invites.data.map((inv) => {
                const isExpired = new Date(inv.expires_at) < new Date();
                const isRevoked = !!inv.revoked_at;
                return (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {inv.email || "Shareable link"}
                        </span>
                        <Badge variant="outline" className="capitalize text-xs font-mono">
                          {inv.role}
                        </Badge>
                        {isRevoked && <Badge variant="destructive">Revoked</Badge>}
                        {!isRevoked && isExpired && (
                          <Badge variant="secondary">Expired</Badge>
                        )}
                        {!isRevoked && !isExpired && (
                          <span className="text-xs text-muted-foreground">
                            {inv.uses} / {inv.max_uses} used
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isRevoked && !isExpired && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copy(inv.token)}
                            title="Copy link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => revokeMut.mutate(inv.id)}
                            title="Revoke"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-semibold">Team Members</CardTitle>
            <CardDescription className="text-xs">
              All active users with workspace permissions for this company.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {members.data?.length ?? 0} Members
          </Badge>
        </CardHeader>
        <CardContent>
          {members.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading team members…</p>
          ) : members.data && members.data.length > 0 ? (
            <ul className="divide-y">
              {members.data.map((m) => {
                const isTargetOwner = m.role === "owner";
                const canModifyThisMember = canManage && (!isTargetOwner || isOwner);

                return (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {m.display_name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-foreground">{m.display_name}</p>
                          {isTargetOwner && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              <Crown className="h-3 w-3" /> Owner
                            </span>
                          )}
                        </div>
                        {m.title && <p className="text-xs text-muted-foreground">{m.title}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canModifyThisMember ? (
                        <Select
                          value={m.role}
                          onValueChange={(v) => roleMut.mutate({ id: m.id, role: v as Role })}
                          disabled={roleMut.isPending}
                        >
                          <SelectTrigger className="h-8 w-32 capitalize text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r} className="capitalize text-xs">
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="capitalize text-xs font-mono px-2.5 py-1">
                          {m.role}
                        </Badge>
                      )}

                      {canModifyThisMember && !isTargetOwner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMut.mutate(m.id)}
                          disabled={removeMut.isPending}
                          title="Remove member"
                        >
                          <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No members found.</p>
          )}
        </CardContent>
      </Card>

      {!isOwner && (
        <Card className="border-destructive/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Leave Organization
            </CardTitle>
            <CardDescription className="text-xs">
              Revoke your membership and remove this workspace from your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              size="sm"
              disabled={leaveMut.isPending}
              onClick={() => {
                if (window.confirm("Are you sure you want to leave this organization?")) {
                  leaveMut.mutate();
                }
              }}
            >
              {leaveMut.isPending ? "Leaving…" : "Leave Organization"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
