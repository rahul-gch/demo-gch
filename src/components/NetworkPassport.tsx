import type { Entity } from "@/seed/types";
import {
  Leaf,
  CircleDot,
  Layers,
  Factory,
  Building2,
  ShoppingBag,
  Sprout,
  AlertTriangle,
  ShieldCheck,
  Droplets,
  TrendingUp,
} from "lucide-react";

const STAGES = [
  { key: "Farm", icon: Leaf, sub: "Raw material origin" },
  { key: "Ginning", icon: CircleDot, sub: "Fibre processing" },
  { key: "Spinning", icon: Layers, sub: "Yarn formation" },
  { key: "Textile Mill", icon: Factory, sub: "Fabric mill" },
  { key: "Manufacturer", icon: Building2, sub: "Cut & sew" },
  { key: "Brand", icon: ShoppingBag, sub: "Brand owner" },
  { key: "Retail", icon: Sprout, sub: "Retail / D2C" },
] as const;

function tierToStageIndex(actor: string) {
  // Tier 4 → Farm … Tier 0 → Brand. Map best-effort.
  switch (actor) {
    case "Tier 4":
      return 0;
    case "Tier 3":
      return 1;
    case "Tier 2":
      return 3;
    case "Tier 1":
      return 4;
    case "Tier 0":
      return 5;
    default:
      return 4;
  }
}

function score(e: Entity, key: string): number {
  // Deterministic pseudo-score derived from completeness + readiness.
  let h = 0;
  for (let i = 0; i < (e.id + key).length; i++) h = (h * 31 + (e.id + key).charCodeAt(i)) >>> 0;
  const base = 60 + (h % 35);
  if (key === "trust")
    return Math.min(99, Math.round((e.profileCompleteness + e.confidenceScore) / 2));
  if (key === "traceability")
    return Math.min(99, e.traceabilityReadiness > 0 ? 70 + (h % 25) : base);
  return base;
}

export function NetworkPassport({ entity: e }: { entity: Entity }) {
  const currentIdx = tierToStageIndex(e.actorType);
  const stage = STAGES[currentIdx];
  const StageIcon = stage.icon;

  const scores = [
    { label: "Traceability", value: score(e, "traceability") },
    { label: "Environmental", value: score(e, "environmental") },
    { label: "Social", value: score(e, "social") },
    { label: "Governance", value: score(e, "governance") },
    { label: "Compliance", value: score(e, "compliance") },
    { label: "Trust score", value: score(e, "trust") },
  ];

  const insights = [
    {
      icon: AlertTriangle,
      title: "Supply Risk Alert",
      detail: `Monitor ${e.country} sourcing — climate volatility flagged for next season.`,
    },
    {
      icon: ShieldCheck,
      title: "Certification Alert",
      detail:
        e.expiredCertCount > 0
          ? `${e.expiredCertCount} certification(s) require renewal.`
          : "All active certifications in good standing.",
    },
    {
      icon: Droplets,
      title: "Water Risk",
      detail: "Moderate water-stress forecast in primary sourcing region.",
    },
    {
      icon: TrendingUp,
      title: "ESG Trend",
      detail: `+${Math.max(2, Math.round(e.confidenceScore / 12))} improvement vs prior period.`,
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-xl">
      <div className="grid gap-8 p-6 lg:grid-cols-[1fr_320px] lg:p-8">
        {/* LEFT */}
        <div className="space-y-8">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400">
              Network Passport
            </div>
            <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
              <PassportField label="Organization" value={e.name} />
              <PassportField label="Entity Type" value={e.rawEntityType || e.entityType} />
              <PassportField label="Primary Material" value={e.materials[0] || "Multi-material"} />
              <PassportField
                label="Origin"
                value={[e.city, e.country].filter(Boolean).join(", ") || e.country}
              />
              {e.operatingCountries && e.operatingCountries.length > 0 && (
                <PassportField
                  label="Operating Countries"
                  value={e.operatingCountries.join(", ")}
                />
              )}
              {e.address && (
                <PassportField
                  label="Registered Address"
                  value={[e.address, e.zipCode].filter(Boolean).join(", ")}
                />
              )}
              <PassportField label="GCH ID" value={e.gchNumber} />
              <PassportField label="Tier" value={e.actorType} />
              <PassportField
                label="Capacity"
                value={e.capacity || `${e.leadTimeDays || 60}-day lead time`}
              />
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Certifications
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(e.certifications.length ? e.certifications : ["—"]).slice(0, 5).map((c) => (
                    <span
                      key={c}
                      className="rounded-md border border-amber-500/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400">
              Supply Chain Journey
            </div>
            <div className="relative mt-6">
              <div className="absolute left-0 right-0 top-6 h-px bg-slate-800" />
              <div className="relative grid grid-cols-7 gap-2">
                {STAGES.map((s, i) => {
                  const Icon = s.icon;
                  const active = i === currentIdx;
                  const reached = i <= currentIdx;
                  return (
                    <div key={s.key} className="flex flex-col items-center text-center">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                          active
                            ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                            : reached
                              ? "border-amber-400 bg-amber-400/10 text-amber-300"
                              : "border-slate-700 bg-slate-900 text-slate-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="mt-2 text-[11px] font-medium text-slate-200">{s.key}</div>
                      <div className="text-[10px] text-slate-500">{s.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-start gap-6">
                <div className="flex items-center gap-2">
                  <StageIcon className="h-4 w-4 text-cyan-300" />
                  <span className="font-medium text-slate-100">{stage.key}</span>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    Location
                  </div>
                  <div className="text-sm text-slate-200">
                    {[e.city, e.country].filter(Boolean).join(", ") || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    Verification
                  </div>
                  <div className="text-sm text-slate-200">{e.verificationStatus}</div>
                </div>
                <div className="min-w-[200px] flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    Current activity
                  </div>
                  <div className="text-sm text-slate-300">
                    {e.recommendedNextAction || "Operating within reported scope."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400">
              AI Intelligence & ESG
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {scores.map((s) => (
                <ScoreRing key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400">
              AI Insights
            </div>
            <ul className="mt-3 space-y-2">
              {insights.map((it) => {
                const Icon = it.icon;
                return (
                  <li
                    key={it.title}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                      <Icon className="h-3.5 w-3.5 text-amber-300" />
                      {it.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{it.detail}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function PassportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-100">{value || "—"}</div>
    </div>
  );
}

function ScoreRing({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400/60 bg-slate-900">
        <span className="text-lg font-semibold tabular-nums text-amber-300">{value}</span>
      </div>
      <div className="mt-1.5 text-[9px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </div>
    </div>
  );
}
