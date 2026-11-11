// Generates fictional sample data in data/ so the app runs out of the box.
//
// Addresses are real, publicly documented Frank Lloyd Wright–designed homes in
// the Chicago area (Year Built = Wright's design year). EVERYTHING ELSE — owners,
// prices, specs, taxes, sale history — is randomly generated and fictional.
//
// Writes: data/propwire_export.csv, data/ratings.json, data/addressed.json
// Then run `DATA_DIR=data node scripts/geocode.mjs` to (re)build data/geocoded.json.
//
// Deterministic: same seed → same output.
// Run: node scripts/generate-sample-data.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "data");

// [name, address, city, zip, county, year]
const HOMES = [
  // Oak Park
  ["Frank Lloyd Wright Home and Studio", "951 CHICAGO AVE", "OAK PARK", "60302", "Cook", 1889],
  ["Robert P. Parker House", "1019 CHICAGO AVE", "OAK PARK", "60302", "Cook", 1892],
  ["Thomas H. Gale House", "1027 CHICAGO AVE", "OAK PARK", "60302", "Cook", 1892],
  ["Walter H. Gale House", "1031 CHICAGO AVE", "OAK PARK", "60302", "Cook", 1893],
  ["Francis J. Woolley House", "1030 SUPERIOR ST", "OAK PARK", "60302", "Cook", 1893],
  ["Nathan G. Moore House", "333 FOREST AVE", "OAK PARK", "60302", "Cook", 1895],
  ["Harrison P. Young House", "334 N KENILWORTH AVE", "OAK PARK", "60302", "Cook", 1895],
  ["Charles E. Roberts House", "321 N EUCLID AVE", "OAK PARK", "60302", "Cook", 1896],
  ["Rollin Furbeck House", "515 FAIR OAKS AVE", "OAK PARK", "60302", "Cook", 1897],
  ["George Furbeck House", "223 N EUCLID AVE", "OAK PARK", "60302", "Cook", 1897],
  ["George W. Smith House", "404 HOME AVE", "OAK PARK", "60302", "Cook", 1898],
  ["Frank W. Thomas House", "210 FOREST AVE", "OAK PARK", "60302", "Cook", 1901],
  ["William G. Fricke House", "540 FAIR OAKS AVE", "OAK PARK", "60302", "Cook", 1901],
  ["Arthur Heurtley House", "318 FOREST AVE", "OAK PARK", "60302", "Cook", 1902],
  ["William E. Martin House", "636 N EAST AVE", "OAK PARK", "60302", "Cook", 1902],
  ["Edwin H. Cheney House", "520 N EAST AVE", "OAK PARK", "60302", "Cook", 1903],
  ["Edward R. Hills House", "313 FOREST AVE", "OAK PARK", "60302", "Cook", 1906],
  ["Peter A. Beachy House", "238 FOREST AVE", "OAK PARK", "60302", "Cook", 1906],
  ["Laura Gale House", "6 ELIZABETH CT", "OAK PARK", "60302", "Cook", 1909],
  ["Oscar B. Balch House", "611 N KENILWORTH AVE", "OAK PARK", "60302", "Cook", 1911],
  ["Harry S. Adams House", "710 AUGUSTA ST", "OAK PARK", "60302", "Cook", 1913],
  // River Forest
  ["William H. Winslow House", "515 AUVERGNE PL", "RIVER FOREST", "60305", "Cook", 1893],
  ["Chauncey L. Williams House", "530 EDGEWOOD PL", "RIVER FOREST", "60305", "Cook", 1895],
  ["E. Arthur Davenport House", "559 ASHLAND AVE", "RIVER FOREST", "60305", "Cook", 1901],
  ["Isabel Roberts House", "603 EDGEWOOD PL", "RIVER FOREST", "60305", "Cook", 1908],
  ["J. Kibben Ingalls House", "562 KEYSTONE AVE", "RIVER FOREST", "60305", "Cook", 1909],
  // Chicago
  ["James Charnley House", "1365 N ASTOR ST", "CHICAGO", "60610", "Cook", 1891],
  ["Warren McArthur House", "4852 S KENWOOD AVE", "CHICAGO", "60615", "Cook", 1892],
  ["George Blossom House", "4858 S KENWOOD AVE", "CHICAGO", "60615", "Cook", 1892],
  ["Isidore H. Heller House", "5132 S WOODLAWN AVE", "CHICAGO", "60615", "Cook", 1897],
  ["Frederick C. Robie House", "5757 S WOODLAWN AVE", "CHICAGO", "60637", "Cook", 1909],
  ["Emil Bach House", "7415 N SHERIDAN RD", "CHICAGO", "60626", "Cook", 1915],
  // Suburbs
  ["Robert G. Emmond House", "109 S 8TH AVE", "LA GRANGE", "60525", "Cook", 1892],
  ["Peter Goan House", "108 S 8TH AVE", "LA GRANGE", "60525", "Cook", 1893],
  ["Frederick Bagley House", "101 COUNTY LINE RD", "HINSDALE", "60521", "DuPage", 1894],
  ["F. B. Henderson House", "301 S KENILWORTH AVE", "ELMHURST", "60126", "DuPage", 1901],
  ["Ward W. Willits House", "1445 SHERIDAN RD", "HIGHLAND PARK", "60035", "Lake", 1901],
  ["Charles A. Brown House", "2420 HARRISON ST", "EVANSTON", "60201", "Cook", 1905],
  ["William A. Glasner House", "850 SHERIDAN RD", "GLENCOE", "60022", "Cook", 1905],
  ["Hiram Baldwin House", "205 ESSEX RD", "KENILWORTH", "60043", "Cook", 1905],
  ["Avery Coonley House", "300 SCOTTSWOOD RD", "RIVERSIDE", "60546", "Cook", 1908],
  ["Frank J. Baker House", "507 LAKE AVE", "WILMETTE", "60091", "Cook", 1909],
];

