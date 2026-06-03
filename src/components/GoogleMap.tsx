import { useEffect, useRef } from "react";
import type { Entity } from "@/seed/types";

const SCRIPT_ID = "google-maps-js";
const CB_NAME = "__gchInitGoogleMaps";

declare global {
  interface Window {
    [CB_NAME]?: () => void;
    google?: any;
    __gchMapsReady?: Promise<void>;
  }
}

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__gchMapsReady) return window.__gchMapsReady;

  window.__gchMapsReady = new Promise<void>((resolve) => {
    window[CB_NAME] = () => resolve();
    if (document.getElementById(SCRIPT_ID)) return;
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=${CB_NAME}&channel=${channel}`;
    document.head.appendChild(s);
  });
  return window.__gchMapsReady;
}

const STATUS_COLOR: Record<string, string> = {
  Verified: "#0f172a",
  Pending: "#64748b",
  Incomplete: "#cbd5e1",
  Flagged: "#dc2626",
};

interface Props {
  entities: Entity[];
  height?: number;
  onSelect?: (e: Entity) => void;
  selectedId?: string;
  zoom?: number;
  center?: { lat: number; lng: number };
}

export function GoogleMap({ entities, height = 520, onSelect, selectedId, zoom, center }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadMaps().then(() => {
      if (cancelled || !ref.current || !window.google) return;
      if (!mapRef.current) {
        mapRef.current = new window.google.maps.Map(ref.current, {
          center: center ?? { lat: 25, lng: 30 },
          zoom: zoom ?? 2,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    const bounds = new window.google.maps.LatLngBounds();
    entities.forEach((e) => {
      const color = STATUS_COLOR[e.verificationStatus] || "#64748b";
      const marker = new window.google.maps.Marker({
        position: { lat: e.latitude, lng: e.longitude },
        map: mapRef.current,
        title: e.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: selectedId === e.id ? 9 : 6,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      if (onSelect) marker.addListener("click", () => onSelect(e));
      markersRef.current.push(marker);
      bounds.extend({ lat: e.latitude, lng: e.longitude });
    });
    if (entities.length > 1 && !center) {
      mapRef.current.fitBounds(bounds, 60);
    } else if (entities.length === 1) {
      mapRef.current.setCenter({ lat: entities[0].latitude, lng: entities[0].longitude });
      mapRef.current.setZoom(zoom ?? 8);
    }
  }, [entities, selectedId, onSelect, center, zoom]);

  return <div ref={ref} style={{ width: "100%", height }} className="rounded-lg border" />;
}
