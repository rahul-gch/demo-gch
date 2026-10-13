import { useEffect, useRef, useState } from "react";
import type { Entity } from "@/seed/types";

declare global {
  interface Window {
    google: any;
    __gchMapsPromise?: Promise<void>;
    __gchInitMap?: () => void;
  }
}

const DARK_STYLE: any[] = [
  { elementType: "geometry", stylers: [{ color: "#0b1220" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1220" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7a90" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1b2638" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2a3a55" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8aa0bd" }],
  },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#101a2c" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#070d1a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3b4a66" }] },
];

export function colorForEntity(e: Entity): string {
  switch (e.entityType) {
    case "Brand":
      return "#f59e0b";
    case "Certification Body":
      return "#22c55e";
    case "Sustainability Partner":
      return "#a855f7";
    case "Logistics Provider":
      return "#60a5fa";
    default:
      return "#22d3ee";
  }
}

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__gchMapsPromise) return window.__gchMapsPromise;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
  window.__gchMapsPromise = new Promise<void>((resolve, reject) => {
    window.__gchInitMap = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__gchInitMap${channel ? `&channel=${channel}` : ""}`;
    s.async = true;
    s.defer = true;
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
  return window.__gchMapsPromise;
}

export interface EcosystemGoogleMapProps {
  entities: Entity[];
  height?: number;
  onSelect?: (e: Entity) => void;
  selectedId?: string;
  showLegend?: boolean;
  compact?: boolean;
  zoom?: number;
  center?: { lat: number; lng: number };
}

export function EcosystemGoogleMap({
  entities,
  height = 480,
  onSelect,
  selectedId,
  showLegend = true,
  compact = false,
  zoom,
  center,
}: EcosystemGoogleMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !ref.current) return;
        const g = window.google.maps;
        mapRef.current = new g.Map(ref.current, {
          center: center || { lat: 20, lng: 10 },
          zoom: zoom ?? (compact ? 1.5 : 2),
          styles: DARK_STYLE,
          disableDefaultUI: compact,
          zoomControl: !compact,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: !compact,
          backgroundColor: "#070d1a",
          gestureHandling: compact ? "cooperative" : "greedy",
        });
        infoRef.current = new g.InfoWindow();
        setReady(true);
      })
      .catch(() => setError("Could not load Google Maps."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const g = window.google.maps;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new g.LatLngBounds();
    entities.forEach((e) => {
      if (!e.latitude || !e.longitude) return;
      const color = colorForEntity(e);
      const isSelected = e.id === selectedId;
      const marker = new g.Marker({
        position: { lat: e.latitude, lng: e.longitude },
        map: mapRef.current,
        title: e.name,
        icon: {
          path: g.SymbolPath.CIRCLE,
          scale: isSelected ? 9 : 6,
          fillColor: color,
          fillOpacity: 0.95,
          strokeColor: "#0b1220",
          strokeWeight: 2,
        },
        zIndex: isSelected ? 999 : 1,
      });
      marker.addListener("click", () => {
        const esc = (v: unknown) =>
          String(v ?? "").replace(/[&<>"']/g, (c) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
          );
        infoRef.current.setContent(
          `<div style="font-family:Inter,system-ui;padding:4px 6px;min-width:160px">
             <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#64748b">${esc(e.gchNumber)}</div>
             <div style="font-weight:600;font-size:13px;margin-top:2px;color:#0f172a">${esc(e.name)}</div>
             <div style="font-size:11px;color:#475569;margin-top:2px">${esc(e.entityType)} · ${esc(e.country)}</div>
             <a href="/organizations/${encodeURIComponent(String(e.id))}" style="display:inline-block;margin-top:6px;font-size:11px;color:#2563eb;text-decoration:none">View profile →</a>
           </div>`,
        );
        infoRef.current.open(mapRef.current, marker);
        onSelect?.(e);
      });
      markersRef.current.push(marker);
      bounds.extend(marker.getPosition());
    });

    if (!center && entities.length > 1) {
      mapRef.current.fitBounds(bounds, compact ? 30 : 60);
    } else if (center) {
      mapRef.current.setCenter(center);
      if (zoom) mapRef.current.setZoom(zoom);
    } else if (entities.length === 1) {
      mapRef.current.setCenter({ lat: entities[0].latitude, lng: entities[0].longitude });
      mapRef.current.setZoom(zoom ?? 5);
    }
  }, [ready, entities, selectedId, onSelect, compact, center, zoom]);

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-slate-800 bg-[#070d1a]"
      style={{ height }}
    >
      <div ref={ref} className="h-full w-full" />
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
          Loading map…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-red-300">
          {error}
        </div>
      )}
      {showLegend && ready && (
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-md border border-slate-700/60 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-200 backdrop-blur">
          <LegendDot color="#f59e0b" label="Brand" />
          <LegendDot color="#22d3ee" label="Supplier" />
          <LegendDot color="#22c55e" label="Verifier" />
          <LegendDot color="#a855f7" label="Sustainability" />
          <LegendDot color="#60a5fa" label="Logistics" />
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
