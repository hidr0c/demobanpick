import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { songId, poolFile } = await request.json();

    const poolsDir = path.join(process.cwd(), "public", "pools");
    const filePath = path.join(poolsDir, poolFile);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: "Pool file not found" },
        { status: 404 }
      );
    }

    // Read existing songs
    const existingData = fs.readFileSync(filePath, "utf-8");
    const songs = JSON.parse(existingData);

    // Filter out the song to delete
    const filteredSongs = songs.filter((song: any) => song.id !== songId);

    if (filteredSongs.length === songs.length) {
      return NextResponse.json(
        { success: false, error: "Song not found" },
        { status: 404 }
      );
    }

    // Re-index the remaining songs
    const reindexedSongs = filteredSongs.map((song: any, index: number) => ({
      ...song,
      id: String(index)
    }));

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(reindexedSongs, null, 4), "utf-8");

    return NextResponse.json({ success: true, totalSongs: reindexedSongs.length });
  } catch (error) {
    console.error("Delete song error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
