import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  FolderKanban,
  MessageSquare,
  Handshake,
  Award,
  AlertTriangle,
  Activity,
  Search,
  Rss,
} from "lucide-react";
import {
  formatRelative,
  KIND_META,
  type FeedEventKind,
  type FeedSeverity,
  type AdminFeedEvent,
} from "@/lib/admin-feed";
import { CommunityFeed } from "@/components/feed/CommunityFeed";
import { useQuery } from "@tanstack/react-query";
import { listPlatformActivity } from "@/lib/activity.functions";

export const Route = createFileRoute("/_authenticated/feed")({
  validateSearch: (search: Record<string, unknown>): { tab?: "activity" | "community" } =>
    search.tab === "community" || search.tab === "activity" ? { tab: search.tab } : {},
  head: () => ({
    meta: [
      { title: "Activity Feed — Global Chain Hub Admin" },
      {
        name: "description",
        content:
          "Platform-wide activity feed for the Global Chain Hub team: uploads, verifications, approvals, AI flags, and supply chain events across every organization.",
      },
    ],
  }),
  component: FeedPage,
});

const ICONS: Record<FeedEventKind, React.ComponentType<{ className?: string }>> = {
  upload: Upload,
  verification: ShieldCheck,
  approval: CheckCircle2,
  ai: Sparkles,
  project: FolderKanban,
  message: MessageSquare,
  partnership: Handshake,
  certification: Award,
  risk: AlertTriangle,
};

const SEV_TONE: Record<FeedSeverity, string> = {
  critical: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const SEV_DOT: Record<FeedSeverity, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  success: "bg-emerald-500",
};

type Range = "24h" | "7d" | "30d" | "all";
const RANGE_LABEL: Record<Range, string> = {
  "24h": "Last 24h",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

function withinRange(iso: string, range: Range): boolean {
  if (range === "all") return true;
  const hours = range === "24h" ? 24 : range === "7d" ? 24 * 7 : 24 * 30;
  return Date.now() - new Date(iso).getTime() <= hours * 3_600_000;
}

function groupByDay(events: AdminFeedEvent[]): { label: string; items: AdminFeedEvent[] }[] {
  const groups = new Map<string, AdminFeedEvent[]>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = today.getTime() - 86_400_000;
  for (const e of events) {
    const d = new Date(e.at);
    d.setHours(0, 0, 0, 0);
    const t = d.getTime();
    const label =
      t === today.getTime()
        ? "Today"
        : t === yesterday
          ? "Yesterday"
          : d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    const list = groups.get(label) ?? [];
    list.push(e);
    groups.set(label, list);
  }
  return Array.from(groups, ([label, items]) => ({ label, items }));
}

function FeedPage() {
  const { tab: tabParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab = tabParam ?? "activity";
  const setTab = (v: "activity" | "community") => navigate({ search: { tab: v }, replace: true });
  return (
    <AppShell>
      <div className="w-full space-y-6">
        <header className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Platform Operations Center
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Activity className="h-5 w-5 text-slate-600" /> Feed
          </h1>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "activity" | "community")}>
          <TabsList>
            <TabsTrigger value="activity">
              <Activity className="mr-1.5 h-3.5 w-3.5" /> Activity
            </TabsTrigger>
            <TabsTrigger value="community">
              <Rss className="mr-1.5 h-3.5 w-3.5" /> Community
            </TabsTrigger>
          </TabsList>
          <TabsContent value="activity" className="mt-4">
            <ActivityStream />
          </TabsContent>
          <TabsContent value="community" className="mt-4">
            <CommunityFeed />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function ActivityStream() {
  const { data: allData } = useQuery({
    queryKey: ["platform-activity"],
    queryFn: () => listPlatformActivity(),
    staleTime: 30_000,
  });
  const all = useMemo(() => allData ?? [], [allData]);
  const [kinds, setKinds] = useState<Set<FeedEventKind>>(new Set());
  const [severities, setSeverities] = useState<Set<FeedSeverity>>(new Set());
  const [range, setRange] = useState<Range>("7d");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(60);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((e) => {
      if (kinds.size && !kinds.has(e.kind)) return false;
      if (severities.size && !severities.has(e.severity)) return false;
      if (!withinRange(e.at, range)) return false;
      if (q) {
        const hay = `${e.orgName} ${e.title} ${e.detail} ${e.country}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, kinds, severities, range, query]);

  const visible = filtered.slice(0, limit);
  const grouped = groupByDay(visible);

  const counts: Record<FeedSeverity, number> = { critical: 0, warning: 0, info: 0, success: 0 };
  for (const e of filtered) counts[e.severity]++;

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  return (
    <div className="space-y-6">
      {/* summary + search */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(["critical", "warning", "info", "success"] as FeedSeverity[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(severities, s, setSeverities)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                    severities.has(s)
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${SEV_DOT[s]}`} />
                  <span className="capitalize">{s}</span>
                  <span className="tabular-nums opacity-70">{counts[s]}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-1 items-center gap-2 sm:max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search organization, country, event…"
                  className="h-9 pl-8"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(Object.keys(KIND_META) as FeedEventKind[]).map((k) => {
              const Icon = ICONS[k];
              const active = kinds.has(k);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggle(kinds, k, setKinds)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                    active
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {KIND_META[k].label}
                </button>
              );
            })}
            {(kinds.size > 0 || severities.size > 0 || query) && (
              <button
                type="button"
                onClick={() => {
                  setKinds(new Set());
                  setSeverities(new Set());
                  setQuery("");
                }}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Reset
              </button>
            )}
            <div className="ml-auto flex items-center gap-1">
              {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`rounded-md border px-2 py-1 text-[11px] transition ${
                    range === r
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {RANGE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* feed */}
      <Card className="shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">
            {filtered.length.toLocaleString()} events
          </CardTitle>
          <span className="text-xs text-muted-foreground">Showing {visible.length}</span>
        </CardHeader>
        <CardContent className="space-y-6">
          {grouped.map((g) => (
            <section key={g.label}>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {g.label}
              </div>
              <ul className="space-y-2">
                {g.items.map((e) => {
                  const Icon = ICONS[e.kind];
                  return (
                    <li
                      key={e.id}
                      className="flex items-start gap-3 rounded-md border bg-white p-3 transition hover:border-slate-300"
                    >
                      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={`shrink-0 ${SEV_TONE[e.severity]}`}>
                            {e.severity}
                          </Badge>
                          <Link
                            to="/organizations/$id"
                            params={{ id: e.orgId }}
                            title={e.title}
                            className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                          >
                            {e.title}
                          </Link>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{e.detail}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="truncate">{e.orgName}</span>
                          <span aria-hidden>·</span>
                          <span>{e.entityType}</span>
                          <span aria-hidden>·</span>
                          <span>{e.country}</span>
                          <span aria-hidden>·</span>
                          <span>{formatRelative(e.at)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No events match the current filters.
            </div>
          )}
          {limit < filtered.length && (
            <div className="pt-2 text-center">
              <Button variant="outline" size="sm" onClick={() => setLimit((n) => n + 60)}>
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
