"use client";

import { useEffect } from "react";
import type { Property } from "../types/property";

function buildZillowUrl(p: Property): string {
  const slug = [p.Address, p.City, p.State, String(p.Zip ?? "")]
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/[,#]/g, "")
    .replace(/\s+/g, "-");
  return `https://www.zillow.com/homes/${slug}_rb/`;
}

function buildRedfinUrl(p: Property): string {
  const query = [p.Address, p.City, p.State, String(p.Zip ?? "")]
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent("redfin " + query)}`;
}

function buildAppleMapsUrl(p: Property): string {
  if (p.coords) {
    return `https://maps.apple.com/?ll=${p.coords.lat},${p.coords.lng}&q=${encodeURIComponent(p.Address ?? "")}&z=16`;
  }
  const q = [p.Address, p.City, p.State, String(p.Zip ?? "")]
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .join(", ");
  return `https://maps.apple.com/?q=${encodeURIComponent(q)}`;
}

function buildGoogleMapsUrl(p: Property): string {
  if (p.coords) {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.coords.lat},${p.coords.lng}`;
  }
  const q = [p.Address, p.City, p.State, String(p.Zip ?? "")]
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function computeBearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

async function openGoogleMapsStreetView(p: Property): Promise<void> {
  if (!p.coords) {
    window.open(buildGoogleMapsUrl(p), "_blank", "noopener,noreferrer");
    return;
  }
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    window.open(buildGoogleMapsUrl(p), "_blank", "noopener,noreferrer");
    return;
  }
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/streetview/metadata?location=${p.coords.lat},${p.coords.lng}&key=${key}`
    );
    const data = await res.json();
    if (data.status === "OK" && data.location) {
      const heading = computeBearing(data.location, p.coords);
      window.open(
        `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.coords.lat},${p.coords.lng}&heading=${Math.round(heading)}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else {
      window.open(buildGoogleMapsUrl(p), "_blank", "noopener,noreferrer");
    }
  } catch {
    window.open(buildGoogleMapsUrl(p), "_blank", "noopener,noreferrer");
  }
}

function buildStreetViewUrl(p: Property): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const location = p.coords
    ? `${p.coords.lat},${p.coords.lng}`
    : [p.Address, p.City, p.State, String(p.Zip ?? "")]
        .map((s) => String(s ?? "").trim())
        .filter(Boolean)
        .join(", ");
  if (!location) return null;
  return (
    `https://maps.googleapis.com/maps/api/streetview` +
    `?size=640x320&location=${encodeURIComponent(location)}` +
    `&fov=90&key=${key}`
  );
}

function fmt(
  val: unknown,
  type: "currency" | "number" | "text" | "percent" = "text"
): string {
  if (val === null || val === undefined || val === "") return "—";
  if (type === "currency" && typeof val === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  }
  if (type === "number" && typeof val === "number") {
    return new Intl.NumberFormat("en-US").format(val);
  }
  if (type === "percent" && typeof val === "number") {
    return `${val.toFixed(1)}%`;
  }
  return String(val);
}

interface Section {
  title: string;
  fields: { label: string; value: unknown; type?: "currency" | "number" | "text" | "percent" }[];
}

interface Props {
  property: Property;
  properties: Property[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export default function PropertyDetailModal({ property: p, properties, onClose, onNavigate }: Props) {
  const currentIndex = properties.findIndex((prop) => String(prop.Id) === String(p.Id));
  const prevProp = currentIndex > 0 ? properties[currentIndex - 1] : null;
  const nextProp = currentIndex < properties.length - 1 ? properties[currentIndex + 1] : null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (prevProp) onNavigate(String(prevProp.Id));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (nextProp) onNavigate(String(nextProp.Id));
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onNavigate, prevProp, nextProp]);

  const owner = [p["Owner 1 First Name"], p["Owner 1 Last Name"]]
    .filter(Boolean)
    .join(" ");
  const owner2 = [p["Owner 2 First Name"], p["Owner 2 Last Name"]]
    .filter(Boolean)
    .join(" ");

