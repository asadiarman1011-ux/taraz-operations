/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Store to control map from parent anytime, google map itself is in charge of the re-rendering, not react state.
 * </MapView>
 *
 * ======
 * Available Libraries and Core Features:
 * -------------------------------
 * 📍 MARKER (from `marker` library)
 * - Attaches to map using { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: 37.7749, lng: -122.4194 },
 *   title: "San Francisco",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (from `places` library)
 * - Does not attach directly to map; use data with your map manually.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (from `geocoding` library)
 * - Standalone service; manually apply results to map.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRY (from `geometry` library)
 * - Pure utility functions; not attached to map.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROUTES (from `routes` library)
 * - Combines DirectionsService (standalone) + DirectionsRenderer (map-attached)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ MAP LAYERS (attach directly to map)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - “map-attached” → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - “standalone” → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - “data-only” → Place, Geometry utilities.
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;
let mapScriptPromise: Promise<void> | null = null;

function loadMapScript(): Promise<void> {
  if (window.google?.maps?.Map) return Promise.resolve();
  const existing = document.getElementById("sepid-google-maps-script") as HTMLScriptElement | null;
  if (existing) {
    if (window.google?.maps?.Map) return Promise.resolve();
    if (mapScriptPromise) return mapScriptPromise;
    existing.remove();
  }
  if (mapScriptPromise) return mapScriptPromise;
  mapScriptPromise = new Promise((resolve, reject) => {
    const script = existing ?? document.createElement("script");
    script.id = "sepid-google-maps-script";
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    const handleLoad = () => { script.removeEventListener("load", handleLoad); script.removeEventListener("error", handleError); resolve(); };
    const handleError = () => { script.removeEventListener("load", handleLoad); script.removeEventListener("error", handleError); mapScriptPromise = null; reject(new Error("Failed to load Google Maps")); };
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    if (!existing) document.head.appendChild(script);
  });
  return mapScriptPromise;
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [mapFailed, setMapFailed] = useState(false);

  const init = usePersistFn(async () => {
    await loadMapScript();
    if (!mapContainer.current) {
      return;
    }
    if (!window.google?.maps?.Map) return;
    map.current = new window.google.maps.Map(mapContainer.current, {
      zoom: initialZoom,
      center: initialCenter,
      mapTypeControl: true,
      clickableIcons: false,
      gestureHandling: "greedy",
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: true,
      mapId: "DEMO_MAP_ID",
    });
    if (onMapReady) {
      onMapReady(map.current);
    }
  });

  useEffect(() => {
    init().catch(() => setMapFailed(true));
  }, [init]);

  return (
    <div className={cn("w-full h-[500px] relative overflow-hidden", className)}>
      <div ref={mapContainer} className="w-full h-full" />
      {mapFailed && (
        <div className="map-fallback" role="status">
          <iframe
            title="نمایش موقعیت ذخیره‌شده"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${initialCenter.lng - 0.04}%2C${initialCenter.lat - 0.03}%2C${initialCenter.lng + 0.04}%2C${initialCenter.lat + 0.03}&layer=mapnik&marker=${initialCenter.lat}%2C${initialCenter.lng}`}
          />
          <div className="map-fallback-actions">
            <span>نمایش جایگزین موقعیت ذخیره‌شده</span>
            <a href={`https://neshan.org/maps/@${initialCenter.lat},${initialCenter.lng},15z`} target="_blank" rel="noreferrer">باز کردن در نشان</a>
            <a href={`https://www.google.com/maps?q=${initialCenter.lat},${initialCenter.lng}`} target="_blank" rel="noreferrer">باز کردن در گوگل</a>
          </div>
        </div>
      )}
    </div>
  );
}
