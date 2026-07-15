import { useEffect, useRef, useState } from "react";
import type { Entity, EntityType } from "@/seed/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=70`;

const POOLS: Record<EntityType, string[]> = {
  Brand: [
    "photo-1441986300917-64674bd600d8",
    "photo-1483985988355-763728e1935b",
    "photo-1567401893414-76b7b1e5a7a5",
    "photo-1479064555552-3ef4979f8908",
  ],
  Farmer: [
    "photo-1500937386664-56d1dfef3854",
    "photo-1464226184884-fa280b87c399",
    "photo-1592982537447-7440770cbfc9",
    "photo-1523741543316-beb7fc7023d8",
  ],
  Ginner: [
    "photo-1581091012184-7e0cdfbb6797",
    "photo-1565043666747-69f6646db940",
    "photo-1504198458649-3128b932f49e",
    "photo-1519750157634-b6d493a0f77c",
  ],
  Spinner: [
    "photo-1565043666747-69f6646db940",
    "photo-1581091012184-7e0cdfbb6797",
    "photo-1504198458649-3128b932f49e",
    "photo-1519750157634-b6d493a0f77c",
  ],
  "Fabric Mill": [
    "photo-1558618666-fcd25c85cd64",
    "photo-1565043666747-69f6646db940",
    "photo-1504198458649-3128b932f49e",
    "photo-1581091012184-7e0cdfbb6797",
  ],
  "Dye House": [
    "photo-1528459801416-a9e53bbf4e17",
    "photo-1558618666-fcd25c85cd64",
    "photo-1544441893-675973e31985",
    "photo-1583744946564-b52ac1c389c8",
  ],
  "Garment Factory": [
    "photo-1558618666-fcd25c85cd64",
    "photo-1581091012184-7e0cdfbb6797",
    "photo-1544441893-675973e31985",
    "photo-1519750157634-b6d493a0f77c",
  ],
  "Logistics Provider": [
    "photo-1494412651409-8963ce7935a7",
    "photo-1578575437130-527eed3abbec",
    "photo-1586528116311-ad8dd3c8310d",
    "photo-1601999216742-1e6c30ed6a35",
  ],
  "Certification Body": [
    "photo-1497366216548-37526070297c",
    "photo-1454165804606-c3d57bc86b40",
    "photo-1552664730-d307ca884978",
    "photo-1553877522-43269d4ea984",
  ],
  "Sustainability Partner": [
    "photo-1466611653911-95081537e5b7",
    "photo-1441974231531-c6227db76b6e",
    "photo-1500534623283-312aade485b7",
    "photo-1470071459604-3b5ec3a7fe05",
  ],
};

const BRAND_DOMAINS: Record<string, string> = {
  NIKE: "nike.com",
  HM: "hm.com",
  MANDS: "marksandspencer.com",
  PRIMARK: "primark.com",
};

function deriveDomain(e: Entity): string {
  if (BRAND_DOMAINS[e.id]) return BRAND_DOMAINS[e.id];
  const slug = e.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${slug || "example"}.com`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function OrgBanner({ entity }: { entity: Entity }) {
  const pool = POOLS[entity.entityType] ?? POOLS.Brand;
  const slides = pool.map(IMG);
  const [index, setIndex] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      if (!pausedRef.current) setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const token = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as
    | string
    | undefined;
  const domain = deriveDomain(entity);
  const logoUrl = token
    ? `https://img.logo.dev/${domain}?token=${token}&size=200&format=png`
    : null;

  const go = (delta: number) =>
    setIndex((i) => (i + delta + slides.length) % slides.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`${entity.name} banner`}
      className="group relative h-56 w-full overflow-hidden rounded-2xl border bg-slate-900 md:h-72"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocus={() => (pausedRef.current = true)}
      onBlur={() => (pausedRef.current = false)}
    >
      {/* Slides */}
      {slides.map((src, i) => (
        <div
          key={src}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-black/60" />

      {/* Prev / next */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur transition hover:bg-black/60 group-hover:opacity-100 md:block"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur transition hover:bg-black/60 group-hover:opacity-100 md:block"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Centered logo medallion */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/95 shadow-xl ring-4 ring-white/30 backdrop-blur md:h-32 md:w-32">
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt={`${entity.name} logo`}
              onError={() => setLogoFailed(true)}
              className="h-20 w-20 rounded-full object-contain md:h-24 md:w-24"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-2xl font-semibold text-white md:h-24 md:w-24 md:text-3xl">
              {initials(entity.name)}
            </div>
          )}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
