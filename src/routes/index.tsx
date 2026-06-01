import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EcosystemGraph } from "@/components/EcosystemGraph";
import { EcosystemMap } from "@/components/EcosystemMap";
import { MessagesPanel } from "@/components/MessagesPanel";
import { UserDashboard } from "@/components/UserDashboard";
import { subscribeComms, unreadCountFor, type Participant } from "@/lib/messaging";
import { getCurrentUser, signOut, DEMO_ACCOUNTS, type AuthRole } from "@/lib/auth";
import { ensureSeed } from "@/lib/org.functions";
import { LogOut, LayoutDashboard, Sliders, Eye, HelpCircle, Map as MapIcon } from "lucide-react";
import { ORGS, USERS, EDGES, type OrgType as EcoOrgType } from "@/lib/ecosystem-data";
import {
  loadSettings, saveSettings, scorePair, topMatches, ecosystemMatchStats,
  FACTOR_META, ALL_CERTS, type MatchSettings, type MatchFactor,
} from "@/lib/matchmaking";
import {
  AlertTriangle,
  FileSearch,
  TrendingUp,
  Network,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Upload,
  Factory,
  Boxes,
  GitBranch,
  Inbox,
  Users,
  Settings2,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  BadgeCheck,
  CircleHelp,
  ArrowRight,
  ClipboardList,
  FileCheck2,
  PackageSearch,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ecosystem Intelligence — Role Workspaces" },
      {
        name: "description",
        content:
          "Role-based dashboards for brand, supplier, evidence, and admin operators plus the organization profile.",
      },
    ],
  }),
  component: Workspace,
});

type RoleId = "rahul" | "george" | "maria" | "admin" | "org";

const ROLES: {
  id: RoleId;
  name: string;
  role: string;
  org: string;
  initials: string;
  tone: string;
}[] = [
  { id: "rahul", name: "Rahul", role: "Brand Lead", org: "Acme Apparel", initials: "RA", tone: "bg-indigo-500" },
  { id: "george", name: "George", role: "Supplier Ops", org: "Northwind Mills", initials: "GE", tone: "bg-amber-500" },
  { id: "maria", name: "Maria", role: "Evidence Reviewer", org: "GCH Verification", initials: "MA", tone: "bg-emerald-500" },
  { id: "admin", name: "GCH Admin", role: "Platform Operator", org: "GCH", initials: "GC", tone: "bg-rose-500" },
  { id: "org", name: "Organization", role: "Profile & Setup", org: "Workspace", initials: "OR", tone: "bg-slate-500" },
];

