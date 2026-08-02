import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { refreshRegistry } from "@/lib/registry";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { acceptInvite, lookupInvite } from "@/lib/invites.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Mail } from "lucide-react";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({ meta: [{ title: "You've been invited — Global Chain Hub" }] }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [userEmail, setUserEmail] = useState<string | null | undefined>(undefined);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const invite = useQuery({
    queryKey: ["invite", token],
    queryFn: () => lookupInvite({ data: { token } }),
    retry: false,
  });


  const accept = async () => {
    setAccepting(true);
    try {
      const res = await acceptInvite({ data: { token } });
      await refreshRegistry(queryClient);
      toast.success("Joined organization");
      nav({ to: "/organizations/$id", params: { id: res.orgId }, replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message.replace(/^.*: /, "") : "Could not accept invite");
      setAccepting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Organization invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invite.isLoading && <p className="text-center text-sm text-muted-foreground">Loading invitation…</p>}
          {invite.isError && (
            <p className="text-center text-sm text-destructive">Could not load invitation.</p>
          )}
          {invite.data === null && (
            <p className="text-center text-sm text-muted-foreground">
              This invitation link isn't valid.
            </p>
          )}
          {invite.data && <InviteBody invite={invite.data} />}
          {invite.data && invite.data.status === "active" && (
            <>
              {userEmail === null && (
                <div className="space-y-3">
                  <p className="text-center text-xs text-muted-foreground">
                    Create your account to accept this invitation.
                  </p>
                  <EmailAuthForm mode="signup" compact />
                </div>
              )}

              {userEmail && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Signed in as <span className="font-medium">{userEmail}</span>
                  </p>
                  {invite.data.is_email_locked &&
                    invite.data.invited_email &&
                    invite.data.invited_email.toLowerCase() !== userEmail.toLowerCase() && (
                      <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
                        This invitation was sent to{" "}
                        <span className="font-medium">{invite.data.invited_email}</span>. Sign in
                        with that account to accept.
                      </p>
                    )}
                  <Button
                    onClick={accept}
                    disabled={accepting}
                    className="w-full"
                    size="lg"
                  >
                    {accepting ? "Joining…" : `Accept and join ${invite.data.org_name}`}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InviteBody({
  invite,
}: {
  invite: {
    org_name: string;
    role: string;
    is_email_locked: boolean;
    invited_email: string | null;
    expires_at: string;
    status: string;
  };
}) {
  const badgeTone: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    expired: "bg-amber-100 text-amber-800",
    revoked: "bg-rose-100 text-rose-800",
    used: "bg-slate-200 text-slate-700",
  };
  return (
    <div className="space-y-3 text-center">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">You're invited to</p>
        <p className="mt-1 text-lg font-semibold">{invite.org_name}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <Badge variant="outline" className="capitalize">
          Role: {invite.role}
        </Badge>
        <Badge className={badgeTone[invite.status] ?? ""}>{invite.status}</Badge>
        {invite.invited_email && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
            <Mail className="h-3 w-3" />
            {invite.invited_email}
          </span>
        )}
      </div>
      {invite.status !== "active" && (
        <p className="text-xs text-muted-foreground">
          This invitation is {invite.status}. Ask the sender for a new one.
        </p>
      )}
    </div>
  );
}
