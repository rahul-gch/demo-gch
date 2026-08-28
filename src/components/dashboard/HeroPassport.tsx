import { useState } from "react";
import type { Entity } from "@/seed/types";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/StatusBadge";
import { bandBadgeClasses, computeNhri } from "@/lib/nhri";
import { isSeededOrg } from "@/seed/showcase";
import {
  MapPin,
  Users2,
  FolderKanban,
  Network as NetworkIcon,
  ShieldCheck,
  Star,
} from "lucide-react";
import { HeroBackground, deriveDomain, entityInitials } from "./OrgBanner";
import { useResolvedImage } from "@/lib/use-org-images";

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col justify-between rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur">
      <div className="min-h-[2rem] text-[10px] font-semibold uppercase leading-4 tracking-wider text-white/75">
        {label}
      </div>
      <div className="mt-1.5 flex w-full min-w-0 items-center gap-1.5">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-sky-300" />}
        <span className="min-w-0 truncate text-lg font-semibold leading-none tabular-nums text-white md:text-xl">
          {value}
        </span>
      </div>
    </div>
  );
}

export function HeroPassport({ entity: e }: { entity: Entity }) {
  const nhri = computeNhri(e);
  const seeded = isSeededOrg(e);
  const members = e.contacts.length;
  const stars = Math.max(0, Math.min(5, Math.round(nhri.score / 20)));

  const [logoFailed, setLogoFailed] = useState(false);
  const token = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as string | undefined;
  const domain = deriveDomain(e);
  const uploadedLogo = useResolvedImage(e.logoUrl ?? null);
  const logoUrl =
    uploadedLogo ??
    (token ? `https://img.logo.dev/${domain}?token=${token}&size=200&format=png` : null);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 p-6 text-slate-100 shadow-lg">
      {/* Carousel background */}
      <HeroBackground entity={e} />

      {/* Ambient blobs on top of overlay */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          {/* Title row with logo medallion */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-lg ring-2 ring-white/40 backdrop-blur md:h-20 md:w-20">
              {logoUrl && !logoFailed ? (
                <img
                  src={logoUrl}
                  alt={`${e.name} logo`}
                  onError={() => setLogoFailed(true)}
                  className="h-12 w-12 rounded-full object-contain md:h-16 md:w-16"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white md:h-16 md:w-16 md:text-xl">
                  {entityInitials(e.name)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                {e.gchNumber} · {e.organizationType}
              </div>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight md:text-3xl">
                {e.name}
              </h1>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge className="border-transparent bg-white/15 text-white hover:bg-white/20">
              {e.entityType}
            </Badge>
            <Badge variant="outline" className="border-white/25 bg-transparent text-white/85">
              {e.actorType}
            </Badge>
            <Badge variant="outline" className="border-white/25 bg-transparent text-white/85">
              <MapPin className="mr-1 h-3 w-3" />
              {[e.city, e.country].filter(Boolean).join(", ")}
            </Badge>
            <span className="inline-flex items-center gap-1">
              <VerificationBadge status={e.verificationStatus} />
            </span>
            <span className="inline-flex items-center gap-0.5 text-amber-300">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i < stars ? "fill-amber-300" : "opacity-30"}`}
                />
              ))}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4">
            <Stat label="NHRI Score" value={nhri.score} />
            <Stat label="Profile" value={`${e.profileCompleteness}%`} />
            <Stat label="Global Rank" value={seeded ? `#${nhri.globalRank}` : "—"} />
            <Stat label="Members" value={members} icon={Users2} />
          </div>
        </div>

        <aside className="min-w-0 rounded-xl border border-white/15 bg-black/30 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">
              AI says
            </div>
            <Badge className={`border-transparent ${bandBadgeClasses(nhri.bandTone)}`}>
              {nhri.band}
            </Badge>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {seeded ? (
              <>
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
              </>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-sky-300" />
                  <span>No verified data yet — your score starts at 0.</span>
                </div>
                <div className="flex items-start gap-2">
                  <NetworkIcon className="mt-0.5 h-3.5 w-3.5 text-emerald-300" />
                  <span>Complete your profile to unlock matchmaking and insights.</span>
                </div>
              </>
            )}
          </div>
          <div className="mt-4 rounded-md bg-black/40 p-3 text-xs text-slate-100">
            Suggested action · complete profile to unlock full matchmaking.
          </div>
        </aside>
      </div>
    </section>
  );
}
