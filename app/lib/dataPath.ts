import path from "path";

// Directory holding the CSV export, geocodes, ratings, etc.
// Defaults to the bundled sample data in `data/`; set DATA_DIR (e.g. in
// .env.local) to point at your own private data instead.
const DATA_DIR = process.env.DATA_DIR || "data";

export function dataPath(file: string): string {
  return path.resolve(process.cwd(), DATA_DIR, file);
}
