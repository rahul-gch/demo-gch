import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { VerificationQueue } from "@/components/verification/VerificationQueue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateOrgForm } from "@/components/signup/CreateOrgForm";
import { ORG_TYPES } from "@/lib/org-types";
import {
  amIPlatformAdmin,
  createPlatformInvite,
  listOrgVisibility,
  listPlatformInvites,
  listRecentSignups,
  revokePlatformInvite,
  setOrgVisibility,
} from "@/lib/admin.functions";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";

const TABS = ["signups", "invites", "visibility", "add"] as const;
type TabId = (typeof TABS)[number];

export const Route = createFileRoute("/_authenticated/admin/organizations")({
  validateSearch: (search: Record<string, unknown>): { tab?: TabId } => {
    const t = String(search.tab ?? "");
    return TABS.includes(t as TabId) ? { tab: t as TabId } : {};
  },
  head: () => ({
    meta: [
      { title: "Organization onboarding — Global Chain Hub Admin" },
      {
        name: "description",
        content:
          "Review new organization signups and send onboarding invitations to new organizations.",
      },
      { property: "og:title", content: "Organization onboarding — Global Chain Hub Admin" },
      { property: "og:description", content: "Review new signups and invite new organizations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminOrganizationsPage,
});

function AdminOrganizationsPage() {
  const { tab } = useSearch({ from: "/_authenticated/admin/organizations" });
  const navigate = useNavigate({ from: "/admin/organizations" });
  const checkPlatformAdmin = useServerFn(amIPlatformAdmin);
  const admin = useQuery({ queryKey: ["platform-admin"], queryFn: () => checkPlatformAdmin() });

  return (
    <AppShell>
      <div className="w-full space-y-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Organization onboarding</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            See who just joined, invite new organizations, and add organizations yourself.
          </p>
        </div>

        {admin.isLoading && <p className="text-sm text-muted-foreground">Checking your access…</p>}
        {admin.data && !admin.data.isAdmin && (
          <Card>
            <CardContent className="flex items-start gap-3 py-6">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="min-w-0 text-sm">
                <p className="font-medium">Platform admins only</p>
                <p className="text-muted-foreground">
                  This console is available to Global Chain Hub team accounts with a confirmed
                  company email address.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {admin.data?.isAdmin && (
          <Tabs
            value={tab ?? "signups"}
            onValueChange={(v) => navigate({ search: { tab: v as TabId }, replace: true })}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="signups">Recent signups</TabsTrigger>
              <TabsTrigger value="invites">Onboarding links</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="visibility">Profile visibility</TabsTrigger>
              <TabsTrigger value="add">Add organization</TabsTrigger>
            </TabsList>
            <TabsContent value="signups" className="pt-4">
              <RecentSignups />
            </TabsContent>
            <TabsContent value="invites" className="pt-4">
              <OnboardingInvites />
            </TabsContent>
            <TabsContent value="verification" className="pt-4">
              <VerificationQueue />
            </TabsContent>
            <TabsContent value="visibility" className="pt-4">
              <ProfileVisibility />
            </TabsContent>
            <TabsContent value="add" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add a new organization</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    You'll be added as the owner and can invite the organization's team afterwards.
                  </p>
                </CardHeader>
                <CardContent>
                  <CreateOrgForm
                    signedIn
                    onCreated={(id) => navigate({ to: "/organizations/$id", params: { id } })}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}

function RecentSignups() {
  const fetchRecentSignups = useServerFn(listRecentSignups);
  const q = useQuery({
    queryKey: ["admin-recent-signups"],
    queryFn: () => fetchRecentSignups({ data: { limit: 25 } }),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Newest organizations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {q.isError && (
          <p className="text-sm text-destructive">
            {q.error instanceof Error ? q.error.message : "Could not load signups"}
          </p>
        )}
        {q.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No organizations yet.</p>
        )}
        {q.data?.map((o) => (
          <div
            key={o.id}
            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{o.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[o.type, o.country].filter(Boolean).join(" · ")}
                {o.ownerEmail ? ` · ${o.ownerEmail}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
              <Badge variant={o.claimed ? "secondary" : "outline"}>
                {o.claimed
                  ? `${o.memberCount} member${o.memberCount === 1 ? "" : "s"}`
                  : "Unclaimed"}
              </Badge>
              <span className="text-muted-foreground">
                {new Date(o.created_at as string).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OnboardingInvites() {
  const qc = useQueryClient();
  const fetchPlatformInvites = useServerFn(listPlatformInvites);
  const createPlatformInviteFn = useServerFn(createPlatformInvite);
  const revokePlatformInviteFn = useServerFn(revokePlatformInvite);
  const invites = useQuery({
    queryKey: ["platform-invites"],
    queryFn: () => fetchPlatformInvites(),
  });

  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [withShell, setWithShell] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [orgCountry, setOrgCountry] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createPlatformInviteFn({
        data: {
          email: email.trim() || null,
          note: note.trim() || null,
          expiresInDays: 30,
          orgName: withShell ? orgName.trim() : null,
          orgType: withShell ? orgType : null,
          orgCountry: withShell ? orgCountry.trim() || null : null,
          targetOrgId: null,
        },
      }),
    onSuccess: (row) => {
      copyLink(row.token as string);
      toast.success("Onboarding link created and copied");
      setEmail("");
      setNote("");
      setOrgName("");
      setOrgType("");
      setOrgCountry("");
      qc.invalidateQueries({ queryKey: ["platform-invites"] });
      qc.invalidateQueries({ queryKey: ["admin-recent-signups"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create link"),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => revokePlatformInviteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Link revoked");
      qc.invalidateQueries({ queryKey: ["platform-invites"] });
    },
  });

  const linkFor = (token: string) => `${window.location.origin}/onboarding/${token}`;
  const copyLink = (token: string) => {
    void navigator.clipboard?.writeText(linkFor(token));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Send an onboarding link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Organization email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@neworg.com"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for a link anyone can use once.
            </p>
          </div>

          <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              checked={withShell}
              onChange={(e) => setWithShell(e.target.checked)}
              className="mt-0.5"
            />
            <span className="min-w-0">
              Create the organization for them
              <span className="block text-xs text-muted-foreground">
                Otherwise they create their own organization after signing up.
              </span>
            </span>
          </label>

          {withShell && (
            <div className="space-y-3 rounded-md border bg-muted/30 p-3">
              <div className="space-y-1.5">
                <Label htmlFor="shell-name">Organization name</Label>
                <Input
                  id="shell-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Organization type</Label>
                <Select value={orgType} onValueChange={setOrgType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shell-country">Country</Label>
                <Input
                  id="shell-country"
                  value={orgCountry}
                  onChange={(e) => setOrgCountry(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="invite-note">Note (internal)</Label>
            <Textarea
              id="invite-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            disabled={create.isPending || (withShell && (!orgName.trim() || !orgType))}
            onClick={() => create.mutate()}
          >
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create onboarding link
          </Button>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Sent invitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {invites.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {invites.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No onboarding links yet.</p>
          )}
          {invites.data?.map((i) => {
            const status = i.revoked_at
              ? "revoked"
              : new Date(i.expires_at as string) < new Date()
                ? "expired"
                : (i.uses as number) >= (i.max_uses as number)
                  ? "used"
                  : "active";
            return (
              <div
                key={i.id}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {i.org_name || i.email || "Open onboarding link"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {i.email ? `${i.email} · ` : ""}expires{" "}
                    {new Date(i.expires_at as string).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge variant={status === "active" ? "secondary" : "outline"}>{status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      copyLink(i.token as string);
                      toast.success("Link copied");
                    }}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy link
                  </Button>
                  {status === "active" && (
                    <Button size="sm" variant="ghost" onClick={() => revoke.mutate(i.id as string)}>
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileVisibility() {
  const qc = useQueryClient();
  const fetchOrgs = useServerFn(listOrgVisibility);
  const setVisibility = useServerFn(setOrgVisibility);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const orgs = useQuery({
    queryKey: ["admin-org-visibility", query],
    queryFn: () => fetchOrgs({ data: { search: query } }),
  });

  const toggle = useMutation({
    mutationFn: ({ orgId, isHidden }: { orgId: string; isHidden: boolean }) =>
      setVisibility({ data: { orgId, isHidden } }),
    onSuccess: (res) => {
      toast.success(
        res.isHidden
          ? "Profile hidden — only connected partners and admins can see it."
          : "Profile is public again.",
      );
      qc.invalidateQueries({ queryKey: ["admin-org-visibility"] });
      qc.invalidateQueries({ queryKey: ["entities", "registry"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not change visibility"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile visibility</CardTitle>
        <p className="text-sm text-muted-foreground">
          Hidden organizations disappear from the directory, map, search and matchmaking. Their own
          team, accepted connected partners and platform admins keep full access.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
          }}
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations by name"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {orgs.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {orgs.isError && (
          <p className="text-sm text-destructive">
            {orgs.error instanceof Error ? orgs.error.message : "Could not load organizations"}
          </p>
        )}
        {orgs.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No organizations match that search.</p>
        )}
        {orgs.data?.map((o) => (
          <div
            key={o.id}
            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{o.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[o.type, o.country].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={o.is_hidden ? "outline" : "secondary"} className="gap-1">
                {o.is_hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {o.is_hidden ? "Hidden" : "Public"}
              </Badge>
              <Button
                size="sm"
                variant={o.is_hidden ? "default" : "outline"}
                disabled={toggle.isPending}
                onClick={() => toggle.mutate({ orgId: o.id, isHidden: !o.is_hidden })}
              >
                {o.is_hidden ? "Make public" : "Hide from public"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
