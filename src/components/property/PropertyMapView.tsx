"use client";

import dynamic from "next/dynamic";
import type { MapProperty } from "./MapCanvas";

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

type Props = {
  properties: MapProperty[];
};

export default function PropertyMapView({ properties }: Props) {
  return (
    <MapCanvas
      properties={properties}
    />
  );
}