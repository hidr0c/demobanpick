import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { songs, filename } = await request.json();

    const poolsDir = path.join(process.cwd(), "public", "pools");
    const filePath = path.join(poolsDir, filename);

    // Ensure pools directory exists
    if (!fs.existsSync(poolsDir)) {
      fs.mkdirSync(poolsDir, { recursive: true });
    }

    // Write/overwrite file
    fs.writeFileSync(filePath, JSON.stringify(songs, null, 2), "utf-8");

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error("Export pool error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
