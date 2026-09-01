import { useState } from "react";
import type { Entity } from "@/seed/types";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/StatusBadge";
import { MapPin, Mail } from "lucide-react";
import { HeroBackground, deriveDomain, entityInitials } from "./OrgBanner";
import { useResolvedImage } from "@/lib/use-org-images";

export function HeroPassport({ entity: e }: { entity: Entity }) {
  const tags = [
    ...(e.specializations ?? []).slice(0, 2),
    ...(e.materials ?? []).slice(0, 2),
  ].slice(0, 4);

  const [logoFailed, setLogoFailed] = useState(false);
  const token = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as string | undefined;
  const domain = deriveDomain(e);
  const uploadedLogo = useResolvedImage(e.logoUrl ?? null);
  const logoUrl =
    uploadedLogo ??
    (token ? `https://img.logo.dev/${domain}?token=${token}&size=200&format=png` : null);

  const primaryContact = e.contacts && e.contacts.length > 0 ? e.contacts[0] : null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 p-6 text-slate-100 shadow-lg">
      {/* Carousel background */}
      <HeroBackground entity={e} />

      {/* Ambient blobs on top of overlay */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative">
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
            {primaryContact?.email && (
              <Badge variant="outline" className="border-white/25 bg-white/10 text-white/90 gap-1.5 font-normal">
                <Mail className="h-3 w-3 text-sky-300" />
                {primaryContact.email}
              </Badge>
            )}
            <span className="inline-flex items-center gap-1">
              <VerificationBadge status={e.verificationStatus} />
            </span>
          </div>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