const HEADER = ["Id", "Address", "City", "State", "Zip", "County", "Living Square Feet", "Year Built", "Lot (Acres)", "Lot (Square Feet)", "Land Use", "Property Type", "Property Use", "Subdivision", "APN", "Legal Description", "Units Count", "Bedrooms", "Bathrooms", "# of Stories", "Garage Type", "Garage Square Feet", "Carport", "Carport Area", "Air Conditioning Type", "Heating Type", "# of Fireplaces", "Owner 1 First Name", "Owner 1 Last Name", "Owner 2 First Name", "Owner 2 Last Name", "Owner 3 First Name", "Owner 3 Last Name", "Owner 4 First Name", "Owner 4 Last Name", "Owner Mailing Address", "Owner Mailing City", "Owner Mailing State", "Owner Mailing Zip", "Ownership Length (Months)", "Owner Type", "Owner Occupied", "Vacant?", "Listing Status", "Listing Price", "Days on Market", "Last Updated", "Listing Agent Full Name", "Listing Agent First Name", "Listing Agent Last Name", "Listing Agent Email", "Listing Agent Phone", "Listing Brokerage Name", "Listing Brokerage Phone", "Listing Brokerage Url", "MLS Type", "Last Sale Date", "Last Sale Amount", "Estimated Value", "Estimated Equity", "Estimated Equity Percent", "Open Mortgage Balance", "Recorded Mortgage Interest Rate", "Mortgage Document Date", "Mortgage Loan Type", "Lender Name", "Deed Type", "Position", "Tax Amount", "Assessment Year", "Assessed Total Value", "Assessed Land Value", "Assessed Improvement Value", "Assessed Improvement Percentage", "Market Value", "Market Land Value", "Market Improvement Value", "Market Improvement Percentage", "Status", "Default Amount", "Opening bid", "Recording Date", "Auction Date", "Auction Time", "Auction Courthouse", "Auction Address", "Auction City State"];

// Obviously fictional owner names.
const FIRST = ["ALEX", "JORDAN", "TAYLOR", "MORGAN", "CASEY", "RILEY", "JAMIE", "AVERY", "QUINN", "DREW", "SAM", "ROBIN"];
const LAST = ["SAMPLE", "EXAMPLE", "PLACEHOLDER", "DEMO", "TESTER", "FICTION", "DOE", "ROE"];

