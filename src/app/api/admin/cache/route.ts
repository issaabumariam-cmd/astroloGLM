import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "data", "horoscope_cache");

export async function GET() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json"));
    return NextResponse.json({ files, count: files.length });
  } catch {
    return NextResponse.json({ error: "Could not read cache" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return NextResponse.json({ deleted: 0 });
    }

    const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json"));
    let deleted = 0;
    for (const f of files) {
      fs.unlinkSync(path.join(CACHE_DIR, f));
      deleted++;
    }

    return NextResponse.json({ deleted });
  } catch {
    return NextResponse.json({ error: "Could not clear cache" }, { status: 500 });
  }
}