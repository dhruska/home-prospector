// Geocodes addresses from propwire_export.csv using Google Geocoding API (ROOFTOP precision).
// Saves results to data/geocoded.json as { "[Id]": { lat, lng } }.
// Safe to interrupt and resume — already-geocoded entries are skipped.
// Run: node scripts/geocode.mjs

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// Parse CSV manually (no external deps needed for simple quoted CSV)
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = vals[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocode(address, city, state, zip, apiKey) {
  const q = encodeURIComponent(`${address}, ${city}, ${state} ${zip}, USA`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== "OK" || !json.results?.length) return null;
  const { lat, lng } = json.results[0].geometry.location;
  const type = json.results[0].geometry.location_type;
  return { lat, lng, type };
}

async function main() {
  // Read NEXT_PUBLIC_GOOGLE_MAPS_API_KEY from .env.local
  const envPath = path.join(rootDir, ".env.local");
  let apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey && fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      const m = line.match(/^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=(.+)$/);
      if (m) { apiKey = m[1].trim(); break; }
    }
  }
  if (!apiKey) { console.error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"); process.exit(1); }

  const csvPath = path.join(rootDir, "data", "propwire_export.csv");
  const outPath = path.join(rootDir, "data", "geocoded.json");

  const csvText = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(csvText);

  // Load existing results (for resume support)
  let results = {};
  if (fs.existsSync(outPath)) {
    results = JSON.parse(fs.readFileSync(outPath, "utf-8"));
  }

  let ok = 0;
  let miss = 0;
  let skip = 0;

  for (const row of rows) {
    const id = String(row["Id"]);
    if (!id) continue;

    if (results[id] !== undefined) {
      skip++;
      continue;
    }

    const address = row["Address"] ?? "";
    const city = row["City"] ?? "";
    const state = row["State"] ?? "";
    const zip = row["Zip"] ?? "";

    try {
      const coords = await geocode(address, city, state, zip, apiKey);
      if (coords) {
        results[id] = { lat: coords.lat, lng: coords.lng };
        console.log(`OK  ${id}: ${address}, ${city} → ${coords.lat}, ${coords.lng} [${coords.type}]`);
        ok++;
      } else {
        results[id] = null;
        console.log(`MISS ${id}: ${address}, ${city}`);
        miss++;
      }
    } catch (err) {
      console.error(`ERR  ${id}: ${err.message}`);
      // Don't mark as null — will retry on next run
    }

    // Save after each result so we can resume
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

    // Google Geocoding API allows much higher throughput
    await sleep(50);
  }

  console.log(`\nDone. OK=${ok} MISS=${miss} SKIP=${skip}`);
  console.log(`Results saved to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
