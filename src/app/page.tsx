'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import banPickSettings from '../../public/roundBanPickSettings.json';
import { Song, RoundSetting } from './interface';

import QuadRandomSlot from './components/QuadRandomSlot';
import BanPickCarousel from './components/BanPickCarousel';
import UnifiedSettingsPanel from './components/UnifiedSettingsPanel';

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
  newbieSemi: '/pools/newbieSemi.json',
  qualTop: '/pools/qualTop.json',
  qualBottom: '/pools/qualBottom.json',
  semiFinals: '/pools/semiFinals.json',
  finals: '/pools/finals.json',
  top32: '/pools/top32.json',
};

export default function Home() {
  const router = useRouter();
  const [roundIndex, setRoundIndex] = useState(0);
  const [banPickSetting] = useState<RoundSetting>(banPickSettings[roundIndex]);

  // Selected pool (default: newbieSemi)
  const [selectedPool, setSelectedPool] = useState('newbieSemi');
  const [songData, setSongData] = useState<Song[]>([]);
  const [isLoadingPool, setIsLoadingPool] = useState(true);
  const [poolVersion, setPoolVersion] = useState(0); // Force re-render key
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Random count (default 4, can be adjusted)
  const [randomCount, setRandomCount] = useState(4);

  // Locked tracks (predetermined tracks 3 & 4)
  const [lockedTracks, setLockedTracks] = useState<{ track3?: Song; track4?: Song }>({});

  // Random results (4-6 songs)
  const [randomResults, setRandomResults] = useState<Song[]>([]);

  // Ban/Pick phase states
  const [showBanPick, setShowBanPick] = useState(false);
  const [bannedSongs, setBannedSongs] = useState<Song[]>([]);
  const [pickedSongs, setPickedSongs] = useState<Song[]>([]);

  // Listen for R key to reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRandomComplete = useCallback((results: Song[]) => {
    setRandomResults(results);
    // Auto transition to ban/pick after showing result
    setTimeout(() => {
      setShowBanPick(true);
    }, 800);
  }, []);

  const handleBanPick = useCallback((song: Song) => {
    const remainingBans = banPickSetting.ban - bannedSongs.length;

    if (remainingBans > 0) {
      // Ban phase
      setBannedSongs(prev => [...prev, song]);
    } else if (pickedSongs.length < banPickSetting.pick) {
      // Pick phase
      setPickedSongs(prev => [...prev, song]);

      // When all picks are done, go to match display
      if (pickedSongs.length + 1 >= banPickSetting.pick) {
        setTimeout(() => {
          // Save picked songs to localStorage for match-display page
          const finalPicked = [...pickedSongs, song];
          localStorage.setItem('matchSongs', JSON.stringify(finalPicked));
          localStorage.setItem('lockedTracks', JSON.stringify(lockedTracks));
          router.push('/match-display');
        }, 500);
      }
    }
  }, [bannedSongs.length, pickedSongs.length, banPickSetting, router, pickedSongs]);

  const handleBan = useCallback((song: Song) => {
    setBannedSongs(prev => [...prev, song]);
  }, []);

  const handlePick = useCallback((song: Song) => {
    setPickedSongs(prev => [...prev, song]);

    // When all picks are done, go to match display
    if (pickedSongs.length + 1 >= banPickSetting.pick) {
      setTimeout(() => {
        const finalPicked = [...pickedSongs, song];
        localStorage.setItem('matchSongs', JSON.stringify(finalPicked));
        localStorage.setItem('lockedTracks', JSON.stringify(lockedTracks));
        router.push('/match-display');
      }, 500);
    }
  }, [pickedSongs, banPickSetting, router]);

  const handleReset = () => {
    setFixedSongs([]);
    setRandomResults([]);
    setShowBanPick(false);
    setBannedSongs([]);
    setPickedSongs([]);
    setRandomCount(4);
    setLockedTracks({});
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

      {/* Unified Settings Panel (top left) */}
      {!showBanPick && (
        <UnifiedSettingsPanel
          pool={songData}
          randomCount={randomCount}
          fixedSongs={fixedSongs}
          lockedTracks={lockedTracks}
          selectedPool={selectedPool}
          onRandomCountChange={setRandomCount}
          onFixedSongsChange={setFixedSongs}
          onLockedTracksChange={setLockedTracks}
          onPoolChange={handlePoolChange}
          maxTotal={6}
          minTotal={4}
        />
      )}

      {!showBanPick ? (
        /* Random Phase */
        <QuadRandomSlot
          key={`${selectedPool}-${poolVersion}-${fixedSongs.length}`}
          pool={availablePool}
          fixedSongs={fixedSongs}
          randomCount={randomCount}
          onRandomComplete={handleRandomComplete}
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
            remainingBans={banPickSetting.ban - bannedSongs.length}
            remainingPicks={banPickSetting.pick - pickedSongs.length}
            onComplete={() => {
              // Complete callback if needed
            }}
          />
        </div>
      )}
    </main>
  );
}
