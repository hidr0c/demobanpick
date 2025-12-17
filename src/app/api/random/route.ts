import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Force Node.js runtime for file system access
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pool file mapping
const POOL_FILES: Record<string, string> = {
  newbieQual1: '/pools/N1 - newbieQual1.json',
  newbieQual2: '/pools/N2 - newbieQual2.json',
  newbieSemi: '/pools/N3 - newbieSemi.json',
  newbieFinals: '/pools/N4 - newbieFinals.json',
  proQual: '/pools/P1 - proTop3216.json',
  proTop8: '/pools/P2 - proTop8.json',
  proSemi: '/pools/P3 - proSemi.json',
  proFinals: '/pools/P4 - proFinals.json',
  top32: '/pools/top32.json',
};

interface Song {
  id: string;
  imgUrl: string;
  artist: string;
  title: string;
  lv: string;
  diff: string;
  isDx: string;
}

// Helper to ensure songs have id field
const ensureIds = (songs: any[]): Song[] => {
  return songs.map((song, index) => ({
    ...song,
    id: song.id || `${song.title}-${song.diff}-${index}`,
    isDx: String(song.isDx)
  }));
};

// Load pool from file
const loadPool = (poolId: string): Song[] => {
  const poolFile = POOL_FILES[poolId];
  if (!poolFile) {
    throw new Error(`Unknown pool: ${poolId}`);
  }

  const filePath = path.join(process.cwd(), "public", poolFile);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Pool file not found: ${poolFile}`);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(fileContent);
  return ensureIds(data);
};

// Shuffle array using Fisher-Yates
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// GET - Get initial display songs (pre-randomized)
export async function GET(request: NextRequest) {
  try {
    const poolId = request.nextUrl.searchParams.get("poolId") || "newbieSemi";
    const count = parseInt(request.nextUrl.searchParams.get("count") || "4");
    const excludeIds = request.nextUrl.searchParams.get("excludeIds")?.split(",").filter(Boolean) || [];

    const pool = loadPool(poolId);
    
    // Filter out excluded songs
    const availablePool = pool.filter(song => !excludeIds.includes(song.id));
    
    // Get random initial display
    const shuffled = shuffleArray(availablePool);
    const initialDisplay = shuffled.slice(0, Math.min(count, shuffled.length));

    return NextResponse.json({
      initialDisplay,
      poolSize: pool.length,
      availableCount: availablePool.length
    }, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("[RANDOM API] GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Trigger random and get results + animation pool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      poolId = "newbieSemi",
      randomCount = 4,
      excludeIds = [],
      animationPoolSize = 60 // Default 60 songs for animation
    } = body;

    const pool = loadPool(poolId);
    
    // Filter out excluded songs
    const availablePool = pool.filter(song => !excludeIds.includes(song.id));

    if (availablePool.length < randomCount) {
      return NextResponse.json({ 
        error: "Not enough songs in pool",
        required: randomCount,
        available: availablePool.length
      }, { status: 400 });
    }

    // Shuffle and pick final results
    const shuffled = shuffleArray(availablePool);
    const results = shuffled.slice(0, randomCount);

    // Get animation pool (more songs for visual cycling)
    // Use different shuffle for variety
    const animationShuffled = shuffleArray(availablePool);
    const animationPool = animationShuffled.slice(0, Math.min(animationPoolSize, availablePool.length));

    return NextResponse.json({
      results,
      animationPool,
      timestamp: Date.now()
    }, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("[RANDOM API] POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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
