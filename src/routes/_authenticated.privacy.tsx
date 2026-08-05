import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Download, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { exportMyData, submitDataRequest } from "@/lib/privacy.functions";
import { logSecurityEvent } from "@/lib/security-log";
import { MARKETING_CONSENT_VERSION, POLICY_VERSIONS, PRIVACY_VERSION, TERMS_VERSION } from "@/lib/policies";

export const Route = createFileRoute("/_authenticated/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & security — Global Chain Hub" },
      {
        name: "description",
        content: "Manage your consents, export your data, request deletion and review security activity.",
      },
      { property: "og:title", content: "Privacy & security — Global Chain Hub" },
      { property: "og:description", content: "Consents, data export, deletion and security activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyCenter,
});

type Consent = { policy_type: string; policy_version: string; accepted: boolean; accepted_at: string };
type Request = { id: string; request_type: string; status: string; created_at: string };
type Event = { id: string; action: string; created_at: string; target_type: string | null };

function PrivacyCenter() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const runExport = useServerFn(exportMyData);
  const runRequest = useServerFn(submitDataRequest);

  const load = async () => {
    const [{ data: c }, { data: r }, { data: e }] = await Promise.all([
      supabase.from("user_consents").select("policy_type, policy_version, accepted, accepted_at"),
      supabase.from("data_requests").select("id, request_type, status, created_at").order("created_at", { ascending: false }),
      supabase.from("security_events").select("id, action, created_at, target_type").order("created_at", { ascending: false }).limit(20),
    ]);
    setConsents((c ?? []) as Consent[]);
    setRequests((r ?? []) as Request[]);
    setEvents((e ?? []) as Event[]);
  };

  useEffect(() => {
    load();
  }, []);

  const latest = (type: string) =>
    consents
      .filter((x) => x.policy_type === type)
      .sort((a, b) => b.accepted_at.localeCompare(a.accepted_at))[0];

  const marketing = latest("marketing");

  const setMarketing = async (value: boolean) => {
    setBusy("marketing");
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    const { error } = await supabase.from("user_consents").upsert(
      {
        user_id: userId,
        policy_type: "marketing",
        policy_version: MARKETING_CONSENT_VERSION,
        accepted: value,
        accepted_at: new Date().toISOString(),
      },
      { onConflict: "user_id,policy_type,policy_version" },
    );
    setBusy(null);
    if (error) return toast.error(error.message);
    await logSecurityEvent("privacy.consent_recorded", {
      targetType: "marketing",
      detail: { accepted: value, version: MARKETING_CONSENT_VERSION },
    });
    toast.success(value ? "Marketing emails enabled" : "Marketing consent withdrawn");
    load();
  };

  const download = async () => {
    setBusy("export");
    try {
      const payload = await runExport({ data: undefined as never });
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `global-chain-hub-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await logSecurityEvent("privacy.data_export_requested", { targetType: "account" });
      toast.success("Your data export was downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  const request = async (requestType: "export" | "deletion") => {
    setBusy(requestType);
    try {
      const res = await runRequest({ data: { requestType } });
      toast.success(
        res.alreadyOpen
          ? "You already have an open request — we'll come back to you."
          : requestType === "deletion"
            ? "Deletion request submitted. Our team will confirm by email."
            : "Export request submitted.",
      );
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Privacy &amp; security</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your consents, your data, and recent security activity on your account.
          </p>
        </header>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Policy acceptance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ConsentRow
              label="Terms & Conditions"
              href="/legal/terms"
              version={TERMS_VERSION}
              record={latest("terms")}
            />
            <Separator />
            <ConsentRow
              label="Privacy Policy"
              href="/legal/privacy"
              version={PRIVACY_VERSION}
              record={latest("privacy")}
            />
            <Separator />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">Marketing emails</p>
                <p className="text-xs text-muted-foreground">
                  Optional. Product news and network updates. Withdraw at any time.
                </p>
              </div>
              <Switch
                checked={!!marketing?.accepted}
                disabled={busy === "marketing"}
                onCheckedChange={setMarketing}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Current policy versions: terms {POLICY_VERSIONS.terms}, privacy {POLICY_VERSIONS.privacy}.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Your data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={download} disabled={busy === "export"} size="sm">
                {busy === "export" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download my data (JSON)
              </Button>
              <Button variant="outline" size="sm" onClick={() => request("export")} disabled={busy === "export"}>
                Request a formal export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => request("deletion")}
                disabled={busy === "deletion"}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Request account deletion
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Deletion requests are reviewed by a platform administrator before anything is removed,
              so shared organization records aren&apos;t deleted by accident.
            </p>
            {requests.length > 0 && (
              <ul className="divide-y rounded-md border text-xs">
                {requests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between px-3 py-2">
                    <span className="capitalize">{r.request_type} request</span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                      <Badge variant="outline" className="capitalize">
                        {r.status.replace("_", " ")}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Recent security activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {events.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              <ul className="divide-y text-sm">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 px-6 py-2.5">
                    <span className="truncate">{humanAction(e.action)}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function ConsentRow({
  label,
  href,
  version,
  record,
}: {
  label: string;
  href: string;
  version: string;
  record?: Consent;
}) {
  const current = record?.accepted && record.policy_version === version;
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium">{label}</p>
        <a href={href} className="text-xs text-primary hover:underline">
          Read version {version}
        </a>
      </div>
      <div className="text-right text-xs">
        {current ? (
          <>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              Accepted
            </Badge>
            <p className="mt-1 text-muted-foreground">
              {new Date(record!.accepted_at).toLocaleDateString()}
            </p>
          </>
        ) : (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            Not recorded
          </Badge>
        )}
      </div>
    </div>
  );
}

function humanAction(action: string): string {
  const map: Record<string, string> = {
    "auth.sign_in": "Signed in",
    "auth.sign_up": "Account created",
    "auth.password_reset_requested": "Password reset requested",
    "auth.password_changed": "Password changed",
    "org.created": "Organization created",
    "org.updated": "Organization profile updated",
    "org.profile_answers_updated": "Entity profile updated",
    "org.member_role_changed": "Member role changed",
    "org.member_removed": "Member removed",
    "org.invite_created": "Invitation created",
    "document.uploaded": "Document uploaded",
    "document.downloaded": "Document downloaded",
    "document.deleted": "Document deleted",
    "privacy.consent_recorded": "Consent updated",
    "privacy.data_export_requested": "Data export requested",
    "privacy.data_deletion_requested": "Account deletion requested",
  };
  return map[action] ?? action;
}

export { Link };
