import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { song, poolFile } = await request.json();

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

    // Add new song with proper id
    const newSong = {
      ...song,
      id: String(songs.length),
      imgUrl: song.imgUrl || "/assets/testjacket.png",
      isDx: String(song.isDx)
    };

    songs.push(newSong);

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(songs, null, 4), "utf-8");

    return NextResponse.json({ success: true, song: newSong, totalSongs: songs.length });
  } catch (error) {
    console.error("Add song error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
