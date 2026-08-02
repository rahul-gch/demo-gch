import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import type { Entity } from "@/seed/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { UserMenu } from "@/components/UserMenu";
import { MeetingRequestDialog } from "@/components/MeetingRequestDialog";
import { useActingOrgId, useSendMessage } from "@/lib/use-comms";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CalendarPlus,
  Globe,
  MapPin,
  Send,
  ShieldCheck,
  Lock,
} from "lucide-react";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  const shown =
    value === null || value === undefined || value === "" || value === 0 ? "Not reported" : value;
  const muted = shown === "Not reported";
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 truncate text-sm ${muted ? "text-muted-foreground" : "font-medium"}`}>
        {shown}
      </div>
    </div>
  );
}

function TagList({ label, items }: { label: string; items?: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items && items.length > 0 ? (
          items.map((i) => (
            <Badge key={i} variant="secondary" className="text-[11px] font-normal">
              {i}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">Not reported</span>
        )}
      </div>
    </div>
  );
}

export function PublicOrgProfile({ entity: e }: { entity: Entity }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [meetOpen, setMeetOpen] = useState(false);

  const myOrgId = useActingOrgId(null);
  const sendMessage = useSendMessage(myOrgId);

  const send = () => {
    if (!draft.trim()) return;
    if (!myOrgId) {
      toast.error("Join or create an organization before messaging partners.");
      return;
    }
    if (!e.orgUuid || e.orgUuid === myOrgId) {
      toast.error("This organization cannot be messaged yet.");
      return;
    }
    sendMessage.mutate(
      { counterpartOrgId: e.orgUuid, body: draft.trim() },
      {
        onSuccess: () => {
          setDraft("");
          toast.success(`Message sent to ${e.name}`);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not send message"),
      },
    );
  };

  const location = [e.city, e.country].filter(Boolean).join(", ");

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <div className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          Public organization profile
        </div>
        <UserMenu />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Identity */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                  {e.logoUrl ? (
                    <img src={e.logoUrl} alt={`${e.name} logo`} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {e.gchNumber}
                  </div>
                  <h1 className="truncate text-2xl font-semibold tracking-tight">{e.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{e.entityType}</Badge>
                    <Badge variant="outline">{e.actorType}</Badge>
                    {location && (
                      <Badge variant="outline">
                        <MapPin className="mr-1 h-3 w-3" />
                        {location}
                      </Badge>
                    )}
                    {e.verificationStatus && (
                      <Badge variant="outline">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        {e.verificationStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    document.getElementById("public-message-box")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Send message
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMeetOpen(true)}>
                  <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                  Request meeting
                </Button>
              </div>
            </div>

            {e.description && (
              <>
                <Separator className="my-5" />
                <p className="text-sm leading-relaxed text-muted-foreground">{e.description}</p>
              </>
            )}

            <Separator className="my-5" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Region" value={e.region} />
              <Field label="Country" value={e.country} />
              <Field label="Organization type" value={e.organizationType || e.rawEntityType} />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Website
                </div>
                {e.website ? (
                  <a
                    href={e.website.startsWith("http") ? e.website : `https://${e.website}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-0.5 flex items-center gap-1 truncate text-sm font-medium text-primary hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{e.website}</span>
                  </a>
                ) : (
                  <div className="mt-0.5 text-sm text-muted-foreground">Not reported</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TagList label="Capabilities" items={e.capabilities} />
            <TagList label="Materials" items={e.materials} />
            <TagList label="Product categories" items={e.productCategories} />
            <TagList label="Specializations" items={e.specializations} />
          </CardContent>
        </Card>

        {/* Operations */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="MOQ" value={e.moq} />
              <Field label="Lead time" value={e.leadTimeDays ? `${e.leadTimeDays} days` : ""} />
              <Field label="Capacity" value={e.capacity} />
              <Field label="On-time rate" value={e.onTimeRate ? `${e.onTimeRate}%` : ""} />
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {e.certifications && e.certifications.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {e.certifications.map((c) => (
                  <Badge key={c} variant="outline" className="text-[11px] font-normal">
                    <ShieldCheck className="mr-1 h-3 w-3 text-emerald-600" />
                    {c}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No certifications published.</p>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Audit reports, certificates and transaction documents are private to this organization.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card id="public-message-box" className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Contact {e.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={draft}
              onChange={(ev) => setDraft(ev.target.value)}
              placeholder={`Introduce your organization and what you'd like to explore with ${e.name}…`}
              rows={4}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={send} disabled={!draft.trim() || sendMessage.isPending}>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {sendMessage.isPending ? "Sending…" : "Send message"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMeetOpen(true)}>
                <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                Request meeting
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/">Back to my workspace</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <MeetingRequestDialog entity={e} open={meetOpen} onOpenChange={setMeetOpen} viewerOrgUuid={null} />
    </div>
  );
}
