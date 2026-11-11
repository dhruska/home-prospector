import { NextResponse } from "next/server";
import fs from "fs";
import { dataPath } from "../../lib/dataPath";

export type Rating = "yes" | "maybe" | "no";

const ratingsPath = dataPath("ratings.json");

function readRatings(): Record<string, Rating> {
  try {
    return JSON.parse(fs.readFileSync(ratingsPath, "utf-8"));
  } catch {
    return {};
  }
}

export async function GET() {
  return NextResponse.json(readRatings());
}

export async function POST(request: Request) {
  const { id, rating } = (await request.json()) as { id: string; rating: Rating | null };
  const ratings = readRatings();
  if (rating === null) {
    delete ratings[id];
  } else {
    ratings[id] = rating;
  }
  fs.writeFileSync(ratingsPath, JSON.stringify(ratings, null, 2));
  return NextResponse.json(ratings);
}
