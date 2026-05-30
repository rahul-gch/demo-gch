import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { EcosystemGraph } from "@/components/EcosystemGraph";
import { getCurrentUser, signOut, type AuthRole } from "@/lib/auth";
import { LogOut } from "lucide-react";
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

  useEffect(() => {
    if (!getCurrentUser()) navigate({ to: "/login" });
  }, [navigate]);

  const initialRole = (user?.role as RoleId) ?? "rahul";
  const [active, setActive] = useState<RoleId>(initialRole);

  // Non-admin users can only see their own workspace + Org Profile
  const visibleRoles = useMemo(() => {
    if (user?.role === "admin") return ROLES;
    return ROLES.filter((r) => r.id === user?.role || r.id === "org");
  }, [user?.role]);

  // Hard guard: clamp `active` to an allowed role
  const allowedIds = visibleRoles.map((r) => r.id);
  const safeActive: RoleId = allowedIds.includes(active) ? active : initialRole;
  const current = ROLES.find((r) => r.id === safeActive)!;

  if (!user) return null;

  function handleSignOut() {
    signOut();
    navigate({ to: "/login" });
  }


  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
              <Network className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">GCH Ecosystem</div>
              <div className="text-[11px] text-muted-foreground">Enterprise traceability platform</div>
            </div>
          </div>
          <nav className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
            {visibleRoles.map((r) => {
              const isActive = r.id === safeActive;
              return (
                <button
                  key={r.id}
                  onClick={() => setActive(r.id)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ${r.tone}`}
                  >
                    {r.initials}
                  </span>
                  {r.id === "org" ? "Org Profile" : r.name}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Signed in as <span className="font-medium text-foreground">{user.name}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {current.role}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {safeActive === "org" ? "Organization profile" : `${current.name}'s workspace`}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {roleTagline(safeActive)}
            </p>
          </div>
          {safeActive !== "org" && (
            <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <Building2 className="h-3.5 w-3.5" />
              {current.org}
            </div>
          )}
        </div>

        {safeActive === "rahul" && <RahulDashboard />}
        {safeActive === "george" && <GeorgeDashboard />}
        {safeActive === "maria" && <MariaDashboard />}
        {safeActive === "admin" && <AdminDashboard />}
        {safeActive === "org" && <OrgProfile />}
      </main>
    </div>
  );
}

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

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Network className="h-3.5 w-3.5" />} label="Organizations" value="248" delta="+12" tone="good" />
        <Stat icon={<Users className="h-3.5 w-3.5" />} label="Active users" value="1,420" delta="+38" tone="good" />
        <Stat icon={<Settings2 className="h-3.5 w-3.5" />} label="Matching rules" value="34" tone="default" />
        <Stat icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Governance alerts" value="6" delta="+2" tone="warn" />
      </div>

      <Panel
        title="Ecosystem graph"
        subtitle="Every output below is derived from this graph."
        right={
          <div className="hidden gap-3 text-[11px] text-muted-foreground md:flex">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />Core</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" />Partner</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />Prospect</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />Risk</span>
          </div>
        }
      >
        <div className="overflow-hidden rounded-xl border border-border bg-slate-950">
          <div className="aspect-[16/9] w-full">
            <EcosystemGraph />
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="User & organization management">
          <ul className="divide-y divide-border">
            {[
              { name: "Acme Apparel", role: "Brand", users: 24, status: "Verified" },
              { name: "Northwind Mills", role: "Supplier", users: 11, status: "Pending" },
              { name: "Tyrell Dyeworks", role: "Supplier", users: 6, status: "Verified" },
              { name: "Umbrella Co.", role: "Supplier", users: 4, status: "Flagged" },
            ].map((o) => (
              <li key={o.name} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div>
                  <div className="text-sm font-medium text-foreground">{o.name}</div>
                  <div className="text-[11px] text-muted-foreground">{o.role} · {o.users} users</div>
                </div>
                <Pill tone={o.status === "Verified" ? "good" : o.status === "Pending" ? "warn" : "risk"}>
                  {o.status}
                </Pill>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Matching rules" subtitle="Predictive ecosystem suggestions">
          <ul className="space-y-2">
            {[
              { rule: "Tier-2 dyehouse ↔ Tier-3 fiber", weight: 0.82, status: "Enabled" },
              { rule: "Geo-proximity within 50km", weight: 0.55, status: "Enabled" },
              { rule: "Shared certifications (GOTS/RCS)", weight: 0.73, status: "Enabled" },
              { rule: "Historical co-orders > 3", weight: 0.46, status: "Draft" },
            ].map((r) => (
              <li key={r.rule} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <div className="text-sm text-foreground">{r.rule}</div>
                  <div className="text-[11px] text-muted-foreground">Weight {r.weight.toFixed(2)}</div>
                </div>
                <Pill tone={r.status === "Enabled" ? "good" : "info"}>{r.status}</Pill>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Confidence governance" subtitle="Thresholds and exceptions">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { label: "Auto-accept threshold", value: "≥ 85%", tone: "good" as const },
            { label: "Manual review band", value: "60–84%", tone: "warn" as const },
            { label: "Reject threshold", value: "< 60%", tone: "risk" as const },
          ].map((g) => (
            <div key={g.label} className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">{g.label}</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-lg font-semibold text-foreground">{g.value}</span>
                <Pill tone={g.tone}>policy</Pill>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
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
