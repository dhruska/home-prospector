"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import PropertyTable from "./PropertyTable";
import PropertyDetailModal from "./PropertyDetailModal";
import type { Property } from "../types/property";
import type { Rating } from "../api/ratings/route";

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
  const [splitPct, setSplitPct] = useState(60);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback(() => {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPct(Math.min(80, Math.max(20, pct)));
  }, []);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortedProperties, setSortedProperties] = useState<Property[]>(properties);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [ratingFilter, setRatingFilter] = useState<Set<Rating | "unrated">>(new Set());
  const [addressed, setAddressed] = useState<Record<string, boolean>>({});

  // Load persisted ratings on mount
  useEffect(() => {
    fetch("/api/ratings")
      .then((r) => r.json())
      .then(setRatings)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/addressed")
      .then((r) => r.json())
      .then(setAddressed)
      .catch(() => {});
  }, []);

  // Request geolocation on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  async function handleAddressed(id: string) {
    const current = addressed[id] ?? false;
    const res = await fetch("/api/addressed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, addressed: !current }),
    });
    const updated = await res.json();
    setAddressed(updated);
  }

  async function handleRate(id: string, rating: Rating | null) {
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, rating }),
    });
    const updated = await res.json();
    setRatings(updated);
  }

  const displayProperties = useMemo(() => {
    return properties.map((p) => {
      const id = String(p.Id);
      const withRating: Property = { ...p, Rating: ratings[id] ?? null };
      if (userLocation && p.coords) {
        withRating.Distance = parseFloat(
          haversineDistanceMi(userLocation, p.coords).toFixed(1)
        );
      } else if (userLocation) {
        withRating.Distance = null;
      }
      return withRating;
    });
  }, [properties, userLocation, ratings]);

  const filteredProperties = useMemo(() => {
    if (ratingFilter.size === 0) return displayProperties;
    return displayProperties.filter((p) => {
      const r = p.Rating as Rating | null | undefined;
      if (ratingFilter.has("unrated") && !r) return true;
      if (r && ratingFilter.has(r)) return true;
      return false;
    });
  }, [displayProperties, ratingFilter]);

  const displayColumns = useMemo(() => {
    const cols = ["Rating", ...columns];
    if (userLocation) cols.splice(1, 0, "Distance");
    return cols;
  }, [columns, userLocation]);

  const selectedProperty = useMemo(
    () =>
      selectedId != null
        ? (displayProperties.find((p) => String(p.Id) === selectedId) ?? null)
        : null,
    [selectedId, displayProperties]
  );

  const ratingCounts = useMemo(() => {
    const counts = { yes: 0, maybe: 0, no: 0, unrated: 0 };
    for (const p of displayProperties) {
      const r = p.Rating as Rating | null | undefined;
      if (r === "yes") counts.yes++;
      else if (r === "maybe") counts.maybe++;
      else if (r === "no") counts.no++;
      else counts.unrated++;
    }
    return counts;
  }, [displayProperties]);

  const mappableProperties = useMemo(
    () => filteredProperties.filter((p) => p.coords != null),
    [filteredProperties]
  );

  return (
    <>
      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        <div className="overflow-auto flex flex-col" style={{ width: `${splitPct}%` }}>
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-200 bg-zinc-50 text-xs shrink-0">
            <span className="text-zinc-400 font-medium mr-1">Show:</span>
            <button
              onClick={() => setRatingFilter(new Set())}
              className={`px-2 py-0.5 rounded border font-medium transition-colors ${
                ratingFilter.size === 0
                  ? "bg-zinc-800 text-white border-zinc-800"
                  : "bg-white text-zinc-500 border-zinc-300 hover:border-zinc-400"
              }`}
            >
              All
            </button>
            {(
              [
                { key: "yes",     label: "✓ Yes",   count: ratingCounts.yes,     active: "bg-green-100 text-green-700 border-green-300" },
                { key: "maybe",   label: "? Maybe", count: ratingCounts.maybe,   active: "bg-amber-100 text-amber-700 border-amber-300" },
                { key: "no",      label: "✕ No",    count: ratingCounts.no,      active: "bg-red-100 text-red-700 border-red-300" },
                { key: "unrated", label: "Unrated", count: ratingCounts.unrated, active: "bg-zinc-200 text-zinc-700 border-zinc-400" },
              ] as { key: "yes" | "maybe" | "no" | "unrated"; label: string; count: number; active: string }[]
            ).map(({ key, label, count, active }) => {
              const isOn = ratingFilter.has(key);
              return (
                <button
                  key={key}
                  onClick={() => {
                    setRatingFilter((prev) => {
                      const next = new Set(prev);
                      isOn ? next.delete(key) : next.add(key);
                      return next;
                    });
                  }}
                  className={`px-2 py-0.5 rounded border font-medium transition-colors ${
                    isOn ? active : "bg-white text-zinc-500 border-zinc-300 hover:border-zinc-400"
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
            {ratingFilter.size > 0 && (
              <span className="ml-auto text-zinc-400">
                {filteredProperties.length} of {displayProperties.length}
              </span>
            )}
          </div>
          <div className="overflow-auto flex-1">
            <PropertyTable
              data={filteredProperties}
              columns={displayColumns}
              selectedId={selectedId}
              onSelect={handleSelect}
              onSortedRows={setSortedProperties}
              defaultSortId={userLocation ? "Distance" : undefined}
            />
          </div>
        </div>
        <div
          className="w-1.5 shrink-0 cursor-col-resize bg-zinc-200 hover:bg-zinc-400 active:bg-zinc-500 transition-colors"
          onMouseDown={onMouseDown}
        />
        <div className="overflow-hidden" style={{ width: `${100 - splitPct}%` }}>
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
          onRate={handleRate}
          addressed={addressed}
          onAddressed={handleAddressed}
        />
      )}
    </>
  );
}