// Small seeded PRNG (mulberry32).
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(1867); // Wright's birth year
const between = (lo, hi) => lo + rand() * (hi - lo);
const int = (lo, hi) => Math.floor(between(lo, hi + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const round = (n, to) => Math.round(n / to) * to;

function csvCell(v) {
  if (v === null || v === undefined || v === "") return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const ratingsChoices = ["yes", "yes", "maybe", "no", "no", "no"];
const rows = [];
const ratings = {};
const addressed = {};

HOMES.forEach(([name, address, city, zip, county, year], i) => {
  const id = 1001 + i;
  const sqft = round(between(1800, 6500), 10);
  const lotSqft = round(between(6000, 45000), 10);
  const value = round(between(650_000, 2_400_000), 1000);
  const ownedMonths = int(12, 360);
  const saleDate = new Date(Date.UTC(2026, 9, 1) - ownedMonths * 30.44 * 86400_000);
  const saleAmount = round(value * between(0.45, 0.95), 1000);
  const mortgage = rand() < 0.3 ? 0 : round(saleAmount * between(0.2, 0.75), 100);
  const assessed = round(value * between(0.28, 0.34), 1);
  const land = round(assessed * between(0.25, 0.45), 1);
  const listed = rand() < 0.15;
  const first1 = pick(FIRST);
  const last = pick(LAST);
  const twoOwners = rand() < 0.6;

  const row = {
    Id: id,
    Address: address,
    City: city,
    State: "IL",
    Zip: zip,
    County: county,
    "Living Square Feet": sqft,
    "Year Built": year,
    "Lot (Acres)": (lotSqft / 43560).toFixed(4),
    "Lot (Square Feet)": lotSqft,
    "Land Use": "Residential",
    "Property Type": "Single Family Residence",
    "Property Use": "SINGLE FAMILY RESIDENCE",
    Subdivision: name.toUpperCase(),
    APN: `00-00-000-${String(id).padStart(3, "0")}`,
    "Legal Description": "SAMPLE DATA - NOT A REAL RECORD",
    "Units Count": 0,
    Bedrooms: int(3, 6),
    Bathrooms: int(2, 5),
    "# of Stories": pick([1, 2, 2, 2, 3]),
    "Garage Type": pick(["Detached Garage", "Attached Garage", "Type Not Specified"]),
    "Garage Square Feet": pick([0, 400, 480, 576, 640]),
    "Air Conditioning Type": pick(["CENTRAL", "WINDOW UNIT", "NONE"]),
    "Heating Type": pick(["FORCED AIR", "HOT WATER", "RADIANT"]),
    "# of Fireplaces": int(0, 3),
    "Owner 1 First Name": first1,
    "Owner 1 Last Name": last,
    "Owner 2 First Name": twoOwners ? pick(FIRST.filter((f) => f !== first1)) : "",
    "Owner 2 Last Name": twoOwners ? last : "",
    "Owner Mailing Address": address,
    "Owner Mailing City": city,
    "Owner Mailing State": "IL",
    "Owner Mailing Zip": zip,
    "Ownership Length (Months)": ownedMonths,
    "Owner Type": "INDIVIDUAL",
    "Owner Occupied": 1,
    "Listing Status": listed ? "Active" : "",
    "Listing Price": listed ? round(value * between(0.95, 1.15), 1000) : "",
    "Days on Market": listed ? int(1, 120) : "",
    "Last Sale Date": saleDate.toISOString().slice(0, 10),
    "Last Sale Amount": saleAmount,
    "Estimated Value": value,
    "Estimated Equity": value - mortgage,
    "Estimated Equity Percent": Math.round(((value - mortgage) / value) * 100),
    "Open Mortgage Balance": mortgage || "",
    "Recorded Mortgage Interest Rate": mortgage ? between(2.5, 7.5).toFixed(2) : "",
    "Mortgage Loan Type": mortgage ? "CONVENTIONAL" : "",
    "Lender Name": mortgage ? "SAMPLE LENDER" : "",
    "Deed Type": mortgage ? "DEED OF TRUST" : "",
    Position: mortgage ? "First" : "",
    "Tax Amount": (value * between(0.018, 0.026)).toFixed(2),
    "Assessment Year": 2025,
    "Assessed Total Value": assessed,
    "Assessed Land Value": land,
    "Assessed Improvement Value": assessed - land,
    "Assessed Improvement Percentage": Math.round(((assessed - land) / assessed) * 100),
    "Market Value": round(assessed * 3, 1),
    "Market Land Value": land * 3,
    "Market Improvement Value": (assessed - land) * 3,
    "Market Improvement Percentage": Math.round(((assessed - land) / assessed) * 100),
  };
  rows.push(HEADER.map((h) => csvCell(row[h])).join(","));

  if (rand() < 0.6) ratings[id] = pick(ratingsChoices);
  if (ratings[id] === "yes" && rand() < 0.5) addressed[id] = true;
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "propwire_export.csv"),
  [HEADER.map(csvCell).join(","), ...rows].join("\n") + "\n"
);
fs.writeFileSync(path.join(outDir, "ratings.json"), JSON.stringify(ratings, null, 2) + "\n");
fs.writeFileSync(path.join(outDir, "addressed.json"), JSON.stringify(addressed, null, 2) + "\n");
console.log(`Wrote ${rows.length} sample properties to ${outDir}`);
