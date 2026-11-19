"use client";

import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price?: number;
  address?: string;
}

interface Props {
  properties: MapPin[];
  center?: [number, number];
  zoom?: number;
}

// Custom pin as a CSS divIcon (avoids Leaflet's default image-path issues).
const pinIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:#2563eb;border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -18],
});

export default function PropertyLocationMap({
  properties,
  center = [40.7, -74],
  zoom = 10,
}: Props) {
  const markers = useMemo(
    () =>
      properties.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon} title={p.title}>
          <Popup>
            <p className="font-semibold">{p.title}</p>
            {p.address && <p>{p.address}</p>}
            {p.price !== undefined && <p>${p.price.toLocaleString()}</p>}
          </Popup>
        </Marker>
      )),
    [properties],
  );

  return (
    <section aria-label="Property locations map" className="h-[60vh] min-h-[300px] w-full">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup chunkedLoading>{markers}</MarkerClusterGroup>
      </MapContainer>
    </section>
  );
}
