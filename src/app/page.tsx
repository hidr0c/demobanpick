'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Song, RoundSetting } from './interface';

import QuadRandomSlot from './components/QuadRandomSlot';
import BanPickCarousel from './components/BanPickCarousel';

// Helper to ensure songs have id field
const ensureIds = (songs: any[]): Song[] => {
  return songs.map((song, index) => ({
    ...song,
    id: song.id || `${song.title}-${song.diff}-${index}`,
    isDx: String(song.isDx) // Ensure isDx is string
  }));
};

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

// Helper function to sync state to API
const syncToAPI = async (gameState: any) => {
  try {
    await fetch('/api/sync-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameState })
    });
  } catch (error) {
    console.error('Failed to sync to API:', error);
  }
};

export default function Home() {
  const router = useRouter();
  const [roundIndex, setRoundIndex] = useState(0);

  // Selected pool (default: newbieSemi)
  const [selectedPool, setSelectedPool] = useState('newbieSemi');
  const [songData, setSongData] = useState<Song[]>([]);
  const [isLoadingPool, setIsLoadingPool] = useState(true);
  const [poolVersion, setPoolVersion] = useState(0); // Force re-render key
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Track if this is OBS mode (loaded from API)
  const [isOBSMode, setIsOBSMode] = useState(false);
  const lastAPITimestamp = useRef(0);

  // Load all settings from localStorage
  const loadSettingsFromStorage = useCallback(() => {
    const savedPool = localStorage.getItem('selectedPool');
    const savedRandomCount = localStorage.getItem('randomCount');
    const savedPickCount = localStorage.getItem('pickCount');
    const savedBanCount = localStorage.getItem('banCount');
    const savedFixedSongs = localStorage.getItem('fixedSongs');
    const savedLockedTracks = localStorage.getItem('lockedTracks');
    const savedHiddenTracks = localStorage.getItem('hiddenTracks');

    if (savedPool && POOL_FILES[savedPool]) {
      setSelectedPool(prev => {
        if (prev !== savedPool) {
          setPoolVersion(v => v + 1);
          return savedPool;
        }
        return prev;
      });
    }
    if (savedRandomCount) setRandomCount(parseInt(savedRandomCount));
    if (savedPickCount) setPickCount(parseInt(savedPickCount));
    if (savedBanCount) setBanCount(parseInt(savedBanCount));
    if (savedFixedSongs) setFixedSongs(JSON.parse(savedFixedSongs));
    if (savedLockedTracks) setLockedTracks(JSON.parse(savedLockedTracks));
    if (savedHiddenTracks) setHiddenTracks(JSON.parse(savedHiddenTracks));
  }, []);

  // Load settings from API (for OBS mode)
  const loadSettingsFromAPI = useCallback(async () => {
    try {
      const res = await fetch('/api/sync-state', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Only update if timestamp changed
        if (data.timestamp && data.timestamp !== lastAPITimestamp.current) {
          lastAPITimestamp.current = data.timestamp;
          
          if (data.gameState) {
            const gs = data.gameState;
            
            if (gs.selectedPool && POOL_FILES[gs.selectedPool]) {
              setSelectedPool(prev => {
                if (prev !== gs.selectedPool) {
                  setPoolVersion(v => v + 1);
                  return gs.selectedPool;
                }
                return prev;
              });
            }
            if (gs.randomCount !== undefined) setRandomCount(gs.randomCount);
            if (gs.pickCount !== undefined) setPickCount(gs.pickCount);
            if (gs.banCount !== undefined) setBanCount(gs.banCount);
            if (gs.fixedSongs !== undefined) setFixedSongs(gs.fixedSongs || []);
            if (gs.lockedTracks !== undefined) setLockedTracks(gs.lockedTracks || {});
            if (gs.hiddenTracks !== undefined) setHiddenTracks(gs.hiddenTracks || { track3Hidden: false, track4Hidden: false });
            if (gs.randomResults !== undefined) setRandomResults(gs.randomResults || []);
            if (gs.bannedSongs !== undefined) setBannedSongs(gs.bannedSongs || []);
            if (gs.pickedSongs !== undefined) setPickedSongs(gs.pickedSongs || []);
            if (gs.showBanPick !== undefined) setShowBanPick(gs.showBanPick);
            if (gs.showFinalResults !== undefined) setShowFinalResults(gs.showFinalResults);
            
            console.log('[Main] API sync - randomResults:', gs.randomResults?.length, 'showBanPick:', gs.showBanPick);
          }
        }
      }
    } catch (error) {
      console.log('[Main] API not available, using localStorage');
    }
  }, []);

  // Detect if running in OBS mode via URL query param ?obs=1
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const obsParam = urlParams.get('obs');
    
    if (obsParam === '1' || obsParam === 'true') {
      // OBS mode - only read from API, don't use localStorage
      setIsOBSMode(true);
      console.log('[Main] OBS mode enabled via URL param');
    } else {
      // Normal mode - use localStorage
      setIsOBSMode(false);
      loadSettingsFromStorage();
    }
    
    // Always poll API for updates (works for both modes)
    const pollInterval = setInterval(loadSettingsFromAPI, 500);
    
    return () => clearInterval(pollInterval);
  }, [loadSettingsFromStorage, loadSettingsFromAPI]);

  // Listen for storage events from /controller page
  useEffect(() => {
    if (isOBSMode) return; // Skip if OBS mode
    
    const handleStorageChange = (e: StorageEvent) => {
      // Reload all settings when controller page updates
      if (e.key === 'controllerSettings' || e.key === 'selectedPool' ||
        e.key === 'randomCount' || e.key === 'pickCount' || e.key === 'banCount' ||
        e.key === 'fixedSongs' || e.key === 'lockedTracks' || e.key === 'hiddenTracks') {
        loadSettingsFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadSettingsFromStorage, isOBSMode]);

  // Load pool data when selected pool changes
  useEffect(() => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadPool = async () => {
      setIsLoadingPool(true);
      const poolFile = POOL_FILES[selectedPool];

      if (!poolFile) {
        console.error('Unknown pool:', selectedPool);
        setSelectedPool('newbieSemi');
        return;
      }

      try {
        // Add cache busting timestamp
        const res = await fetch(`${poolFile}?t=${Date.now()}`, {
          signal: abortController.signal,
          cache: 'no-store'
        });

        if (!res.ok) {
          throw new Error(`Failed to load ${poolFile}`);
        }

        const data = await res.json();

        // Only update if not aborted
        if (!abortController.signal.aborted) {
          setSongData(ensureIds(data));
          setPoolVersion(prev => prev + 1); // Increment version to force re-render
          console.log(`Pool loaded: ${selectedPool}, songs: ${data.length}`);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Pool load aborted:', selectedPool);
          return;
        }

        console.error('Error loading pool:', error);
        if (selectedPool === 'top32') {
          alert('top32.json not found. Please export songs from /song-selector first.');
        }
        // Fallback to newbieSemi
        if (selectedPool !== 'newbieSemi') {
          setSelectedPool('newbieSemi');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingPool(false);
        }
      }
    };

    loadPool();

    // Cleanup
    return () => {
      abortController.abort();
    };
  }, [selectedPool]);

  // Fixed songs selected by user
  const [fixedSongs, setFixedSongs] = useState<Song[]>([]);

  // Random, pick and ban count (default is stated in the use state)
  const [randomCount, setRandomCount] = useState(4);
  const [pickCount, setPickCount] = useState(2);
  const [banCount, setBanCount] = useState(0);

  // Locked tracks (predetermined tracks 3 & 4)
  const [lockedTracks, setLockedTracks] = useState<{ track3?: Song; track4?: Song }>({});

  // Hidden tracks settings (which locked tracks are hidden/secret)
  const [hiddenTracks, setHiddenTracks] = useState<{ track3Hidden: boolean; track4Hidden: boolean }>({
    track3Hidden: false,
    track4Hidden: false
  });

  // Random results (4-6 songs)
  const [randomResults, setRandomResults] = useState<Song[]>([]);

  // Ban/Pick phase states
  const [showBanPick, setShowBanPick] = useState(false);
  const [bannedSongs, setBannedSongs] = useState<Song[]>([]);
  const [pickedSongs, setPickedSongs] = useState<Song[]>([]);
  const [showFinalResults, setShowFinalResults] = useState(false);

  // Sync game state to API whenever important state changes
  useEffect(() => {
    // Don't sync if in OBS mode (OBS only reads, doesn't write)
    if (isOBSMode) return;
    
    const gameState = {
      selectedPool,
      randomCount,
      pickCount,
      banCount,
      fixedSongs,
      lockedTracks,
      hiddenTracks,
      randomResults,
      bannedSongs,
      pickedSongs,
      showBanPick,
      showFinalResults
    };
    
    syncToAPI(gameState);
  }, [selectedPool, randomCount, pickCount, banCount, fixedSongs, lockedTracks, 
      hiddenTracks, randomResults, bannedSongs, pickedSongs, showBanPick, showFinalResults, isOBSMode]);

  // Listen for R key to reset and Enter key for final results navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
      // Enter key to navigate to match display from final results screen
      if (e.key === 'Enter' && showFinalResults) {
        router.push('/match-display');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFinalResults, router]);

  const handleRandomComplete = useCallback((results: Song[]) => {
    console.log('[Main] handleRandomComplete called with', results.length, 'songs');
    setRandomResults(results);
    // Auto transition to ban/pick after showing result
    setTimeout(() => {
      setShowBanPick(true);
    }, 800);
  }, []);

  // const handleBanPick = useCallback((song: Song) => {
  //   const remainingBans = banPickSetting.ban - bannedSongs.length;

  //   if (remainingBans > 0) {
  //     // Ban phase
  //     setBannedSongs(prev => [...prev, song]);
  //   } else if (pickedSongs.length < banPickSetting.pick) {
  //     // Pick phase
  //     setPickedSongs(prev => [...prev, song]);

  //     // When all picks are done, go to match display
  //     if (pickedSongs.length + 1 >= banPickSetting.pick) {
  //       setTimeout(() => {
  //         // Save picked songs to localStorage for match-display page
  //         const finalPicked = [...pickedSongs, song];
  //         localStorage.setItem('matchSongs', JSON.stringify(finalPicked));
  //         localStorage.setItem('lockedTracks', JSON.stringify(lockedTracks));
  //         router.push('/match-display');
  //       }, 500);
  //     }
  //   }
  // }, [bannedSongs.length, pickedSongs.length, banPickSetting, router, pickedSongs]);

  const handleBan = useCallback((song: Song) => {
    setBannedSongs(prev => [...prev, song]);
    // Log ban action
    const currentLog = JSON.parse(localStorage.getItem('banPickLog') || '[]');
    localStorage.setItem('banPickLog', JSON.stringify([...currentLog, { type: 'ban', song }]));
  }, []);

  const handlePick = useCallback((song: Song) => {
    setPickedSongs(prev => [...prev, song]);
    // Log pick action
    const currentLog = JSON.parse(localStorage.getItem('banPickLog') || '[]');
    localStorage.setItem('banPickLog', JSON.stringify([...currentLog, { type: 'pick', song }]));

    // When all picks are done, show final results first
    if (pickedSongs.length + 1 >= pickCount) {
      const finalPicked = [...pickedSongs, song];
      localStorage.setItem('matchSongs', JSON.stringify(finalPicked));
      localStorage.setItem('lockedTracks', JSON.stringify(lockedTracks));

      // Show final results screen
      setTimeout(() => {
        setShowFinalResults(true);
      }, 500);
    }
  }, [pickedSongs, pickCount, lockedTracks]);

  const handleReset = () => {
    setFixedSongs([]);
    setRandomResults([]);
    setShowBanPick(false);
    setShowFinalResults(false);
    setBannedSongs([]);
    setPickedSongs([]);
    setRandomCount(4);
    setPickCount(2);
    setBanCount(0);
    setLockedTracks({});
    // Clear ban/pick log on reset
    localStorage.removeItem('banPickLog');
    setHiddenTracks({ track3Hidden: false, track4Hidden: false });
  };

  const handlePoolChange = (poolId: string) => {
    if (poolId === selectedPool) {
      // Force reload same pool
      setPoolVersion(prev => prev + 1);
    }
    setSelectedPool(poolId);
    // Reset all selections when pool changes
    setFixedSongs([]);
    setLockedTracks({});
    setRandomResults([]);
    setShowBanPick(false);
    setBannedSongs([]);
    setPickedSongs([]);
  };

  // Filter out locked tracks AND fixed songs from available pool for random
  const availablePool = songData.filter(
    (song) =>
      song.id !== lockedTracks.track3?.id &&
      song.id !== lockedTracks.track4?.id &&
      !fixedSongs.find(f => f.id === song.id)
  );

  // Combined pool for ban/pick = random results + fixed songs (excluding locked)
  const banPickPool = [...randomResults, ...fixedSongs];
  
  // Debug log
  console.log('[Main] banPickPool:', banPickPool.length, 'randomResults:', randomResults.length, 'fixedSongs:', fixedSongs.length);

  return (
    <main className="min-h-screen relative">
      <iframe
        src="/assets/prism+.html"
        className="fixed inset-0 w-full h-full border-0"
        style={{
          zIndex: -1,
          pointerEvents: 'none'
        }}
        title="background"
      />

      {showFinalResults ? (
        /* Final Results Phase - Show picked songs + locked tracks */
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h2 className="text-4xl font-bold text-white mb-8 text-center drop-shadow-lg tracking-wide"
            style={{ textShadow: '0 0 20px rgba(168, 85, 247, 0.5), 0 4px 8px rgba(0,0,0,0.3)' }}>
            BAN PICK RESULT
          </h2>
          <BanPickCarousel
            songs={[
              ...pickedSongs,
              ...(lockedTracks.track3 ? [lockedTracks.track3] : []),
              ...(lockedTracks.track4 ? [lockedTracks.track4] : [])
            ]}
            onBan={() => { }}
            onPick={() => { }}
            bannedSongs={[]}
            pickedSongs={[
              ...pickedSongs,
              ...(lockedTracks.track3 ? [lockedTracks.track3] : []),
              ...(lockedTracks.track4 ? [lockedTracks.track4] : [])
            ]}
            remainingBans={0}
            remainingPicks={0}
            showFinalOnly={true}
            lockedTracks={lockedTracks}
            hiddenTracks={hiddenTracks}
          />
        </div>
      ) : !showBanPick ? (
        /* Random Phase - Locked tracks NOT shown here */
        <QuadRandomSlot
          key={`${selectedPool}-${poolVersion}-${fixedSongs.length}-${randomCount}`}
          pool={availablePool}
          fixedSongs={fixedSongs}
          randomCount={randomCount}
          onRandomComplete={handleRandomComplete}
          externalResults={isOBSMode ? randomResults : undefined}
        />
      ) : (
        /* Ban/Pick Phase */
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <BanPickCarousel
            songs={banPickPool}
            onBan={handleBan}
            onPick={handlePick}
            bannedSongs={bannedSongs}
            pickedSongs={pickedSongs}
            remainingBans={banCount - bannedSongs.length}
            remainingPicks={pickCount - pickedSongs.length}
            onComplete={() => {
              // Complete callback if needed
            }}
          />
        </div>
      )}
    </main>
  );
}
