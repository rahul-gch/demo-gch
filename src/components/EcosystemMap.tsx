import { useEffect, useRef, useState } from "react";
import { ORGS, type EcosystemOrg } from "@/lib/ecosystem-data";
import { TYPE_COLOR } from "@/components/EcosystemGraph";
import { loadSettings } from "@/lib/matchmaking";
import { topMatches } from "@/lib/matchmaking";

declare global {
  interface Window {
    google?: any;
    __gchInitMap?: () => void;
  }
}

const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  Portugal:    { lat: 39.5,  lng: -8.0 },
  USA:         { lat: 39.0,  lng: -98.0 },
  UK:          { lat: 54.0,  lng: -2.0 },
  Germany:     { lat: 51.0,  lng: 10.5 },
  Japan:       { lat: 36.5,  lng: 138.0 },
  Mexico:      { lat: 23.6,  lng: -102.5 },
  India:       { lat: 22.0,  lng: 79.0 },
  China:       { lat: 35.0,  lng: 104.0 },
  Vietnam:     { lat: 16.0,  lng: 107.8 },
  Brazil:      { lat: -14.0, lng: -51.9 },
  Netherlands: { lat: 52.1,  lng: 5.3 },
  Belgium:     { lat: 50.5,  lng: 4.5 },
  Singapore:   { lat: 1.35,  lng: 103.8 },
};

function hashJitter(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const r1 = ((h & 0xff) / 255 - 0.5) * 4;
  const r2 = (((h >> 8) & 0xff) / 255 - 0.5) * 4;
  return { dLat: r1, dLng: r2 };
}

function orgLatLng(o: EcosystemOrg) {
  const base = COUNTRY_COORDS[o.country] ?? { lat: 0, lng: 0 };
  const j = hashJitter(o.id);
  return { lat: base.lat + j.dLat, lng: base.lng + j.dLng };
}

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.google?.maps) return Promise.resolve();

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
  if (!key) return Promise.reject(new Error("Missing Google Maps key"));

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("gch-gmaps-script") as HTMLScriptElement | null;
    window.__gchInitMap = () => resolve();
    if (existing) {
      if (window.google?.maps) resolve();
      return;
    }
    const s = document.createElement("script");
    s.id = "gch-gmaps-script";
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__gchInitMap${channel ? `&channel=${channel}` : ""}`;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
}

export function EcosystemMap({
  selectedId,
  onSelect,
  includeIds,
  centerId,
}: {
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  includeIds?: Set<string>;
  centerId?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const infoRef = useRef<any>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !ref.current || !window.google?.maps) return;
        const g = window.google;
        const map = new g.maps.Map(ref.current, {
          center: { lat: 25, lng: 10 },
          zoom: 2,
          minZoom: 2,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#0b1220" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0b1220" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
            { featureType: "water", stylers: [{ color: "#020617" }] },
            { featureType: "road", stylers: [{ visibility: "off" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
            { featureType: "landscape", stylers: [{ color: "#0f172a" }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
        });
        mapRef.current = map;
        infoRef.current = new g.maps.InfoWindow();

        ORGS.forEach((o) => {
          const pos = orgLatLng(o);
          const size = o.size === "L" ? 10 : o.size === "M" ? 8 : 6;
          const marker = new g.maps.Marker({
            position: pos,
            map,
            title: o.name,
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: size,
              fillColor: TYPE_COLOR[o.type],
              fillOpacity: 0.85,
              strokeColor: o.risk > 0.6 ? "#f43f5e" : "#0f172a",
              strokeWeight: o.risk > 0.6 ? 2.5 : 1.5,
            },
          });
          marker.addListener("click", () => {
            const settings = loadSettings();
            const matches = topMatches(o.id, settings, 3);
            const rows = matches
              .map(
                (m) =>
                  `<div style="display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#334155;padding:2px 0;"><span>${m.org.name}</span><span style="font-weight:600;color:#0f172a;">${m.score}</span></div>`,
              )
              .join("");
            infoRef.current.setContent(`
              <div style="font-family:ui-sans-serif,system-ui;min-width:220px;color:#0f172a;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${TYPE_COLOR[o.type]};"></span>
                  <strong style="font-size:13px;">${o.name}</strong>
                </div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;text-transform:capitalize;">${o.type} · Tier ${o.tier} · ${o.country}</div>
                <div style="font-size:11px;color:#334155;margin-top:6px;">Size ${o.size} · Conf ${(o.confidence*100).toFixed(0)}% · Risk ${(o.risk*100).toFixed(0)}% · ${o.status}</div>
                ${matches.length ? `<div style="margin-top:8px;border-top:1px solid #e2e8f0;padding-top:6px;"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:4px;">Top matches</div>${rows}</div>` : ""}
              </div>
            `);
            infoRef.current.open({ anchor: marker, map });
            onSelect?.(o.id);
          });
          markersRef.current[o.id] = marker;
        });

        setState("ready");
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setState("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state !== "ready" || !selectedId) return;
    const marker = markersRef.current[selectedId];
    if (marker && mapRef.current) {
      mapRef.current.panTo(marker.getPosition());
    }
  }, [selectedId, state]);

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="h-full w-full" />
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-xs text-slate-400">
          Loading map…
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-950 p-4 text-center text-xs text-slate-300">
          <div className="font-semibold text-slate-100">Map unavailable</div>
          <div className="text-slate-400">{error}</div>
          <div className="mt-1 text-[10px] text-slate-500">
            Make sure the Google Maps connector is linked.
          </div>
        </div>
      )}
      {state === "ready" && (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-md border border-slate-800 bg-slate-950/85 px-2 py-1.5 text-[10px] text-slate-300 backdrop-blur">
          <div className="mb-1 font-semibold uppercase tracking-wider text-slate-400">Legend</div>
          <div className="flex flex-wrap gap-2">
            {(["brand", "supplier", "verifier", "regulator"] as const).map((t) => (
              <div key={t} className="flex items-center gap-1 capitalize">
                <span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLOR[t] }} />
                {t}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