function Workspace() {
  const navigate = useNavigate();
  const user = typeof window !== "undefined" ? getCurrentUser() : null;

  const seedFn = useServerFn(ensureSeed);
  useEffect(() => {
    if (!getCurrentUser()) navigate({ to: "/login" });
    else seedFn().catch((e: unknown) => console.warn("[seed]", e));
  }, [navigate, seedFn]);

  const isAdmin = user?.role === "admin";
  const initialRole = (user?.role as RoleId) ?? "rahul";

  // Non-admin: stick to their own role (+ Org Profile pill)
  const [active, setActive] = useState<RoleId>(initialRole);

  // Admin: tab + optional "view as" preview
  const [adminTab, setAdminTab] = useState<AdminTab>("overview");
  const [previewAs, setPreviewAs] = useState<RoleId | null>(null);

  const visibleRoles = useMemo(() => {
    if (isAdmin) return [];
    return ROLES.filter((r) => r.id === user?.role || r.id === "org");
  }, [isAdmin, user?.role]);

  const allowedIds = visibleRoles.map((r) => r.id);
  const safeActive: RoleId = allowedIds.includes(active) ? active : initialRole;

  // Resolve what to render
  const renderRole: RoleId | null = isAdmin ? previewAs : safeActive;
  const current = ROLES.find((r) => r.id === (renderRole ?? "admin"))!;

  const [messagesOpen, setMessagesOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!user) return;
    const refresh = () => setUnread(unreadCountFor(user.role as Participant));
    refresh();
    return subscribeComms(refresh);
  }, [user?.role]);

  if (!user) return null;

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
              <Network className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">GCH Ecosystem</div>
              <div className="text-[11px] text-muted-foreground">Enterprise traceability platform</div>
            </div>
          </div>

          {isAdmin ? (
            <nav className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
              {ADMIN_TABS.map((t) => {
                const Icon = t.icon;
                const isActive = !previewAs && adminTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setPreviewAs(null); setAdminTab(t.id); }}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          ) : (
            <nav className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
              {visibleRoles.map((r) => {
                const isActive = r.id === safeActive;
                return (
                  <button
                    key={r.id}
                    onClick={() => setActive(r.id)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ${r.tone}`}>
                      {r.initials}
                    </span>
                    {r.id === "org" ? "Org Profile" : r.name}
                  </button>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {isAdmin && (
              <label className="hidden items-center gap-1.5 text-[11px] text-muted-foreground md:flex">
                <Eye className="h-3.5 w-3.5" />
                View as
                <select
                  value={previewAs ?? ""}
                  onChange={(e) => setPreviewAs((e.target.value || null) as RoleId | null)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                >
                  <option value="">— admin —</option>
                  <option value="rahul">Rahul (Brand)</option>
                  <option value="george">George (Supplier)</option>
                  <option value="maria">Maria (Reviewer)</option>
                  <option value="org">Org Profile</option>
                </select>
              </label>
            )}
            <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-foreground">{user.name}</span>
            </div>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              How it works
            </Link>
            {(() => {
              const slug = DEMO_ACCOUNTS.find((a) => a.role === user.role)?.orgSlug;
              return slug ? (
                <Link
                  to="/org/$slug"
                  params={{ slug }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  My organisation
                </Link>
              ) : null;
            })()}
            <button
              onClick={() => setMessagesOpen(true)}
              className="relative inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Messages
              {unread > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </button>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
        {isAdmin && previewAs && (
          <div className="border-t border-border bg-amber-50 px-6 py-1.5 text-[11px] text-amber-800">
            Previewing as <span className="font-semibold">{ROLES.find((r) => r.id === previewAs)?.name}</span>. Read-only persona view.{" "}
            <button onClick={() => setPreviewAs(null)} className="font-semibold underline">Exit preview</button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {isAdmin && !previewAs ? "Platform Operator" : current.role}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {isAdmin && !previewAs
                ? ADMIN_TABS.find((t) => t.id === adminTab)!.heading
                : renderRole === "org"
                  ? "Organization profile"
                  : `${current.name}'s workspace`}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin && !previewAs
                ? ADMIN_TABS.find((t) => t.id === adminTab)!.subtitle
                : roleTagline((renderRole ?? "rahul") as RoleId)}
            </p>
          </div>
        </div>

        {isAdmin && !previewAs && <AdminDashboard tab={adminTab} />}
        {(!isAdmin || previewAs) && renderRole && renderRole !== "org" && renderRole !== "admin" && (
          <div className="mb-6">
            <UserDashboard user={{ ...user, role: renderRole as AuthRole, name: ROLES.find(r => r.id === renderRole)?.name ?? user.name }} />
          </div>
        )}
        {(!isAdmin || previewAs) && renderRole === "rahul" && <RahulDashboard />}
        {(!isAdmin || previewAs) && renderRole === "george" && <GeorgeDashboard />}
        {(!isAdmin || previewAs) && renderRole === "maria" && <MariaDashboard />}
        {(!isAdmin || previewAs) && renderRole === "org" && <OrgProfile />}
      </main>

      {messagesOpen && (
        <MessagesPanel me={user.role as Participant} onClose={() => setMessagesOpen(false)} />
      )}
    </div>
  );
}

type AdminTab = "overview" | "orgs" | "matchmaking";
const ADMIN_TABS: { id: AdminTab; label: string; heading: string; subtitle: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview",    label: "Overview",          heading: "Ecosystem overview",        subtitle: "Live graph of organizations, connections, and confidence.", icon: LayoutDashboard },
  { id: "orgs",        label: "Orgs & Users",      heading: "Organizations & users",     subtitle: "Manage every organization and user on the platform.",       icon: Users },
  { id: "matchmaking", label: "Matchmaking",       heading: "Matchmaking settings",      subtitle: "Tune the algorithm that powers ecosystem suggestions.",     icon: Sliders },
];


function roleTagline(id: RoleId) {
  switch (id) {
    case "rahul":
      return "Brand & product traceability with incoming partner requests.";
    case "george":
      return "Supplier tasks, evidence uploads, and live production updates.";
    case "maria":
      return "Evidence review queue, missing data, and partner coordination.";
    case "admin":
      return "Ecosystem control: users, organizations, matching rules, and confidence governance.";
    case "org":
      return "Set up your organization, dynamic fields, and verification.";
  }
}

/* ---------------- Shared primitives ---------------- */

function Panel({
  title,
  subtitle,
  children,
  right,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 shadow-sm ${className}`}>
      {(title || right) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  delta,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ReactNode;
  tone?: "default" | "good" | "warn" | "risk";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "risk"
          ? "text-rose-600"
          : "text-muted-foreground";
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {delta && <span className={`text-xs font-medium ${toneClass}`}>{delta}</span>}
      </div>
    </div>
  );
}

function Pill({ tone, children }: { tone: "good" | "warn" | "risk" | "info"; children: React.ReactNode }) {
  const map = {
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    risk: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}

/* ---------------- Matchmaking (per-persona) ---------------- */

type MatchVariant = "rahul" | "george" | "maria";

const MATCH_CONFIG: Record<
  MatchVariant,
  {
    title: string;
    subtitle: string;
    primaryLabel: string;
    secondaryLabel: string;
    matches: { name: string; reason: string; score: number; meta: string }[];
  }
> = {
  rahul: {
    title: "Matchmaking · Suggested suppliers & verifiers",
    subtitle: "AI-ranked partners that fill gaps in your product tiers",
    primaryLabel: "Invite to connect",
    secondaryLabel: "Request evidence",
    matches: [
      { name: "Tyrell Dyeworks", reason: "Fills Tier-2 dye gap for Hemp Knit Sweater", score: 92, meta: "GOTS · 38km · Tier 2" },
      { name: "Soylent Fiber Co.", reason: "Organic cotton at scale, matches OC-001 spec", score: 88, meta: "RCS · India · Tier 3" },
      { name: "Hooli Knit", reason: "Knitting capacity for Q4 launch window", score: 81, meta: "Oeko-Tex · Portugal · Tier 2" },
      { name: "Stark Verification", reason: "Independent auditor for upcoming SMETA cycle", score: 76, meta: "SMETA 4P · Verifier" },
      { name: "Northwind Mills", reason: "Existing partner — expand to Linen Trouser line", score: 71, meta: "GOTS · Tier 2" },
    ],
  },
  george: {
    title: "Matchmaking · Brand opportunities",
    subtitle: "Brands actively sourcing capacity that matches your facility",
    primaryLabel: "Express interest",
    secondaryLabel: "Send capability deck",
    matches: [
      { name: "Acme Apparel", reason: "Needs GOTS-certified knitting, 12k units / month", score: 88, meta: "8-wk lead · GOTS required" },
      { name: "Lumon Outerwear", reason: "Recycled fiber capacity for AW26 collection", score: 84, meta: "20k units · RCS preferred" },
      { name: "Initech Basics", reason: "Backup supplier for organic cotton tees", score: 78, meta: "6-wk lead · 5k units" },
      { name: "Cyberdyne Active", reason: "Performance knit pilot, low MOQ", score: 73, meta: "MOQ 800 · pilot batch" },
      { name: "Wayne Heritage", reason: "Linen / hemp blend exploration", score: 68, meta: "Sample stage · EU only" },
    ],
  },
  maria: {
    title: "Matchmaking · Verification assignments",
    subtitle: "Partner pairs routed to you for evidence review",
    primaryLabel: "Claim review",
    secondaryLabel: "Reassign",
    matches: [
      { name: "Acme ↔ Northwind", reason: "Chain-of-custody review for OC-001 shipment", score: 94, meta: "SLA 24h · Medium complexity" },
      { name: "Acme ↔ Tyrell", reason: "SMETA corrective action follow-up", score: 89, meta: "SLA 48h · High complexity" },
      { name: "Lumon ↔ Hooli", reason: "Geolocation evidence validation", score: 82, meta: "SLA 24h · Low complexity" },
      { name: "Initech ↔ Soylent", reason: "RCS certificate scope check", score: 77, meta: "SLA 72h · Low complexity" },
      { name: "Wayne ↔ Umbrella", reason: "Effluent treatment cert renewal", score: 71, meta: "SLA 48h · Medium complexity" },
    ],
  },
};

function MatchmakingPanel({ variant }: { variant: MatchVariant }) {
  const cfg = MATCH_CONFIG[variant];
  return (
    <Panel
      title={cfg.title}
      subtitle={cfg.subtitle}
      right={<Pill tone="info">{cfg.matches.length} suggestions</Pill>}
    >
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cfg.matches.map((m) => {
          const tone: "good" | "warn" | "info" =
            m.score >= 85 ? "good" : m.score >= 75 ? "info" : "warn";
          return (
            <li key={m.name} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{m.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{m.reason}</div>
                </div>
                <Pill tone={tone}>{m.score}% match</Pill>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">{m.meta}</div>
              <div className="mt-3 flex gap-2">
                <button className="rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background hover:opacity-90">
                  {cfg.primaryLabel}
                </button>
                <button className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted">
                  {cfg.secondaryLabel}
                </button>
                <button className="ml-auto rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
                  Dismiss
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}



/* ---------------- Rahul: Brand & Product Traceability ---------------- */

function RahulDashboard() {
  const products = [
    { name: "Organic Cotton Tee", sku: "ACM-OC-001", tier: 4, trace: 92, risk: "low" },
    { name: "Recycled Denim Jacket", sku: "ACM-RD-014", tier: 3, trace: 71, risk: "med" },
    { name: "Hemp Knit Sweater", sku: "ACM-HK-022", tier: 2, trace: 48, risk: "high" },
    { name: "Linen Trouser", sku: "ACM-LT-007", tier: 4, trace: 86, risk: "low" },
  ];
  const requests = [
    { from: "Northwind Mills", type: "Supplier onboarding", age: "2h" },
    { from: "Tyrell Dyeworks", type: "Evidence share", age: "5h" },
    { from: "Stark Logistics", type: "Connect as Tier-2", age: "1d" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Boxes className="h-3.5 w-3.5" />} label="Active products" value="48" delta="+3" tone="good" />
        <Stat icon={<GitBranch className="h-3.5 w-3.5" />} label="Avg. trace depth" value="3.6 tiers" delta="+0.2" tone="good" />
        <Stat icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Verified suppliers" value="62%" delta="+4%" tone="good" />
        <Stat icon={<Inbox className="h-3.5 w-3.5" />} label="Open partner requests" value="7" delta="+2" tone="warn" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Product traceability" subtitle="Tier coverage and evidence quality" className="lg:col-span-2">
          <div className="divide-y divide-border">
            {products.map((p) => (
              <div key={p.sku} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <PackageSearch className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{p.name}</span>
                    <span className="text-[11px] text-muted-foreground">{p.sku}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${p.trace > 80 ? "bg-emerald-500" : p.trace > 60 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${p.trace}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{p.trace}% traced · Tier {p.tier}</span>
                  </div>
                </div>
                <Pill tone={p.risk === "low" ? "good" : p.risk === "med" ? "warn" : "risk"}>
                  {p.risk === "low" ? "Low risk" : p.risk === "med" ? "Watch" : "At risk"}
                </Pill>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Partner requests" subtitle="Awaiting your response" right={<Pill tone="info">{requests.length} pending</Pill>}>
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.from} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{r.from}</span>
                  <span className="text-[11px] text-muted-foreground">{r.age}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.type}</p>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background hover:opacity-90">
                    Accept
                  </button>
                  <button className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted">
                    Review
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <MatchmakingPanel variant="rahul" />
    </div>
  );
}

/* ---------------- George: Supplier Ops ---------------- */

function GeorgeDashboard() {
  const tasks = [
    { title: "Upload Q3 chain-of-custody for OC-001", due: "Today", priority: "high" },
    { title: "Confirm dye lot batch #DB-7741", due: "Tomorrow", priority: "med" },
    { title: "Sign updated MSA with Acme Apparel", due: "Fri", priority: "med" },
    { title: "Add factory geolocation evidence", due: "Mon", priority: "low" },
  ];
  const uploads = [
    { name: "GOTS_cert_2025.pdf", status: "Accepted", when: "2h ago" },
    { name: "shipment_BoL_4421.pdf", status: "In review", when: "6h ago" },
    { name: "audit_smeta_apr.pdf", status: "Missing fields", when: "1d ago" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<ClipboardList className="h-3.5 w-3.5" />} label="Open tasks" value="11" delta="-2" tone="good" />
        <Stat icon={<Upload className="h-3.5 w-3.5" />} label="Evidence this week" value="18" delta="+6" tone="good" />
        <Stat icon={<Factory className="h-3.5 w-3.5" />} label="Production lines live" value="4 / 5" tone="warn" />
        <Stat icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Overdue items" value="2" delta="-1" tone="warn" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Today's supplier tasks" subtitle="Issued by brand partners" className="lg:col-span-2">
          <ul className="divide-y divide-border">
            {tasks.map((t) => (
              <li key={t.title} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">{t.title}</div>
                  <div className="text-[11px] text-muted-foreground">Due {t.due}</div>
                </div>
                <Pill tone={t.priority === "high" ? "risk" : t.priority === "med" ? "warn" : "info"}>
                  {t.priority}
                </Pill>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent evidence uploads">
          <ul className="space-y-2">
            {uploads.map((u) => (
              <li key={u.name} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm text-foreground">{u.name}</div>
                  <div className="text-[11px] text-muted-foreground">{u.when}</div>
                </div>
                <Pill
                  tone={u.status === "Accepted" ? "good" : u.status === "In review" ? "info" : "warn"}
                >
                  {u.status}
                </Pill>
              </li>
            ))}
          </ul>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted">
            <Upload className="h-3.5 w-3.5" /> Upload evidence
          </button>
        </Panel>
      </div>

      <Panel title="Production updates" subtitle="Live status from connected factories">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { line: "Knitting · Line A", state: "Running", pct: 78, tone: "good" as const },
            { line: "Dyeing · Line B", state: "Pending dye lot", pct: 35, tone: "warn" as const },
            { line: "Cut & Sew · Line C", state: "On schedule", pct: 62, tone: "good" as const },
          ].map((p) => (
            <div key={p.line} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{p.line}</span>
                <Pill tone={p.tone}>{p.state}</Pill>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-foreground" style={{ width: `${p.pct}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{p.pct}% of weekly target</div>
            </div>
          ))}
        </div>
      </Panel>

      <MatchmakingPanel variant="george" />
    </div>
  );
}

/* ---------------- Maria: Evidence Reviewer ---------------- */

function MariaDashboard() {
  const queue = [
    { doc: "GOTS_cert_2025.pdf", from: "Northwind Mills", type: "Certification", conf: 0.88 },
    { doc: "audit_smeta_apr.pdf", from: "Tyrell Dyeworks", type: "Social audit", conf: 0.54 },
    { doc: "shipment_BoL_4421.pdf", from: "Stark Logistics", type: "Chain of custody", conf: 0.72 },
    { doc: "factory_geo.json", from: "Hooli Knit", type: "Geolocation", conf: 0.41 },
  ];
  const missing = [
    { entity: "Hooli Knit", field: "Worker headcount", since: "12d" },
    { entity: "Soylent Fiber", field: "Subcontractor list", since: "5d" },
    { entity: "Umbrella Dye", field: "Effluent treatment cert", since: "21d" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<FileCheck2 className="h-3.5 w-3.5" />} label="In review queue" value="23" tone="warn" />
        <Stat icon={<FileSearch className="h-3.5 w-3.5" />} label="Missing data items" value="14" tone="risk" />
        <Stat icon={<Users className="h-3.5 w-3.5" />} label="Partners coordinating" value="9" tone="good" />
        <Stat icon={<TrendingUp className="h-3.5 w-3.5" />} label="Avg. review SLA" value="1.4d" delta="-0.3d" tone="good" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Evidence review queue" className="lg:col-span-2">
          <ul className="divide-y divide-border">
            {queue.map((q) => (
              <li key={q.doc} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{q.doc}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {q.type} · from {q.from}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{Math.round(q.conf * 100)}%</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${q.conf > 0.75 ? "bg-emerald-500" : q.conf > 0.55 ? "bg-amber-500" : "bg-rose-500"}`}
                      style={{ width: `${q.conf * 100}%` }}
                    />
                  </div>
                  <button className="ml-2 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background">
                    Review
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Missing data" subtitle="Outstanding requests to partners">
          <ul className="space-y-2">
            {missing.map((m) => (
              <li key={m.entity + m.field} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{m.entity}</span>
                  <Pill tone="warn">{m.since} open</Pill>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{m.field}</div>
                <button className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:underline">
                  Nudge partner <ArrowRight className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Partner coordination" subtitle="Active threads">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { partner: "Northwind Mills", thread: "Clarifying GOTS scope", unread: 2 },
            { partner: "Tyrell Dyeworks", thread: "Audit corrective actions", unread: 0 },
            { partner: "Hooli Knit", thread: "Geolocation evidence format", unread: 1 },
          ].map((c) => (
            <div key={c.partner} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{c.partner}</span>
                {c.unread > 0 && <Pill tone="info">{c.unread} new</Pill>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.thread}</p>
            </div>
          ))}
        </div>
      </Panel>

      <MatchmakingPanel variant="maria" />
    </div>
  );
}

/* ---------------- GCH Admin: Ecosystem Control ---------------- */

function AdminDashboard({ tab }: { tab: AdminTab }) {
  const [settings, setSettings] = useState<MatchSettings>(() => loadSettings());
  useEffect(() => { saveSettings(settings); }, [settings]);

  if (tab === "overview")    return <AdminOverview settings={settings} />;
  if (tab === "orgs")        return <AdminOrgsUsers />;
  return <AdminMatchmaking settings={settings} setSettings={setSettings} />;
}

/* ----- Overview ----- */

function AdminOverview({ settings }: { settings: MatchSettings }) {
  const [selectedId, setSelectedId] = useState<string | null>("acme");
  const [typeFilters, setTypeFilters] = useState<EcoOrgType[]>([]);
  const [region, setRegion] = useState<string>("all");
  const [onlyRisk, setOnlyRisk] = useState(false);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [coreOnly, setCoreOnly] = useState(true);
  const [view, setView] = useState<"graph" | "map">("graph");

  const selected = ORGS.find((o) => o.id === selectedId) ?? null;
  const suggestions = useMemo(
    () => (selected ? topMatches(selected.id, settings, 5) : []),
    [selected, settings],
  );
  const stats = useMemo(() => ecosystemMatchStats(settings), [settings]);

  const toggleType = (t: EcoOrgType) =>
    setTypeFilters((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const counts = useMemo(() => {
    const c: Record<EcoOrgType, number> = { brand: 0, supplier: 0, verifier: 0, regulator: 0 };
    ORGS.forEach((o) => { c[o.type]++; });
    return c;
  }, []);

  const riskCount = ORGS.filter((o) => o.risk > 0.6).length;
  const missingEdges = EDGES.filter((e) => e.evidenceCount === 0).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Network className="h-3.5 w-3.5" />}     label="Organizations"      value={String(ORGS.length)} tone="default" />
        <Stat icon={<Users className="h-3.5 w-3.5" />}        label="Active users"       value={String(USERS.filter(u => u.status === "Active").length)} tone="good" />
        <Stat icon={<GitBranch className="h-3.5 w-3.5" />}    label="Connections"        value={String(EDGES.length)} tone="default" />
        <Stat icon={<ShieldAlert className="h-3.5 w-3.5" />}  label="High-risk nodes"    value={String(riskCount)} tone="risk" />
      </div>

      {/* Graph + side detail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Ecosystem graph"
          subtitle="Color = type · size = company size · halo = risk · dashed = missing evidence"
          right={
            <div className="hidden gap-3 text-[11px] text-muted-foreground md:flex">
              <Legend dot="#f59e0b" label={`Brands · ${counts.brand}`} />
              <Legend dot="#38bdf8" label={`Suppliers · ${counts.supplier}`} />
              <Legend dot="#34d399" label={`Verifiers · ${counts.verifier}`} />
              <Legend dot="#a78bfa" label={`Regulators · ${counts.regulator}`} />
            </div>
          }
        >
          {/* Filter chips */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(["brand","supplier","verifier","regulator"] as EcoOrgType[]).map((t) => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                  typeFilters.includes(t) || typeFilters.length === 0
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground"
            >
              <option value="all">All regions</option>
              <option value="EU">EU</option>
              <option value="Americas">Americas</option>
              <option value="APAC">APAC</option>
              <option value="MEA">MEA</option>
            </select>
            <button
              onClick={() => setOnlyRisk((v) => !v)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                onlyRisk ? "border-rose-500 bg-rose-50 text-rose-700" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Only risk
            </button>
            <button
              onClick={() => setOnlyMissing((v) => !v)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                onlyMissing ? "border-amber-500 bg-amber-50 text-amber-700" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Missing evidence ({missingEdges})
            </button>
            <div className="ml-auto inline-flex overflow-hidden rounded-full border border-border text-[11px] font-medium">
              <button
                onClick={() => setView("graph")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 transition-colors ${view === "graph" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Network className="h-3 w-3" /> Graph
              </button>
              <button
                onClick={() => setView("map")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 transition-colors ${view === "map" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                <MapIcon className="h-3 w-3" /> Map
              </button>
            </div>
            {view === "graph" && (
              <div className="inline-flex overflow-hidden rounded-full border border-border text-[11px] font-medium">
                <button
                  onClick={() => setCoreOnly(true)}
                  className={`px-2.5 py-1 transition-colors ${coreOnly ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Core (6)
                </button>
                <button
                  onClick={() => setCoreOnly(false)}
                  className={`px-2.5 py-1 transition-colors ${!coreOnly ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Full ecosystem
                </button>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-slate-950">
            <div className="aspect-[16/9] w-full">
              {view === "graph" ? (
                <EcosystemGraph
                  coreOnly={coreOnly}
                  filters={{
                    types: typeFilters,
                    region,
                    onlyRisk,
                    onlyMissingEvidence: onlyMissing,
                  }}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              ) : (
                <EcosystemMap selectedId={selectedId} onSelect={setSelectedId} />
              )}
            </div>
          </div>
        </Panel>

        {/* Side detail */}
        <div className="space-y-6">
          <Panel title="Node detail" subtitle={selected ? "Click any node to inspect" : "Select a node"}>
            {selected ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{selected.name}</div>
                  <div className="text-[11px] capitalize text-muted-foreground">
                    {selected.type} · Tier {selected.tier} · {selected.country} · Size {selected.size}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <Mini label="Confidence" value={`${Math.round(selected.confidence * 100)}%`} tone={selected.confidence > 0.75 ? "good" : selected.confidence > 0.55 ? "warn" : "risk"} />
                  <Mini label="Risk"       value={`${Math.round(selected.risk * 100)}%`}       tone={selected.risk < 0.3 ? "good" : selected.risk < 0.6 ? "warn" : "risk"} />
                  <Mini label="Users"      value={String(selected.users)} tone="info" />
                  <Mini label="Status"     value={selected.status} tone={selected.status === "Verified" ? "good" : selected.status === "Pending" ? "warn" : "risk"} />
                </div>
                {selected.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selected.certifications.map((c) => (
                      <span key={c} className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No selection.</p>
            )}
          </Panel>

          <Panel title="Suggested matches" subtitle="From current matchmaking settings" right={<Pill tone="info">{suggestions.length}</Pill>}>
            {suggestions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No candidates pass the current filters.</p>
            ) : (
              <ul className="space-y-2">
                {suggestions.map((s) => (
                  <li key={s.org.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-foreground">{s.org.name}</div>
                      <div className="text-[10px] capitalize text-muted-foreground">{s.org.type} · {s.org.country}</div>
                    </div>
                    <Pill tone={s.score >= settings.thresholds.autoAccept ? "good" : s.score >= settings.thresholds.reject ? "warn" : "risk"}>
                      {s.score}%
                    </Pill>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* Match summary */}
      <Panel title="Matchmaking summary" subtitle="What current settings would do across the ecosystem">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon={<GitBranch className="h-3.5 w-3.5" />}    label="Candidate pairs"   value={String(stats.pairs)} tone="default" />
          <Stat icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Auto-accept"       value={String(stats.auto)}  tone="good" />
          <Stat icon={<Clock className="h-3.5 w-3.5" />}        label="Manual review"     value={String(stats.review)} tone="warn" />
          <Stat icon={<ShieldAlert className="h-3.5 w-3.5" />}  label="Below threshold"   value={String(stats.reject)} tone="risk" />
        </div>
      </Panel>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
      {label}
    </span>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "risk" | "info" }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{value}</span>
        <Pill tone={tone}>·</Pill>
      </div>
    </div>
  );
}

/* ----- Orgs & Users ----- */

function AdminOrgsUsers() {
  const [typeF, setTypeF] = useState<EcoOrgType | "all">("all");
  const [statusF, setStatusF] = useState<string>("all");
  const [q, setQ] = useState("");

  const orgs = ORGS.filter((o) =>
    (typeF === "all" || o.type === typeF) &&
    (statusF === "all" || o.status === statusF) &&
    (q === "" || o.name.toLowerCase().includes(q.toLowerCase()) || o.country.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <Panel title="Organizations" subtitle={`${orgs.length} of ${ORGS.length} shown`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or country…"
            className="w-56 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
          />
          <select value={typeF} onChange={(e) => setTypeF(e.target.value as EcoOrgType | "all")} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground">
            <option value="all">All types</option>
            <option value="brand">Brand</option>
            <option value="supplier">Supplier</option>
            <option value="verifier">Verifier</option>
            <option value="regulator">Regulator</option>
          </select>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground">
            <option value="all">Any status</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Flagged">Flagged</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">Organization</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Country</th>
                <th className="py-2 pr-3 font-medium">Size</th>
                <th className="py-2 pr-3 font-medium">Users</th>
                <th className="py-2 pr-3 font-medium">Confidence</th>
                <th className="py-2 pr-3 font-medium">Risk</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Last active</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="py-2 pr-3 font-medium text-foreground">{o.name}</td>
                  <td className="py-2 pr-3 capitalize text-muted-foreground">{o.type}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{o.country}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{o.size}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{o.users}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{Math.round(o.confidence * 100)}%</td>
                  <td className="py-2 pr-3 text-muted-foreground">{Math.round(o.risk * 100)}%</td>
                  <td className="py-2 pr-3"><Pill tone={o.status === "Verified" ? "good" : o.status === "Pending" ? "warn" : "risk"}>{o.status}</Pill></td>
                  <td className="py-2 pr-3 text-muted-foreground">{o.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Users" subtitle={`${USERS.length} accounts`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Email</th>
                <th className="py-2 pr-3 font-medium">Organization</th>
                <th className="py-2 pr-3 font-medium">Role</th>
                <th className="py-2 pr-3 font-medium">Last login</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {USERS.map((u) => {
                const org = ORGS.find((o) => o.id === u.orgId);
                return (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="py-2 pr-3 font-medium text-foreground">{u.name}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{u.email}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{org?.name ?? "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{u.role}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{u.lastLogin}</td>
                    <td className="py-2 pr-3"><Pill tone={u.status === "Active" ? "good" : u.status === "Invited" ? "info" : "risk"}>{u.status}</Pill></td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-1">
                        <button className="rounded-md border border-border px-2 py-0.5 text-[11px] hover:bg-muted">Edit</button>
                        <button className="rounded-md border border-border px-2 py-0.5 text-[11px] hover:bg-muted">Suspend</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ----- Matchmaking settings ----- */

function AdminMatchmaking({
  settings, setSettings,
}: { settings: MatchSettings; setSettings: (s: MatchSettings) => void }) {
  const stats = useMemo(() => ecosystemMatchStats(settings), [settings]);

  const update = (patch: Partial<MatchSettings>) => setSettings({ ...settings, ...patch });
  const setWeight = (f: MatchFactor, v: number) =>
    update({ weights: { ...settings.weights, [f]: v } });
  const toggleRule = (f: MatchFactor) =>
    update({ rules: { ...settings.rules, [f]: !settings.rules[f] } });
  const updateFilters = (patch: Partial<MatchSettings["filters"]>) =>
    update({ filters: { ...settings.filters, ...patch } });
  const updateThresholds = (patch: Partial<MatchSettings["thresholds"]>) =>
    update({ thresholds: { ...settings.thresholds, ...patch } });

  return (
    <div className="space-y-6">
      {/* Live preview */}
      <Panel
        title="Algorithm live preview"
        subtitle="Recomputed instantly against the entire ecosystem"
        right={
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
            />
            Matchmaking enabled
          </label>
        }
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon={<GitBranch className="h-3.5 w-3.5" />}    label="Candidate pairs" value={String(stats.pairs)}  tone="default" />
          <Stat icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Auto-accept"     value={String(stats.auto)}   tone="good" />
          <Stat icon={<Clock className="h-3.5 w-3.5" />}        label="Manual review"   value={String(stats.review)} tone="warn" />
          <Stat icon={<ShieldAlert className="h-3.5 w-3.5" />}  label="Below threshold" value={String(stats.reject)} tone="risk" />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weights & rules */}
        <Panel title="Scoring factors" subtitle="Toggle a factor off, or drag its weight">
          <ul className="space-y-3">
            {(Object.keys(FACTOR_META) as MatchFactor[]).map((f) => {
              const meta = FACTOR_META[f];
              const enabled = settings.rules[f];
              return (
                <li key={f} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{meta.label}</div>
                      <div className="text-[11px] text-muted-foreground">{meta.description}</div>
                    </div>
                    <label className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                      <input type="checkbox" checked={enabled} onChange={() => toggleRule(f)} />
                      on
                    </label>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="range" min={0} max={100} step={5}
                      value={settings.weights[f]}
                      disabled={!enabled}
                      onChange={(e) => setWeight(f, Number(e.target.value))}
                      className="w-full accent-foreground disabled:opacity-40"
                    />
                    <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">
                      {settings.weights[f]}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Hard filters */}
        <div className="space-y-6">
          <Panel title="Hard filters" subtitle="Candidates failing any of these are excluded">
            <div className="space-y-3">
              <Row>
                <span>Same country only</span>
                <input
                  type="checkbox"
                  checked={settings.filters.sameCountryOnly}
                  onChange={(e) => updateFilters({ sameCountryOnly: e.target.checked })}
                />
              </Row>
              <Row>
                <span>Same region only</span>
                <input
                  type="checkbox"
                  checked={settings.filters.sameRegionOnly}
                  onChange={(e) => updateFilters({ sameRegionOnly: e.target.checked })}
                />
              </Row>
              <Row>
                <span>Minimum company size</span>
                <select
                  value={settings.filters.minSize}
                  onChange={(e) => updateFilters({ minSize: e.target.value as "S" | "M" | "L" })}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                >
                  <option value="S">S — any</option>
                  <option value="M">M — mid+</option>
                  <option value="L">L — large only</option>
                </select>
              </Row>
              <Row>
                <span>Exclude risk &gt;</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min={0} max={100} step={5}
                    value={Math.round(settings.filters.maxRisk * 100)}
                    onChange={(e) => updateFilters({ maxRisk: Number(e.target.value) / 100 })}
                    className="w-32 accent-foreground"
                  />
                  <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">
                    {Math.round(settings.filters.maxRisk * 100)}%
                  </span>
                </div>
              </Row>
              <div>
                <div className="mb-1 text-xs text-foreground">Required certifications</div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_CERTS.map((c) => {
                    const on = settings.filters.requiredCerts.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() =>
                          updateFilters({
                            requiredCerts: on
                              ? settings.filters.requiredCerts.filter((x) => x !== c)
                              : [...settings.filters.requiredCerts, c],
                          })
                        }
                        className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                          on
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Confidence governance" subtitle="Score thresholds for the algorithm's outputs">
            <div className="space-y-3">
              <Row>
                <span>Auto-accept ≥</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min={50} max={100} step={1}
                    value={settings.thresholds.autoAccept}
                    onChange={(e) => updateThresholds({ autoAccept: Number(e.target.value) })}
                    className="w-32 accent-foreground"
                  />
                  <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">{settings.thresholds.autoAccept}%</span>
                </div>
              </Row>
              <Row>
                <span>Reject &lt;</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min={0} max={80} step={1}
                    value={settings.thresholds.reject}
                    onChange={(e) => updateThresholds({ reject: Number(e.target.value) })}
                    className="w-32 accent-foreground"
                  />
                  <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">{settings.thresholds.reject}%</span>
                </div>
              </Row>
              <p className="text-[11px] text-muted-foreground">
                Scores between are routed to a human reviewer (Maria).
              </p>
            </div>
          </Panel>

          <div className="flex justify-end">
            <button
              onClick={() => setSettings({ ...settings })}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Settings auto-save to this browser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 text-xs text-foreground">{children}</div>;
}


/* ---------------- Organization Profile ---------------- */

const ORG_TYPES = [
  { id: "brand", label: "Brand", icon: Building2, desc: "Sells finished products to consumers." },
  { id: "supplier", label: "Supplier / Manufacturer", icon: Factory, desc: "Produces goods, components, or materials." },
  { id: "verifier", label: "Verifier / Auditor", icon: ShieldCheck, desc: "Reviews evidence and issues attestations." },
  { id: "ngo", label: "NGO / Regulator", icon: Globe, desc: "Observes, governs, or sets policy." },
] as const;

type OrgType = (typeof ORG_TYPES)[number]["id"];

function OrgProfile() {
  const [type, setType] = useState<OrgType>("brand");
  const [fields, setFields] = useState<Record<string, string>>({
    name: "Acme Apparel",
    country: "Portugal",
    website: "acme-apparel.com",
  });
  const [channel, setChannel] = useState<"email" | "platform" | "sms">("platform");

  const dynamicFields = useMemo(() => fieldsForType(type), [type]);

  const allFields = ["name", "country", "website", ...dynamicFields.map((f) => f.key)];
  const filled = allFields.filter((k) => (fields[k] ?? "").trim().length > 0).length;
  const completeness = Math.round((filled / allFields.length) * 100);

  const verified = completeness >= 80;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left rail: status */}
      <div className="space-y-6 lg:col-span-1">
        <Panel title="Profile completeness" subtitle="Affects matching and discoverability">
          <div className="flex items-end justify-between">
            <span className="text-4xl font-semibold text-foreground">{completeness}%</span>
            <Pill tone={completeness >= 80 ? "good" : completeness >= 50 ? "warn" : "risk"}>
              {completeness >= 80 ? "Strong" : completeness >= 50 ? "Improving" : "Incomplete"}
            </Pill>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${completeness >= 80 ? "bg-emerald-500" : completeness >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {filled} of {allFields.length} fields complete. Fill required fields to unlock partner discovery.
          </p>
        </Panel>

        <Panel title="Verification status">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {verified ? <BadgeCheck className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {verified ? "Verified organization" : "Verification pending"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {verified
                  ? "Last reviewed by GCH on May 12, 2026"
                  : "Complete profile to ≥ 80% to submit for review"}
              </div>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-xs">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Domain ownership</span>
              <Pill tone="good">verified</Pill>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Legal entity</span>
              <Pill tone={verified ? "good" : "warn"}>{verified ? "verified" : "pending"}</Pill>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Authorized signatory</span>
              <Pill tone={verified ? "good" : "warn"}>{verified ? "verified" : "pending"}</Pill>
            </li>
          </ul>
        </Panel>

        <Panel title="Preferred communication channel">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "platform", label: "In-app", icon: MessageSquare },
              { id: "email", label: "Email", icon: Mail },
              { id: "sms", label: "SMS", icon: Phone },
            ].map((c) => {
              const Active = c.id === channel;
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  onClick={() => setChannel(c.id as typeof channel)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs transition-colors ${
                    Active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {c.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Partner requests and evidence notifications will use this channel.
          </p>
        </Panel>
      </div>

      {/* Right: type + dynamic fields */}
      <div className="space-y-6 lg:col-span-2">
        <Panel
          title="Organization type"
          subtitle="This decides which profile fields and workflows you'll see across the platform."
          right={<Pill tone="info"><CircleHelp className="h-3 w-3" /> Required</Pill>}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ORG_TYPES.map((t) => {
              const Active = t.id === type;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                    Active
                      ? "border-foreground bg-foreground/[0.04] ring-2 ring-foreground/10"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      Active ? "bg-foreground text-background" : "bg-muted text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{t.label}</span>
                      {Active && <Pill tone="good">selected</Pill>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel
          title="Profile details"
          subtitle={`Fields shown for ${ORG_TYPES.find((t) => t.id === type)!.label.toLowerCase()}`}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Organization name"
              required
              value={fields.name ?? ""}
              onChange={(v) => setFields({ ...fields, name: v })}
            />
            <Field
              label="Country / HQ"
              required
              value={fields.country ?? ""}
              onChange={(v) => setFields({ ...fields, country: v })}
            />
            <Field
              label="Website"
              value={fields.website ?? ""}
              onChange={(v) => setFields({ ...fields, website: v })}
            />
            {dynamicFields.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                placeholder={f.placeholder}
                required={f.required}
                value={fields[f.key] ?? ""}
                onChange={(v) => setFields({ ...fields, [f.key]: v })}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <p className="text-[11px] text-muted-foreground">
              Changes save automatically. Verification re-runs on major updates.
            </p>
            <button className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90">
              {verified ? "Resubmit for review" : "Submit for verification"}
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-xs font-medium text-foreground">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-foreground focus:outline-none"
      />
    </label>
  );
}

function fieldsForType(type: OrgType): { key: string; label: string; placeholder?: string; required?: boolean }[] {
  switch (type) {
    case "brand":
      return [
        { key: "categories", label: "Product categories", placeholder: "Apparel, footwear…", required: true },
        { key: "annualVolume", label: "Annual production volume", placeholder: "e.g. 1.2M units" },
        { key: "tiersMapped", label: "Tiers currently mapped", placeholder: "Tier 1–4" },
        { key: "sustainabilityLead", label: "Sustainability lead contact" },
      ];
    case "supplier":
      return [
        { key: "facilityType", label: "Facility type", placeholder: "Mill, dyehouse, CMT…", required: true },
        { key: "certifications", label: "Certifications", placeholder: "GOTS, RCS, OEKO-TEX" },
        { key: "headcount", label: "Worker headcount", required: true },
        { key: "capacity", label: "Monthly capacity", placeholder: "e.g. 80,000 kg" },
        { key: "subcontractors", label: "Declared subcontractors" },
      ];
    case "verifier":
      return [
        { key: "accreditation", label: "Accreditation body", required: true },
        { key: "scopes", label: "Audit scopes", placeholder: "Social, environmental, chemical" },
        { key: "languages", label: "Languages covered" },
        { key: "leadAuditor", label: "Lead auditor contact" },
      ];
    case "ngo":
      return [
        { key: "mandate", label: "Mandate / focus area", required: true },
        { key: "jurisdiction", label: "Jurisdiction" },
        { key: "publications", label: "Recent publications" },
      ];
  }
}
