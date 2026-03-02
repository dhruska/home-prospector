"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Property } from "../types/property";

// Fix Leaflet's broken default icon path under Webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
        <path fill="#e53e3e" stroke="#c53030" stroke-width="1.5"
          d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z"/>
        <circle fill="white" cx="12.5" cy="12.5" r="4.5"/>
      </svg>`
    ),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "/marker-shadow.png",
  shadowSize: [41, 41],
});

interface MapPannerProps {
  selectedId: string | null;
  properties: Property[];
}

function MapPanner({ selectedId, properties }: MapPannerProps) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const prop = properties.find((p) => String(p.Id) === selectedId);
    if (prop?.coords) {
      map.flyTo([prop.coords.lat, prop.coords.lng], Math.max(map.getZoom(), 14));
    }
  }, [selectedId, properties, map]);

  return null;
}

interface Props {
  properties: Property[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Center on Oak Park, IL
const CENTER: [number, number] = [41.8875, -87.7896];

export default function PropertyMap({ properties, selectedId, onSelect }: Props) {
  return (
    <MapContainer
      center={CENTER}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapPanner selectedId={selectedId} properties={properties} />
      {properties.map((prop) => {
        if (!prop.coords) return null;
        const id = String(prop.Id);
        const isSelected = selectedId === id;
        return (
          <Marker
            key={id}
            position={[prop.coords.lat, prop.coords.lng]}
            icon={isSelected ? redIcon : new L.Icon.Default()}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(id) }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{prop.Address}</div>
                <div>
                  {prop.City}, {prop.State} {prop.Zip}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
