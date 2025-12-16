import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Force Node.js runtime for file system access
export const runtime = "nodejs";
// Prevent caching of this route itself
export const dynamic = "force-dynamic";

const SYNC_FILE = path.join(process.cwd(), "public", "sync-state.json");

// --- In-Memory State Cache ---
// using a global variable to persist state across requests in a serverful environment (like dev or nodejs runtime)
// Note: In serverless, this might reset, but for local OBS usage it's perfect.
let cachedState: SyncState | null = null;
let lastWriteTime = 0;

// Full state structure for reference
interface SyncState {
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
  displaySong2: any;
  matchSongs: any[];
  lockedTracks: any;
  gameState: {
    selectedPool: string;
    randomCount: number;
    pickCount: number;
    banCount: number;
    fixedSongs: any[];
    hiddenTracks: { track3Hidden: boolean; track4Hidden: boolean };
    randomResults: any[];
    bannedSongs: any[];
    pickedSongs: any[];
    showBanPick: boolean;
    showFinalResults: boolean;
    banPickLog?: { type: 'ban' | 'pick'; song: any }[];
  };
  timestamp: number;
  // Optional match display sync
  matchDisplay?: {
    songs: any[];
    currentIndex: number;
  };
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

// Helper: Ensure we have state loaded
function getSyncState(): SyncState {
    // If we have cached state, return it immediately (RAM optimization: no disk read)
    if (cachedState) {
        return cachedState;
    }

    // First load: read from disk
    if (fs.existsSync(SYNC_FILE)) {
        try {
            const fileContent = fs.readFileSync(SYNC_FILE, "utf-8");
            cachedState = JSON.parse(fileContent);
            // Ensure timestamp exists
            if (!cachedState?.timestamp) {
                cachedState = { ...DEFAULT_STATE, ...cachedState, timestamp: Date.now() };
            }
        } catch (e) {
            console.error("[SYNC] Error reading sync file, resetting to default", e);
            cachedState = { ...DEFAULT_STATE, timestamp: Date.now() };
        }
    } else {
        // No file, use default
        cachedState = { ...DEFAULT_STATE, timestamp: Date.now() };
        // Create file
        saveStateToDisk(cachedState);
    }
    
    return cachedState as SyncState;
}

// Helper: Save state to disk (debounced/async could be better but synchronous is safer for consistency)
function saveStateToDisk(state: SyncState) {
    try {
        fs.writeFileSync(SYNC_FILE, JSON.stringify(state, null, 2), "utf-8");
    } catch (e) {
        console.error("[SYNC] Error writing sync file:", e);
    }
}

// GET - Read current state
export async function GET(request: NextRequest) {
  const currentState = getSyncState();
  const checkOnly = request.nextUrl.searchParams.get("check") === "1";

  // Lightest possible response for polling
  if (checkOnly) {
    return new NextResponse(JSON.stringify({ timestamp: currentState.timestamp }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(JSON.stringify(currentState), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Cache-Control": "no-store",
    },
  });
}

// OPTIONS - CORS
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

// Helper to compare objects excluding timestamp
function isEqual(obj1: any, obj2: any): boolean {
    const { timestamp: t1, ...o1 } = obj1 || {};
    const { timestamp: t2, ...o2 } = obj2 || {};
    return JSON.stringify(o1) === JSON.stringify(o2);
}

// POST - Update state
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const currentState = getSyncState();
    
    // Construct the potential new state (without timestamp yet)
    // We need to replicate the merge logic exactly as before to compare
    const candidateState: any = {
      ...currentState,
      ...body,
      // Handle lockedTracks: Could be at top level OR inside gameState (controller sends it inside)
      lockedTracks: body.gameState?.lockedTracks ?? body.lockedTracks ?? currentState.lockedTracks,
      gameState: body.gameState
        ? { ...currentState.gameState, ...body.gameState }
        : currentState.gameState,
      textData: body.textData 
        ? { ...currentState.textData, ...body.textData }
        : currentState.textData,
      matchDisplay: body.matchDisplay || currentState.matchDisplay,
    };

    // Check if anything effectively changed (for logging purposes only)
    const hasChanged = !isEqual(candidateState, currentState);

    // Update in-memory cache ALWAYS to ensure consistency
    const now = Date.now();
    const newData = { ...candidateState, timestamp: now };
    cachedState = newData;

    // Log update only if changed (to reduce spam)
    if (hasChanged) {
        const updateKeys = Object.keys(body).filter(k => k !== 'timestamp');
        console.log(`[SYNC] Updated: ${updateKeys.join(', ')} @ ${new Date(now).toLocaleTimeString()}`);
    }

    // Persist to disk
    saveStateToDisk(newData);

    return new NextResponse(
      JSON.stringify({ success: true, timestamp: newData.timestamp }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("[SYNC] POST Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
