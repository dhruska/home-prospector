import fs from "fs";
import { dataPath } from "./lib/dataPath";
import Papa from "papaparse";
import PropertyBrowser from "./components/PropertyBrowser";
import type { Property, GeocodedCoords } from "./types/property";

export default function Home() {
  const csvPath = dataPath("propwire_export.csv");
  const csvText = fs.readFileSync(csvPath, "utf-8");

  const { data, meta } = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const allColumns = (meta.fields ?? []).filter((c) => c !== "coords");
  const columns = allColumns.filter((col) =>
    data.some((row) => row[col] !== null && row[col] !== undefined && row[col] !== "")
  );

  // Load geocoded coordinates if available
  const geocodedPath = dataPath("geocoded.json");
  let geocoded: Record<string, GeocodedCoords | null> = {};
  if (fs.existsSync(geocodedPath)) {
    geocoded = JSON.parse(fs.readFileSync(geocodedPath, "utf-8"));
  }

  const properties: Property[] = data.map((row) => ({
    ...row,
    coords: geocoded[String(row.Id)] ?? undefined,
  }));

  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-3 border-b border-zinc-200 bg-white shrink-0">
        <h1 className="text-xl font-semibold text-zinc-900 inline mr-3">
          Pocket Listing
        </h1>
        <span className="text-sm text-zinc-500">
          {data.length} properties · {columns.length} columns · Click a row or
          marker to select
        </span>
      </div>
      <PropertyBrowser properties={properties} columns={columns} />
    </div>
  );
}