  const sections: Section[] = [
    {
      title: "Property Facts",
      fields: [
        { label: "Property Type", value: p["Property Type"] },
        { label: "Land Use", value: p["Land Use"] },
        { label: "Living Sq Ft", value: p["Living Square Feet"], type: "number" },
        { label: "Lot (Acres)", value: p["Lot (Acres)"] },
        { label: "Year Built", value: p["Year Built"] },
        { label: "Bedrooms", value: p.Bedrooms },
        { label: "Bathrooms", value: p.Bathrooms },
        { label: "Stories", value: p["# of Stories"] },
        { label: "Subdivision", value: p.Subdivision },
        { label: "APN", value: p.APN },
      ],
    },
    {
      title: "Ownership",
      fields: [
        { label: "Owner", value: owner || "—" },
        { label: "Co-Owner", value: owner2 || "—" },
        { label: "Owner Type", value: p["Owner Type"] },
        { label: "Owner Occupied", value: p["Owner Occupied"] ? "Yes" : "No" },
        { label: "Ownership Length", value: p["Ownership Length (Months)"] ? `${p["Ownership Length (Months)"]} mo` : "—" },
        { label: "Mailing Address", value: p["Owner Mailing Address"] },
        { label: "Mailing City/State", value: p["Owner Mailing City"] ? `${p["Owner Mailing City"]}, ${p["Owner Mailing State"]} ${p["Owner Mailing Zip"]}` : "—" },
      ],
    },
    {
      title: "Listing",
      fields: [
        { label: "Listing Status", value: p["Listing Status"] },
        { label: "Listing Price", value: p["Listing Price"], type: "currency" },
        { label: "Days on Market", value: p["Days on Market"] },
        { label: "Last Sale Date", value: p["Last Sale Date"] },
        { label: "Last Sale Amount", value: p["Last Sale Amount"], type: "currency" },
      ],
    },
    {
      title: "Financials",
      fields: [
        { label: "Estimated Value", value: p["Estimated Value"], type: "currency" },
        { label: "Estimated Equity", value: p["Estimated Equity"], type: "currency" },
        { label: "Equity %", value: p["Estimated Equity Percent"], type: "percent" },
        { label: "Open Mortgage", value: p["Open Mortgage Balance"], type: "currency" },
        { label: "Mortgage Rate", value: p["Recorded Mortgage Interest Rate"] ? `${p["Recorded Mortgage Interest Rate"]}%` : "—" },
        { label: "Tax Amount", value: p["Tax Amount"], type: "currency" },
        { label: "Assessed Value", value: p["Assessed Total Value"], type: "currency" },
        { label: "Market Value", value: p["Market Value"], type: "currency" },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-zinc-900">
              {fmt(p.Address)}
            </h2>
            <p className="text-sm text-zinc-500">
              {fmt(p.City)}, {fmt(p.State)} {fmt(p.Zip)} · {fmt(p.County)} County
            </p>
            <div className="flex gap-2 mt-1.5">
              <a href={buildZillowUrl(p)} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                Zillow ↗
              </a>
              <a href={buildRedfinUrl(p)} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">
                Redfin ↗
              </a>
              <button onClick={() => openGoogleMapsStreetView(p)}
                 className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 cursor-pointer">
                Google Maps ↗
              </button>
              <a href={buildAppleMapsUrl(p)} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-200">
                Apple Maps ↗
              </a>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => prevProp && onNavigate(String(prevProp.Id))}
              disabled={!prevProp}
              className="px-2 py-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-lg leading-none"
              aria-label="Previous property"
            >
              ‹
            </button>
            <span className="text-xs text-zinc-400 tabular-nums">
              {currentIndex + 1} / {properties.length}
            </span>
            <button
              onClick={() => nextProp && onNavigate(String(nextProp.Id))}
              disabled={!nextProp}
              className="px-2 py-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-lg leading-none"
              aria-label="Next property"
            >
              ›
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 text-zinc-400 hover:text-zinc-700 cursor-pointer text-xl leading-none ml-1"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Street View photo */}
        {(() => {
          const url = buildStreetViewUrl(p);
          return url ? (
            <div className="w-full bg-zinc-100 overflow-hidden" style={{ height: "260px" }}>
              <img
                src={url}
                alt={`Street view of ${p.Address}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                }}
              />
            </div>
          ) : null;
        })()}

        {/* Hero row */}
        <div className="grid grid-cols-3 gap-px bg-zinc-100 border-b border-zinc-200">
          {[
            { label: "Est. Value", value: fmt(p["Estimated Value"], "currency") },
            { label: "Last Sale", value: fmt(p["Last Sale Amount"], "currency") },
            { label: "Tax Amount", value: fmt(p["Tax Amount"], "currency") },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-4 py-3 text-center">
              <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
              <div className="text-xl font-bold text-zinc-900 mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="px-6 py-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
                {section.title}
              </h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {section.fields.map(({ label, value, type }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <dt className="text-zinc-500 shrink-0 pr-2">{label}</dt>
                    <dd className="text-zinc-900 font-medium text-right truncate">
                      {fmt(value, type)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
