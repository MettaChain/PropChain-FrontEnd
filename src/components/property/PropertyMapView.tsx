"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import type { MapProperty } from "./MapCanvas";

/**
 * Props of the map view (Issue #1247).
 *
 * The prop type used to be an inline, unexported `Props` alias, so consumers
 * had to restate the shape and nothing in the code said what the component
 * expects. It is now a named, exported and documented type, and the prop
 * itself is `readonly` so a caller cannot swap the list underneath a render.
 */
export type PropertyMapViewProps = {
  /** The properties to plot on the map. */
  readonly properties: MapProperty[];
};

/**
 * Pushes an event onto the GA data layer (Issue #1243).
 *
 * The layer is only created when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set (see
 * `src/lib/analyticsInit.ts`), so this is a no-op when analytics is off, and
 * on the server there is no `window` at all.
 */
function trackMapViewRendered(propertyCount: number): void {
  if (typeof window === "undefined") return;
  window.dataLayer?.push([
    "event",
    "map_view_rendered",
    { property_count: propertyCount },
  ]);
}

/**
 * Issue #1069 — the react-leaflet/leaflet bundle is split into its own async
 * chunk (MapCanvas) and only fetched when a map view is actually requested.
 * The static import of leaflet is gone from this module, shrinking the routes
 * that render it; a loading skeleton covers the chunk fetch.
 */
const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
        role="status"
        aria-label="Loading map"
      />
    </div>
  ),
});

export default function PropertyMapView({ properties }: PropertyMapViewProps) {
  // Issue #1243 — one event per map view, carrying the number of properties
  // that were plotted. The count is enough to tell "the map was empty" apart
  // from "the map never loaded", without reporting any property data.
  useEffect(() => {
    trackMapViewRendered(properties.length);
  }, [properties.length]);

  return (
    <MapCanvas
      properties={properties}
    />
  );
}
