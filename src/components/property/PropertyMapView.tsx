
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { LatLngTuple } from "leaflet";

type Property = {
  id: string;
  lat: number;
  lng: number;
  price: number;
  address: string;
};

type Props = {
  properties: Property[];
};

export default function PropertyMapView({
  properties,
}: Props) {
  const center: LatLngTuple = [40.7, -74];

  return (
    <div className="h-screen w-full">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup>
          {properties.map((p) => (
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
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}