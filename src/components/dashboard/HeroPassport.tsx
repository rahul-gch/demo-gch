import type { Entity } from "@/seed/types";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/StatusBadge";
import { bandBadgeClasses, computeNhri } from "@/lib/nhri";
import { getEcosystemConnections } from "@/seed/showcase";
import { MapPin, Users2, FolderKanban, Network as NetworkIcon, ShieldCheck, Star } from "lucide-react";

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
        {label}
      </div>
      <div className="flex items-center gap-1.5 text-xl font-semibold tabular-nums text-white">
        {Icon && <Icon className="h-4 w-4 text-sky-300" />}
        {value}
      </div>
    </div>
  );
}

export function HeroPassport({ entity: e }: { entity: Entity }) {
  const nhri = computeNhri(e);
  const conns = getEcosystemConnections(e);
  const partners = conns.length + 48;
  const members = e.contacts.length + 12;
  const projects = 6 + (conns.length % 6);
  const stars = Math.max(1, Math.min(5, Math.round(nhri.score / 20)));

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-slate-100 shadow-lg">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            {e.gchNumber} · {e.organizationType}
          </div>
          <h1 className="mt-2 truncate text-3xl font-semibold tracking-tight">{e.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className="border-transparent bg-white/10 text-white hover:bg-white/15">
              {e.entityType}
            </Badge>
            <Badge variant="outline" className="border-white/20 bg-transparent text-white/80">
              {e.actorType}
            </Badge>
            <Badge variant="outline" className="border-white/20 bg-transparent text-white/80">
              <MapPin className="mr-1 h-3 w-3" />
              {[e.city, e.country].filter(Boolean).join(", ")}
            </Badge>
            <span className="inline-flex items-center gap-1">
              <VerificationBadge status={e.verificationStatus} />
            </span>
            <span className="inline-flex items-center gap-0.5 text-amber-300">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < stars ? "fill-amber-300" : "opacity-30"}`} />
              ))}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="NHRI Score" value={nhri.score} />
            <Stat label="Profile" value={`${e.profileCompleteness}%`} />
            <Stat label="Global Rank" value={`#${nhri.globalRank}`} />
            <Stat label="Members" value={members} icon={Users2} />
            <Stat label="Projects" value={projects} icon={FolderKanban} />
            <Stat label="Partners" value={partners} icon={NetworkIcon} />
          </div>
        </div>

        <aside className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">
              AI says
            </div>
            <Badge className={`border-transparent ${bandBadgeClasses(nhri.bandTone)}`}>{nhri.band}</Badge>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-amber-300" />
              <span>1 certificate expires within 30 days</span>
            </div>
            <div className="flex items-start gap-2">
              <NetworkIcon className="mt-0.5 h-3.5 w-3.5 text-emerald-300" />
              <span>2 new partner matches at 85%+ fit</span>
            </div>
            <div className="flex items-start gap-2">
              <FolderKanban className="mt-0.5 h-3.5 w-3.5 text-sky-300" />
              <span>Supply chain risk increased in {e.country}</span>
            </div>
          </div>
          <div className="mt-4 rounded-md bg-black/30 p-3 text-xs text-slate-200">
            Suggested action · complete profile to unlock full matchmaking.
          </div>
        </aside>
      </div>
    </section>
  );
}
