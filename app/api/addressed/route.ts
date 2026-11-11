import { NextResponse } from "next/server";
import fs from "fs";
import { dataPath } from "../../lib/dataPath";

const addressedPath = dataPath("addressed.json");

function readAddressed(): Record<string, boolean> {
  try {
    return JSON.parse(fs.readFileSync(addressedPath, "utf-8"));
  } catch {
    return {};
  }
}

export async function GET() {
  return NextResponse.json(readAddressed());
}

export async function POST(request: Request) {
  const { id, addressed } = (await request.json()) as { id: string; addressed: boolean | null };
  const data = readAddressed();
  if (!addressed) {
    delete data[id];
  } else {
    data[id] = true;
  }
  fs.writeFileSync(addressedPath, JSON.stringify(data, null, 2));
  return NextResponse.json(data);
}
