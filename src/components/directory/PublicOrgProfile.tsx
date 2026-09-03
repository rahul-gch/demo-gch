import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Entity } from "@/seed/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { UserMenu } from "@/components/UserMenu";
import { MeetingRequestDialog } from "@/components/MeetingRequestDialog";
import { useMyOrgs, useSendMessage } from "@/lib/use-comms";
import { useShowroomProducts } from "@/lib/use-showroom";
import { ProductCard } from "@/components/showroom/ProductCard";
import {
  useOrgConnections,
  useRequestConnection,
  useRespondConnection,
} from "@/lib/org-connections";
import { getEntity } from "@/seed/all-entities";
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
  Store,
  Package,
  Clock,
  CheckCircle2,
  Sparkles,
  UserPlus,
  Check,
  Layers,
  ArrowUpRight,
} from "lucide-react";

function getBrandGradient(name: string): string {
  const gradients = [
    "from-blue-600 via-indigo-600 to-violet-700",
    "from-emerald-600 via-teal-600 to-cyan-700",
    "from-violet-600 via-purple-600 to-fuchsia-700",
    "from-amber-600 via-orange-600 to-rose-700",
    "from-cyan-600 via-blue-600 to-indigo-700",
    "from-rose-600 via-pink-600 to-purple-700",
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = (name || "").charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(name: string): string {
  const clean = (name || "").replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || "OR";
}

export function PublicOrgProfile({ entity: e }: { entity: Entity }) {
  const [draft, setDraft] = useState("");
  const [meetOpen, setMeetOpen] = useState(false);

  const myOrgs = useMyOrgs();
  const primaryOrg = myOrgs[0];
  const actingOrgId = useMemo(() => {
    if (!primaryOrg) return null;
    const entity = getEntity(primaryOrg.id);
    return entity?.id ?? primaryOrg.id;
  }, [primaryOrg]);
  // Server functions expect the database UUID, not the seed/legacy entity id.
  const actingOrgUuid = useMemo(() => {
    if (!primaryOrg) return null;
    const entity = getEntity(primaryOrg.id);
    return entity?.orgUuid ?? primaryOrg.id;
  }, [primaryOrg]);

  const { isConnected: checkIsConnected, getConnectionStatus } = useOrgConnections(actingOrgId);
  const requestMutation = useRequestConnection();
  const respondMutation = useRespondConnection();

  const sendMessage = useSendMessage(actingOrgUuid);
  const targetOrgUuid = e.orgUuid ?? e.id;

  const { data: showroom, isLoading: showroomLoading } = useShowroomProducts(
    targetOrgUuid,
    actingOrgUuid,
  );


  const isConnected =
    (showroom?.isConnected ?? false) ||
    (actingOrgId ? checkIsConnected(e.id) : false);

  const connectionStatus = actingOrgId ? getConnectionStatus(e.id) : "none";
  const products = showroom?.products ?? [];

  const navigate = useNavigate();

  const handleConnect = () => {
    if (!actingOrgId) {
      toast.info("Join or select an organization to connect.");
      return;
    }
    requestMutation.mutate(
      { fromOrgId: actingOrgId, toOrgId: e.id },
      {
        onSuccess: () => toast.success(`Connection request sent to ${e.name}`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to send connection request"),
      },
    );
  };

  const handleAcceptConnection = () => {
    if (!actingOrgId) return;
    respondMutation.mutate(
      { myOrgId: actingOrgId, otherOrgId: e.id, status: "accepted" },
      {
        onSuccess: () => toast.success(`You are now connected with ${e.name}!`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to accept connection"),
      },
    );
  };

  const send = () => {
    if (!draft.trim()) return;
    if (!actingOrgUuid) {
      toast.error("Join or create an organization before messaging partners.");
      return;
    }
    if (!targetOrgUuid || targetOrgUuid === actingOrgUuid) {
      toast.error("This organization cannot be messaged yet.");
      return;
    }

    sendMessage.mutate(
      { counterpartOrgId: targetOrgUuid, body: draft.trim() },
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
  const leadTimeDays = e.leadTimeDays || 30;
  const onTimeRate = e.onTimeRate || 95;
  const capacity = e.capacity || "150,000 units / month";
  const moq = e.moq || "1,000 units";
  const gchId = e.gchNumber || `GCH-${(e.country || "GL").slice(0, 2).toUpperCase()}-100249`;
  const brandGradient = getBrandGradient(e.name);
  const initials = getInitials(e.name);

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50/50 dark:bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <div className="text-sm font-medium text-foreground truncate max-w-xs sm:max-w-md flex items-center gap-2">
            <span>{e.name}</span>
            <span className="text-[11px] font-mono text-muted-foreground">({gchId})</span>
          </div>
        </div>
        <UserMenu />
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Luxury Hero Banner Card */}
        <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* Rich Dynamic Editorial Banner with Textured Lattice & Lighting */}
          <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
            {/* Custom Banner Image OR Rich Animated Gradient Mesh */}
            {e.bannerUrls && e.bannerUrls.length > 0 ? (
              <img
                src={e.bannerUrls[0]}
                alt={`${e.name} banner`}
                className="h-full w-full object-cover opacity-90"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
                {/* SVG Geometric Grid & Textile Wave lines */}
                <svg className="absolute inset-0 h-full w-full opacity-15" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="hero-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M0 20 L40 20 M20 0 L20 40" stroke="currentColor" strokeWidth="0.7" className="text-indigo-300" fill="none" />
                      <circle cx="20" cy="20" r="1.5" className="text-indigo-400" fill="currentColor" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hero-pattern)" />
                </svg>

                {/* Glowing ambient light orbs */}
                <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-violet-500/15 blur-2xl" />
              </div>
            )}

            {/* Gradient Scrim for Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

            {/* Top Banner Tags */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-white/90 border border-white/10">
                {e.verificationStatus === "Verified" ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Verified Network Node</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>Registered Member</span>
                  </>
                )}
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 font-mono text-[11px] font-medium text-white/90 border border-white/10">
                <span>{gchId}</span>
              </div>
            </div>
          </div>

          {/* Profile Header Details (Sitting Cleanly in White Card Body) */}
          <div className="px-6 pb-6 pt-0">
            {/* Avatar & Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-20 mb-5">
              {/* Elevated Brand Monogram / Logo */}
              <div className="relative group">
                <div className="flex h-28 w-28 sm:h-32 sm:w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-card shadow-xl ring-1 ring-border/80">
                  {e.logoUrl ? (
                    <img
                      src={e.logoUrl}
                      alt={`${e.name} logo`}
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${brandGradient} flex flex-col items-center justify-center text-white shadow-inner relative select-none`}>
                      <span className="text-3xl sm:text-4xl font-extrabold tracking-wider drop-shadow-md">
                        {initials}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest font-semibold opacity-75 mt-0.5">
                        {e.actorType || "Member"}
                      </span>
                    </div>
                  )}
                </div>
                {/* Floating Verified Mini-Badge (Only if verified) */}
                {e.verificationStatus === "Verified" && (
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-background" title="Verified Supply Chain Entity">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0">
                {connectionStatus === "connected" ? (
                  <Badge variant="secondary" className="gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 py-2 px-4 text-xs font-semibold shadow-sm">
                    <Check className="h-4 w-4" /> Connected Partner
                  </Badge>
                ) : connectionStatus === "sent_pending" ? (
                  <Badge variant="outline" className="gap-1.5 text-amber-600 border-amber-300 py-2 px-4 text-xs font-semibold">
                    <Clock className="h-4 w-4" /> Request Sent (Pending)
                  </Badge>
                ) : connectionStatus === "received_pending" ? (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm h-9 px-4"
                    onClick={handleAcceptConnection}
                  >
                    <Check className="h-4 w-4" /> Accept Connection Request
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleConnect} className="gap-1.5 shadow-sm h-9 px-4">
                    <UserPlus className="h-4 w-4" /> Connect Partner
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-9 px-4"
                  onClick={() =>
                    document
                      .getElementById("public-message-box")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <Send className="h-3.5 w-3.5" /> Message
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-9 px-4"
                  onClick={() => setMeetOpen(true)}
                >
                  <CalendarPlus className="h-3.5 w-3.5" /> Meeting
                </Button>
              </div>
            </div>

            {/* Title & Metadata Ribbon (100% High Contrast on Card Body) */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {e.name}
                </h1>
                {e.verificationStatus === "Verified" ? (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1 text-xs px-2.5 py-0.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Supplier
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs px-2.5 py-0.5">
                    {e.verificationStatus || "Active Profile"}
                  </Badge>
                )}
                <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border">
                  {gchId}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
                {location && (
                  <span className="flex items-center gap-1 font-medium text-foreground/80">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {location}
                  </span>
                )}
                <span>•</span>
                <Badge variant="secondary" className="text-[11px] font-medium bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300">
                  {e.entityType}
                </Badge>
                <Badge variant="outline" className="text-[11px] font-medium">
                  {e.actorType}
                </Badge>
              </div>
            </div>

            {e.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-4xl">
                {e.description}
              </p>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Body */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left Column (Main Details - 8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Operational Metric Tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricTile
                icon={<Clock className="h-4 w-4 text-blue-500" />}
                label="Lead Time"
                value={`${leadTimeDays} days`}
                subtext="Average fulfillment"
              />
              <MetricTile
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                label="On-Time Rate"
                value={`${onTimeRate}%`}
                subtext="Delivery track record"
              />
              <MetricTile
                icon={<Package className="h-4 w-4 text-purple-500" />}
                label="Capacity"
                value={capacity}
                subtext="Production volume"
              />
              <MetricTile
                icon={<Layers className="h-4 w-4 text-amber-500" />}
                label="Minimum Order"
                value={moq}
                subtext="Sample MOQ"
              />
            </div>

            {/* Product Showroom & Materials Preview */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    Product Showroom & Fabric Swatches ({products.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Browse physical fabrics, compositions, and request swatch samples.
                  </CardDescription>
                </div>
                {e.orgUuid && (
                  <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
                    <Link to="/directory/$id/showroom" params={{ id: e.id }}>
                      View Full Showroom <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {showroomLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-48 rounded-lg animate-pulse bg-muted/40" />
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <div className="space-y-4">
                    {!isConnected && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-amber-50/80 p-3.5 text-xs text-amber-900 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900">
                        <span className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>Physical sample swatch ordering is unlocked for verified connected partners.</span>
                        </span>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 text-xs shrink-0"
                          onClick={handleConnect}
                        >
                          Connect to Unlock Samples
                        </Button>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {products.map((prod) => (
                        <ProductCard
                          key={prod.id}
                          product={prod}
                          orgRouteId={e.id}
                          detailBase="directory"
                          isOwner={false}
                          canManage={false}
                          isConnected={isConnected}
                          onOrderSample={(p) =>
                            navigate({
                              to: "/directory/$id/showroom/$productId/order",
                              params: { id: e.id, productId: p.id },
                            })
                          }
                          onConnect={handleConnect}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                    <Package className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                    No products published in the showroom yet.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verified Certifications & Sustainability Standards */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Sustainability & Verified Certifications
                </CardTitle>
                <CardDescription className="text-xs">
                  Audited environmental, social, and chemical safety standards.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {e.certifications && e.certifications.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {e.certifications.map((c) => (
                      <div
                        key={c}
                        className="flex items-center justify-between rounded-lg border bg-card p-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-foreground">{c}</div>
                            <div className="text-[10px] text-muted-foreground">Verified Standard</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50/50">
                          Active
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">No certifications published yet.</p>
                )}
                <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3 text-slate-400" />
                  Transaction certificates and audit reports are shared directly inside verified projects.
                </div>
              </CardContent>
            </Card>

            {/* Materials & Product Categories */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Materials & Technical Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TagGroup label="Materials / Fibers Available" items={e.materials} />
                <TagGroup label="Product Categories" items={e.productCategories} />
                <TagGroup label="Specializations & Processes" items={e.capabilities || e.specializations} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Sticky Partner Action Hub - 4 cols) */}
          <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-20">
            {/* Action Hub / Quick Inquiry Card */}
            <Card id="public-message-box" className="shadow-sm border-slate-200">
              <CardHeader className="pb-3 bg-slate-50/70 dark:bg-muted/20 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Partner Action Hub
                </CardTitle>
                <CardDescription className="text-xs">
                  Initiate direct supply chain collaboration with {e.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Send Quick Inquiry</label>
                  <Textarea
                    value={draft}
                    onChange={(ev) => setDraft(ev.target.value)}
                    placeholder={`Introduce your company and request fabric specs or MOQ inquiries with ${e.name}…`}
                    className="min-h-[100px] text-xs resize-none"
                  />
                  <Button
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={send}
                    disabled={!draft.trim() || sendMessage.isPending}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sendMessage.isPending ? "Sending…" : "Send Message"}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5 justify-start text-xs"
                    onClick={() => setMeetOpen(true)}
                  >
                    <CalendarPlus className="h-3.5 w-3.5 text-primary" />
                    Schedule Discovery Meeting
                  </Button>
                  {e.website && (
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="w-full gap-1.5 justify-start text-xs text-muted-foreground"
                    >
                      <a
                        href={e.website.startsWith("http") ? e.website : `https://${e.website}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Visit Official Website
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Supply Chain & Verification Summary Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Supply Chain Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Tier Position</span>
                  <span className="font-semibold text-foreground">{e.actorType}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Country / Region</span>
                  <span className="font-medium text-foreground">{[e.country, e.region].filter(Boolean).join(", ") || "Global"}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Org Type</span>
                  <span className="font-medium text-foreground">{e.organizationType || e.entityType}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Network Verification</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Key Contact & Organization Leadership Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Key Contact & Leadership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {e.contacts && e.contacts.length > 0 ? (
                  e.contacts.map((c, i) => (
                    <div key={i} className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{c.name}</span>
                        <Badge variant="outline" className="text-[10px] capitalize bg-background">
                          {c.role || "Organization Owner"}
                        </Badge>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground pt-0.5">
                          <Send className="h-3 w-3 text-primary shrink-0" />
                          <a
                            href={`mailto:${c.email}`}
                            className="hover:underline hover:text-foreground truncate font-mono text-[11px]"
                          >
                            {c.email}
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Organization Representative</span>
                      <Badge variant="outline" className="text-[10px] bg-background">Owner</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Direct inquiries can be sent through the Partner Action Hub above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Meeting Request Dialog */}
      <MeetingRequestDialog
        entity={e}
        open={meetOpen}
        onOpenChange={setMeetOpen}
        viewerOrgUuid={actingOrgUuid}
      />
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3.5 shadow-sm space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-base sm:text-lg font-bold tabular-nums text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{subtext}</div>
    </div>
  );
}

function TagGroup({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <Badge key={it} variant="outline" className="text-xs font-normal py-1 px-2.5">
            {it}
          </Badge>
        ))}
      </div>
    </div>
  );
}
