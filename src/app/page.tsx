'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import banPickSettings from '../../public/roundBanPickSettings.json';
import { Song, RoundSetting } from './interface';

import QuadRandomSlot from './components/QuadRandomSlot';
import BanPickCarousel from './components/BanPickCarousel';
import UnifiedSettingsPanel from './components/UnifiedSettingsPanel';

import songData from '../../public/pools/newbieSemi.json';

export default function Home() {
  const router = useRouter();
  const [roundIndex, setRoundIndex] = useState(0);
  const [banPickSetting] = useState<RoundSetting>(banPickSettings[roundIndex]);

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

  // Filter out locked tracks from available pool
  const availablePool = songData.filter(
    (song) => song.id !== lockedTracks.track3?.id && song.id !== lockedTracks.track4?.id
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
          onRandomCountChange={setRandomCount}
          onFixedSongsChange={setFixedSongs}
          onLockedTracksChange={setLockedTracks}
          maxTotal={6}
          minTotal={4}
        />
      )}

      {!showBanPick ? (
        /* Random Phase */
        <QuadRandomSlot
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
