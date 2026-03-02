"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import PropertyTable from "./PropertyTable";
import PropertyDetailModal from "./PropertyDetailModal";
import type { Property } from "../types/property";

const PropertyMap = dynamic(() => import("./PropertyMap"), { ssr: false });

interface Props {
  properties: Property[];
  columns: string[];
}

function haversineDistanceMi(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export default function PropertyBrowser({ properties, columns }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortedProperties, setSortedProperties] = useState<Property[]>(properties);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  const displayProperties = useMemo(() => {
    if (!userLocation) return properties;
    return properties.map((p) => ({
      ...p,
      Distance: p.coords
        ? parseFloat(haversineDistanceMi(userLocation, p.coords).toFixed(1))
        : null,
    }));
  }, [properties, userLocation]);

  const displayColumns = useMemo(
    () => (userLocation ? ["Distance", ...columns] : columns),
    [columns, userLocation]
  );

  const selectedProperty = useMemo(
    () =>
      selectedId != null
        ? (displayProperties.find((p) => String(p.Id) === selectedId) ?? null)
        : null,
    [selectedId, displayProperties]
  );

  const mappableProperties = useMemo(
    () => properties.filter((p) => p.coords != null),
    [properties]
  );

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 overflow-auto">
          <PropertyTable
            data={displayProperties}
            columns={displayColumns}
            selectedId={selectedId}
            onSelect={handleSelect}
            onSortedRows={setSortedProperties}
            defaultSortId={userLocation ? "Distance" : undefined}
          />
        </div>
        <div className="w-1/2">
          <PropertyMap
            properties={mappableProperties}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>
      </div>
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          properties={sortedProperties}
          onClose={() => setSelectedId(null)}
          onNavigate={handleSelect}
        />
      )}
    </>
  );
}
