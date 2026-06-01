import { useEffect, useMemo, useState } from "react";
import { EcosystemGraph } from "@/components/EcosystemGraph";
import { EcosystemMap } from "@/components/EcosystemMap";
import { MessagesPanel } from "@/components/MessagesPanel";
import {
  getOrgForUser, getPartners, getPartnerIds, getRiskSignals,
  getTopMatchSuggestions, getIncomingVerifications, getPrimaryUserForOrg,
} from "@/lib/user-scope";
import { unreadCountFor, subscribeComms, type Participant } from "@/lib/messaging";
import type { DemoAccount } from "@/lib/auth";
import {
  Network, Map as MapIcon, ShieldAlert, Sparkles, Activity,
  MessageSquare, Building2, Users, AlertTriangle, FileSearch, CheckCircle2,
} from "lucide-react";

type Tab = "network" | "map" | "risk" | "matches" | "activity";

const ROLE_TO_PARTICIPANT: Record<string, Participant> = {
  rahul: "rahul", george: "george", maria: "maria", admin: "admin",
};

export function UserDashboard({ user }: { user: DemoAccount }) {
  const org = getOrgForUser(user.role);
  const me = ROLE_TO_PARTICIPANT[user.role];
  const [tab, setTab] = useState<Tab>("network");
  const [selected, setSelected] = useState<string | null>(null);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messagesWith, setMessagesWith] = useState<Participant | undefined>();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!me) return;
    const refresh = () => setUnread(unreadCountFor(me));
    refresh();
    return subscribeComms(refresh);
  }, [me]);

  if (!org) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No organization mapped to this user yet.
      </div>
    );
  }

  const partners = useMemo(() => getPartners(org.id), [org.id]);
  const partnerIds = useMemo(() => getPartnerIds(org.id), [org.id]);
  const risk = useMemo(() => getRiskSignals(org.id), [org.id]);
  const suggestions = useMemo(() => getTopMatchSuggestions(org.id, 6), [org.id]);

  const TABS: { id: Tab; label: string; icon: typeof Network }[] = [
    { id: "network", label: "My Network", icon: Network },
    { id: "map", label: "Map", icon: MapIcon },
    { id: "risk", label: "Risk", icon: ShieldAlert },
    { id: "matches", label: user.role === "maria" ? "Audit Candidates" : "Suggested Matches", icon: Sparkles },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  function openMessageWith(orgId: string) {
    const u = getPrimaryUserForOrg(orgId);
    // map known org primary users back to demo participants
    const map: Record<string, Participant> = {
      acme: "rahul", northwind: "george", starkv: "maria",
    };
    const p = map[orgId];
    if (p && p !== me) {
      setMessagesWith(p);
      setMessagesOpen(true);
    } else {
      setMessagesWith(undefined);
      setMessagesOpen(true);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* Header strip */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{org.name}</div>
            <div className="text-[11px] capitalize text-muted-foreground">
              {org.type} · Tier {org.tier} · {org.country} · Size {org.size} · {org.status}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Meter label="Confidence" value={org.confidence} good />
          <Meter label="Risk" value={org.risk} />
        </div>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={<Users className="h-3.5 w-3.5" />} label="Direct partners" value={partners.length} />
        <Kpi icon={<AlertTriangle className="h-3.5 w-3.5" />} label="High-risk partners" value={risk.highRiskPartners.length} tone={risk.highRiskPartners.length ? "risk" : "good"} />
        <Kpi icon={<FileSearch className="h-3.5 w-3.5" />} label="Missing evidence" value={risk.missingEvidenceEdges.length} tone={risk.missingEvidenceEdges.length ? "warn" : "good"} />
        <Kpi icon={<MessageSquare className="h-3.5 w-3.5" />} label="Unread messages" value={unread} tone={unread ? "info" : "good"} />
      </div>

      {/* Tabs */}
      <nav className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-background p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div className="min-h-[360px]">
        {tab === "network" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="h-[420px] overflow-hidden rounded-lg border border-border bg-slate-950">
                <EcosystemGraph
                  includeIds={partnerIds}
                  centerId={org.id}
                  selectedId={selected}
                  onSelect={setSelected}
                />
              </div>
            </div>
            <PartnerDetail
              orgId={selected ?? org.id}
              selfId={org.id}
              onMessage={openMessageWith}
            />
          </div>
        )}

        {tab === "map" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="h-[420px] overflow-hidden rounded-lg border border-border bg-slate-950">
                <EcosystemMap
                  includeIds={partnerIds}
                  centerId={org.id}
                  selectedId={selected}
                  onSelect={setSelected}
                />
              </div>
            </div>
            <PartnerDetail
              orgId={selected ?? org.id}
              selfId={org.id}
              onMessage={openMessageWith}
            />
          </div>
        )}

        {tab === "risk" && (
          <RiskTab orgId={org.id} onMessage={openMessageWith} />
        )}

        {tab === "matches" && (
          <div className="space-y-3">
            {suggestions.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No new suggestions right now.
              </div>
            )}
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {suggestions.map((s) => (
                <li key={s.org.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{s.org.name}</div>
                      <div className="text-[11px] capitalize text-muted-foreground">
                        {s.org.type} · Tier {s.org.tier} · {s.org.country}
                      </div>
                    </div>
                    <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold text-background">
                      {s.score}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(s.parts).map(([k, v]) => (
                      <span key={k} className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {k} {Math.round((v as number) * 100)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openMessageWith(s.org.id)}
                      className="rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background hover:opacity-90"
                    >
                      Introduce
                    </button>
                    <button
                      onClick={() => { setSelected(s.org.id); setTab("map"); }}
                      className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                    >
                      View on map
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "activity" && (
          <ActivityTab me={me} onOpen={() => { setMessagesWith(undefined); setMessagesOpen(true); }} />
        )}
      </div>

      {messagesOpen && me && (
        <MessagesPanel
          me={me}
          initialOther={messagesWith}
          onClose={() => setMessagesOpen(false)}
        />
      )}
    </section>
  );
}

function Meter({ label, value, good = false }: { label: string; value: number; good?: boolean }) {
  const pct = Math.round(value * 100);
  const color = good
    ? pct > 75 ? "bg-emerald-500" : pct > 50 ? "bg-amber-500" : "bg-rose-500"
    : pct > 60 ? "bg-rose-500" : pct > 35 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-medium text-foreground">{pct}%</span>
    </div>
  );
}

function Kpi({ icon, label, value, tone = "default" }: {
  icon: React.ReactNode; label: string; value: number | string;
  tone?: "default" | "good" | "warn" | "risk" | "info";
}) {
  const t = {
    default: "text-foreground", good: "text-emerald-600", warn: "text-amber-600",
    risk: "text-rose-600", info: "text-sky-600",
  }[tone];
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <div className={`mt-1 text-2xl font-semibold ${t}`}>{value}</div>
    </div>
  );
}

function PartnerDetail({
  orgId, selfId, onMessage,
}: { orgId: string; selfId: string; onMessage: (id: string) => void }) {
  const partner = useMemo(() => {
    const all = getPartners(selfId);
    return all.find((p) => p.org.id === orgId);
  }, [orgId, selfId]);

  if (orgId === selfId) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-xs text-muted-foreground">
        Click a partner node to see details and quick actions.
      </div>
    );
  }
  if (!partner) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-xs text-muted-foreground">
        Not a direct partner.
      </div>
    );
  }
  const o = partner.org;
  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      <div>
        <div className="text-sm font-semibold text-foreground">{o.name}</div>
        <div className="text-[11px] capitalize text-muted-foreground">
          {o.type} · Tier {o.tier} · {o.country}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <Field label="Relationship" value={`${partner.kind} (${partner.direction})`} />
        <Field label="Strength" value={`${Math.round(partner.edge.strength * 100)}%`} />
        <Field label="Evidence" value={String(partner.edge.evidenceCount)} />
        <Field label="Status" value={o.status} />
        <Field label="Confidence" value={`${Math.round(o.confidence * 100)}%`} />
        <Field label="Risk" value={`${Math.round(o.risk * 100)}%`} />
      </div>
      {o.certifications.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {o.certifications.map((c) => (
            <span key={c} className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{c}</span>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onMessage(o.id)}
          className="flex-1 rounded-md bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background hover:opacity-90"
        >
          Message
        </button>
        <button
          onClick={() => onMessage(o.id)}
          className="flex-1 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted"
        >
          Request meeting
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}

function RiskTab({ orgId, onMessage }: { orgId: string; onMessage: (id: string) => void }) {
  const { partners, avgPartnerRisk, avgPartnerConfidence } = getRiskSignals(orgId);
  const sorted = [...partners].sort((a, b) => b.org.risk - a.org.risk);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Kpi icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Avg partner risk" value={`${Math.round(avgPartnerRisk * 100)}%`} tone={avgPartnerRisk > 0.4 ? "warn" : "good"} />
        <Kpi icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Avg partner confidence" value={`${Math.round(avgPartnerConfidence * 100)}%`} tone={avgPartnerConfidence > 0.7 ? "good" : "warn"} />
        <Kpi icon={<Users className="h-3.5 w-3.5" />} label="Partners tracked" value={partners.length} />
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Partner</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Risk</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Evidence</th>
              <th className="px-3 py-2">Verifiers</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((p) => {
              const verifiers = getIncomingVerifications(p.org.id);
              return (
                <tr key={p.org.id} className="bg-background">
                  <td className="px-3 py-2 font-medium text-foreground">{p.org.name}</td>
                  <td className="px-3 py-2 capitalize text-muted-foreground">{p.org.type}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      p.org.risk > 0.5 ? "bg-rose-100 text-rose-700"
                        : p.org.risk > 0.3 ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>{Math.round(p.org.risk * 100)}%</span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{Math.round(p.org.confidence * 100)}%</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.edge.evidenceCount}</td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">
                    {verifiers.length === 0 ? "—" : verifiers.map((v) => v.verifier.name).join(", ")}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{p.org.status}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => onMessage(p.org.id)}
                      className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-foreground hover:bg-muted"
                    >
                      Request evidence
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">No partners yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityTab({ me, onOpen }: { me: Participant | undefined; onOpen: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-background p-6 text-center">
      <MessageSquare className="mx-auto h-6 w-6 text-muted-foreground" />
      <div className="mt-2 text-sm font-medium text-foreground">Open the Messages panel</div>
      <p className="mt-1 text-xs text-muted-foreground">
        Direct messages and meeting requests live in your inbox.
      </p>
      <button
        onClick={onOpen}
        className="mt-3 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
      >
        Open inbox
      </button>
    </div>
  );
}
