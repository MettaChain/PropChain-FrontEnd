"use client";

import { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { LatLngTuple } from "leaflet";

export type MapProperty = {
  id: string;
  lat: number;
  lng: number;
  price: number;
  address: string;
};

type Props = {
  properties: MapProperty[];
};

/**
 * Issue #1241 — the map centre was an array literal built on every render,
 * so the `center` prop changed identity each time and react-leaflet was
 * handed a new centre to apply. A module-level constant keeps it stable.
 */
const MAP_CENTER: LatLngTuple = [40.7, -74];

/**
 * Issue #1069 — the leaflet map renderer lives in its own chunk so the heavy
 * `react-leaflet`/`leaflet` JS is only fetched when a map is actually shown.
 * PropertyMapView loads this module via `next/dynamic` (ssr: false) with a
 * skeleton fallback.
 */
export default function MapCanvas({
  properties,
}: Props) {
  // Issue #1241 — the marker tree only depends on `properties`, so it is
  // built once per list instead of on every render of the map container.
  const markers = useMemo(
    () =>
      properties.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
        >
          <Popup>
            <div>
              <p className="font-semibold">
                ${p.price.toLocaleString()}
              </p>
              <p>{p.address}</p>
            </div>
          </Popup>
        </Marker>
      )),
    [properties],
  );

  return (
    <div className="relative h-screen w-full">
      <MapContainer
        center={MAP_CENTER}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup>{markers}</MarkerClusterGroup>
      </MapContainer>

      {/* Issue #1244 — an empty map is indistinguishable from a map that
          failed to load. The map stays underneath and a notice explains why
          there are no markers on it. */}
      {properties.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 p-6 text-center backdrop-blur-sm dark:bg-gray-900/80">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            No properties to show on the map
          </h2>
          <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
            Nothing matches the current filters. Widen or clear the filters to
            see the available properties.
          </p>
        </div>
      )}
    </div>
  );
}
