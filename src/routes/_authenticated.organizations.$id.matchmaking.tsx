import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, UserPlus, Check, X, Store, Sliders, Clock, Inbox, ArrowUpRight, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMatchesFor } from "@/seed/matchmaking";
import { getEntity } from "@/seed/all-entities";
import { MatchProfileSheet } from "@/components/MatchProfileSheet";
import { MatchScoreInfo } from "@/components/MatchScoreInfo";
import { AiPartnerSearch, applyPartnerFilters } from "@/components/AiPartnerSearch";
import { MatchPreferencesTab } from "@/components/matchmaking/MatchPreferencesTab";
import { useOrgMatchPreferences } from "@/lib/match-preferences";
import type { PartnerSearchFilters } from "@/lib/matchmaking-ai.functions";
import type { Entity } from "@/seed/types";
import {
  useOrgConnections,
  useRequestConnection,
  useRespondConnection,
} from "@/lib/org-connections";
import { ALL_ENTITIES } from "@/seed/all-entities";
import { scoreMatch } from "@/seed/matchmaking";

import { refreshRegistry } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/organizations/$id/matchmaking")({
  loader: async ({ params, context }) => {
    let entity = getEntity(params.id);
    if (!entity) {
      await refreshRegistry(context.queryClient);
      entity = getEntity(params.id);
    }
    if (!entity) throw notFound();
    return { entity };
  },
  component: OrgMatchmakingPage,
});

