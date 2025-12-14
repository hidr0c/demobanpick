import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { songId, updatedSong, poolFile } = await request.json();

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

    // Find and update the song
    const songIndex = songs.findIndex((song: any) => song.id === songId);

    if (songIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Song not found" },
        { status: 404 }
      );
    }

    // Update the song
    songs[songIndex] = {
      ...songs[songIndex],
      ...updatedSong,
      id: songId, // Keep the original ID
      imgUrl: updatedSong.imgUrl || "/assets/testjacket.png",
      isDx: String(updatedSong.isDx),
    };

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(songs, null, 4), "utf-8");

    return NextResponse.json({ success: true, song: songs[songIndex] });
  } catch (error) {
    console.error("Edit song error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
