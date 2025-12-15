import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Force Node.js runtime (not Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYNC_FILE = path.join(process.cwd(), "public", "sync-state.json");

// Full state structure for syncing everything
interface SyncState {
  // Stream text overlay
  textData: {
    roundName: string;
    player1: string;
    player2: string;
    player3: string;
    player4: string;
    player1Tag: string;
    player2Tag: string;
    player3Tag: string;
    player4Tag: string;
  };
  // Song display
  displaySong2: any;
  // Match songs
  matchSongs: any[];
  lockedTracks: any;
  // Main page state
  gameState: {
    selectedPool: string;
    randomCount: number;
    pickCount: number;
    banCount: number;
    fixedSongs: any[];
    hiddenTracks: { track3Hidden: boolean; track4Hidden: boolean };
    // Current game progress
    randomResults: any[];
    bannedSongs: any[];
    pickedSongs: any[];
    showBanPick: boolean;
    showFinalResults: boolean;
  };
  timestamp: number;
}

const DEFAULT_STATE: SyncState = {
  textData: {
    roundName: "",
    player1: "",
    player2: "",
    player3: "",
    player4: "",
    player1Tag: "",
    player2Tag: "",
    player3Tag: "",
    player4Tag: "",
  },
  displaySong2: null,
  matchSongs: [],
  lockedTracks: null,
  gameState: {
    selectedPool: "newbieSemi",
    randomCount: 4,
    pickCount: 2,
    banCount: 0,
    fixedSongs: [],
    hiddenTracks: { track3Hidden: false, track4Hidden: false },
    randomResults: [],
    bannedSongs: [],
    pickedSongs: [],
    showBanPick: false,
    showFinalResults: false,
  },
  timestamp: Date.now(),
};

// Initialize sync file if it doesn't exist
function ensureSyncFile() {
  if (!fs.existsSync(SYNC_FILE)) {
    fs.writeFileSync(
      SYNC_FILE,
      JSON.stringify(DEFAULT_STATE, null, 2),
      "utf-8"
    );
  }
}

// GET - Read current state
export async function GET() {
  try {
    ensureSyncFile();
    const data = fs.readFileSync(SYNC_FILE, "utf-8");

    // Add CORS headers for OBS browser
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error reading sync state:", error);
    return NextResponse.json(
      { error: "Failed to read state" },
      { status: 500 }
    );
  }
}

// OPTIONS - Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// POST - Update state
export async function POST(request: NextRequest) {
  try {
    ensureSyncFile();
    const body = await request.json();

    // Read current state
    const currentData = JSON.parse(fs.readFileSync(SYNC_FILE, "utf-8"));

    // Deep merge for nested objects
    const newData = {
      ...currentData,
      ...body,
      // Deep merge gameState if provided
      gameState: body.gameState
        ? { ...currentData.gameState, ...body.gameState }
        : currentData.gameState,
      timestamp: Date.now(),
    };

    fs.writeFileSync(SYNC_FILE, JSON.stringify(newData, null, 2), "utf-8");

    // Add CORS headers
    return new NextResponse(
      JSON.stringify({ success: true, timestamp: newData.timestamp }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error writing sync state:", error);
    return NextResponse.json(
      { error: "Failed to write state" },
      { status: 500 }
    );
  }
}