function OrgMatchmakingPage() {
  const { entity } = Route.useLoaderData();
  const [activeTab, setActiveTab] = useState("discover");
  const [aiFilters, setAiFilters] = useState<PartnerSearchFilters | null>(null);
  const [textSearch, setTextSearch] = useState("");
  const [material, setMaterial] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const {
    connectedEntities,
    receivedRequests,
    sentRequests,
    getConnectionStatus,
  } = useOrgConnections(entity.id);

  const { preferences: userPrefs } = useOrgMatchPreferences(entity.id);

  const requestMutation = useRequestConnection();
  const respondMutation = useRespondConnection();

  const rawMatches = useMemo(() => getMatchesFor(entity, 1000, 0), [entity]);

  // Combined real-time filtering: Text search across ALL entities + Category Chips + Material Chips + AI Filters + User Match Preferences
  const matches = useMemo(() => {
    let list = rawMatches;

    // 1. Text Search Filter (instant as user types across all entities in registry)
    if (textSearch.trim()) {
      const q = textSearch.trim().toLowerCase();
      const matchingAll = ALL_ENTITIES.filter((e) => {
        if (e.id === entity.id) return false;
        const name = e.name?.toLowerCase() || "";
        const countries = [e.country, ...(e.operatingCountries || [])].join(" ").toLowerCase();
        const address = [e.address, e.city, e.region, e.zipCode].filter(Boolean).join(" ").toLowerCase();
        const materials = e.materials?.join(" ").toLowerCase() || "";
        const actor = e.actorType?.toLowerCase() || "";
        const entityType = e.entityType?.toLowerCase() || "";
        return (
          name.includes(q) ||
          countries.includes(q) ||
          address.includes(q) ||
          materials.includes(q) ||
          actor.includes(q) ||
          entityType.includes(q)
        );
      }).map((e) => scoreMatch(entity, e));

      list = matchingAll;
    }

    // 2. Material Chip Filter
    if (material) {
      list = list.filter((x) =>
        x.entity.materials?.some((mm) => mm.toLowerCase() === material.toLowerCase()),
      );
    }

    // 3. Category Chip Filter
    if (category) {
      list = list.filter((x) =>
        x.entity.productCategories?.some((c) => c.toLowerCase() === category.toLowerCase()),
      );
    }

    // 4. AI Filters
    if (aiFilters) {
      list = applyPartnerFilters(
        list.map((x) => ({ ...x, ...x.entity })),
        aiFilters,
      )
        .map((x) => rawMatches.find((r) => r.entity.id === x.entity.id)!)
        .filter(Boolean);
    }

    // 5. Match Preferences Boost/Filter
    if (userPrefs.targetCountries.length > 0 || userPrefs.targetMaterials.length > 0) {
      // Re-sort matches to prioritize user preferences
      list = [...list].sort((a, b) => {
        let aScore = a.score;
        let bScore = b.score;
        const aCountries = [a.entity.country, ...(a.entity.operatingCountries || [])]
          .map((c) => c?.toLowerCase())
          .filter(Boolean);
        const bCountries = [b.entity.country, ...(b.entity.operatingCountries || [])]
          .map((c) => c?.toLowerCase())
          .filter(Boolean);
        if (userPrefs.targetCountries.some((c) => aCountries.includes(c.toLowerCase()))) aScore += 15;
        if (userPrefs.targetCountries.some((c) => bCountries.includes(c.toLowerCase()))) bScore += 15;
        if (a.entity.materials?.some((m) => userPrefs.targetMaterials.includes(m))) aScore += 10;
        if (b.entity.materials?.some((m) => userPrefs.targetMaterials.includes(m))) bScore += 10;
        return bScore - aScore;
      });
    }

    return list;
  }, [rawMatches, textSearch, material, category, aiFilters, userPrefs]);

  const isBrand = entity.entityType === "Brand";
  const chipOptions = isBrand
    ? ["Women", "Men", "Kids", "Baby", "Unisex"]
    : ["Cotton", "Denim", "Wool", "Viscose", "Polyester", "Linen", "Silk"];

  const [active, setActive] = useState<{ entity: Entity; score: number; reasons: string[] } | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [initialAction, setInitialAction] = useState<"message" | "meeting" | null>(null);

  const openWith = (
    m: { entity: Entity; score: number; reasons: string[] },
    action: "message" | "meeting" | null = null,
  ) => {
    setActive(m);
    setInitialAction(action);
    setOpen(true);
  };

  const handleConnect = (targetEntity: Entity) => {
    requestMutation.mutate(
      { fromOrgId: entity.id, toOrgId: targetEntity.id },
      {
        onSuccess: () => toast.success(`Connection request sent to ${targetEntity.name}`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to send connection request"),
      },
    );
  };

  const handleAccept = (targetEntity: Entity) => {
    respondMutation.mutate(
      { myOrgId: entity.id, otherOrgId: targetEntity.id, status: "accepted" },
      {
        onSuccess: () => toast.success(`You are now connected with ${targetEntity.name}!`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to accept connection"),
      },
    );
  };

  const handleDecline = (targetEntity: Entity) => {
    respondMutation.mutate(
      { myOrgId: entity.id, otherOrgId: targetEntity.id, status: "declined" },
      {
        onSuccess: () => toast.info(`Request from ${targetEntity.name} declined`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to decline connection"),
      },
    );
  };

  const totalRequestsCount = receivedRequests.length + sentRequests.length;

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Matchmaking & Partnerships</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover verified partners for <span className="font-medium text-foreground">{entity.name}</span>, configure your sourcing criteria, and unlock showroom sample ordering.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="discover">
            Discover ({matches.length})
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5">
            <Sliders className="h-3.5 w-3.5" />
            Criteria
          </TabsTrigger>
          <TabsTrigger value="connected">
            Connected ({connectedEntities.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({totalRequestsCount})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Discover Matches */}
        <TabsContent value="discover" className="space-y-6">
          <AiPartnerSearch onFilters={setAiFilters} onSearchText={setTextSearch} />

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMaterial(null);
                setCategory(null);
              }}
              className={`rounded-full border px-2.5 py-0.5 text-xs ${!material && !category ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              All
            </button>
            {chipOptions.map((c) => {
              const active = isBrand ? category === c : material === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    isBrand ? setCategory(active ? null : c) : setMaterial(active ? null : c)
                  }
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                {matches.length} suggested partner{matches.length === 1 ? "" : "s"}
                <MatchScoreInfo />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Lead time</TableHead>
                    <TableHead>Why</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((m) => {
                    const status = getConnectionStatus(m.entity.id);
                    return (
                      <TableRow
                        key={m.entity.id}
                        className="cursor-pointer"
                        onClick={() => openWith(m)}
                      >
                        <TableCell>
                          <div className="font-medium hover:underline">{m.entity.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{m.entity.entityType} · {m.entity.country}</span>
                            {m.entity.operatingCountries &&
                              m.entity.operatingCountries.filter(
                                (c) => c.toLowerCase() !== (m.entity.country || "").toLowerCase(),
                              ).length > 0 && (
                                <span className="text-[10px] text-primary/80 font-medium">
                                  (+{m.entity.operatingCountries.filter(
                                    (c) => c.toLowerCase() !== (m.entity.country || "").toLowerCase(),
                                  ).join(", ")})
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            {status === "connected" ? (
                              <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-800 self-center">
                                <Check className="h-3 w-3" /> Connected
                              </Badge>
                            ) : status === "sent_pending" ? (
                              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 self-center">
                                <Clock className="h-3 w-3" /> Request Sent
                              </Badge>
                            ) : status === "received_pending" ? (
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAccept(m.entity);
                                }}
                              >
                                <Check className="mr-1 h-3.5 w-3.5" /> Accept Request
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConnect(m.entity);
                                }}
                              >
                                <UserPlus className="mr-1 h-3.5 w-3.5" /> Connect
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openWith(m, "message");
                              }}
                            >
                              <Send className="mr-1 h-3.5 w-3.5" /> Message
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.entity.actorType}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.entity.leadTimeDays || "—"} d
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {m.reasons.slice(0, 3).map((r: string) => (
                              <Badge key={r} variant="secondary" className="text-[10px] font-normal">
                                {r}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {matches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                        No partners matched your current search filters. Try clearing or broadening your search terms.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Sourcing Preferences & Criteria */}
        <TabsContent value="preferences" className="space-y-6">
          <MatchPreferencesTab orgId={entity.id} />
        </TabsContent>

        {/* Tab 3: Connected Partners */}
        <TabsContent value="connected" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Connected Partners ({connectedEntities.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {connectedEntities.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No connected partners yet. Use the Discover tab to connect with verified suppliers and brands.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {connectedEntities.map((item: Entity) => (
                    <Card key={item.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">{item.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {item.entityType} · {item.country}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">
                          Connected
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                        <span>Tier: {item.actorType}</span>
                        {item.leadTimeDays && <span>· Lead time: {item.leadTimeDays}d</span>}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button asChild size="sm" variant="outline" className="flex-1 text-xs gap-1">
                          <Link to="/directory/$id" params={{ id: item.id }}>
                            <User className="h-3.5 w-3.5" /> View Profile
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="flex-1 text-xs gap-1">
                          <Link to="/organizations/$id/showroom" params={{ id: item.id }}>
                            <Store className="h-3.5 w-3.5" /> View Showroom
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Requests (Incoming & Outgoing) */}
        <TabsContent value="requests" className="space-y-6">
          {/* Received Requests */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Inbox className="h-4 w-4 text-primary" />
                Received Requests ({receivedRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {receivedRequests.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  No incoming partnership requests waiting for your approval.
                </div>
              ) : (
                <div className="space-y-3">
                  {receivedRequests.map((item: Entity) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3 bg-card"
                    >
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.entityType} · {item.country} · {item.actorType}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAccept(item)} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDecline(item)} className="gap-1 text-red-600 hover:bg-red-50">
                          <X className="h-3.5 w-3.5" /> Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sent Requests */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Sent Requests ({sentRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {sentRequests.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  You haven't sent any outgoing connection requests yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((item: Entity) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3 bg-muted/20"
                    >
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.entityType} · {item.country} · {item.actorType}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Pending Response
                        </Badge>
                        <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => handleDecline(item)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MatchProfileSheet
        match={active}
        viewer={entity}
        open={open}
        onOpenChange={setOpen}
        initialAction={initialAction}
      />
    </div>
  );
}
