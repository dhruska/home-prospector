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

const RATING_COLOR: Record<string, string> = {
  yes:   "#16a34a",
  maybe: "#d97706",
  no:    "#dc2626",
};
const DEFAULT_COLOR = "#2563eb";

function makeIcon(color: string, selected: boolean): L.Icon {
  const ring = selected ? `<circle cx="12" cy="12" r="11" fill="white"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    ${ring}
    <circle cx="12" cy="12" r="9" fill="${color}"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
  </svg>`;
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

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

// Fit the initial view to all mapped properties (runs once on mount).
function FitToProperties({ properties }: { properties: Property[] }) {
  const map = useMap();

  useEffect(() => {
    const points = properties
      .filter((p) => p.coords)
      .map((p) => [p.coords!.lat, p.coords!.lng] as [number, number]);
    if (points.length > 0) map.fitBounds(points, { padding: [24, 24], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

// Fallback view before fitting (continental US) — no location baked in.
const CENTER: [number, number] = [39.8, -98.6];

export default function PropertyMap({ properties, selectedId, onSelect }: Props) {
  return (
    <MapContainer
      center={CENTER}
      zoom={4}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <FitToProperties properties={properties} />
      <MapPanner selectedId={selectedId} properties={properties} />
      {properties.map((prop) => {
        if (!prop.coords) return null;
        const id = String(prop.Id);
        const isSelected = selectedId === id;
        return (
          <Marker
            key={id}
            position={[prop.coords.lat, prop.coords.lng]}
            icon={makeIcon(RATING_COLOR[String(prop.Rating ?? "")] ?? DEFAULT_COLOR, isSelected)}
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
