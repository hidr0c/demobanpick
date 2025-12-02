'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import banPickSettings from '../../public/roundBanPickSettings.json';
import { Song, RoundSetting } from './interface';

import QuadRandomSlot from './components/QuadRandomSlot';
import FixedSongSelector from './components/FixedSongSelector';
import BanPickCarousel from './components/BanPickCarousel';
import RandomCountSelector from './components/RandomCountSelector';

import songData from '../../public/pools/newbieSemi.json';

export default function Home() {
  const router = useRouter();
  const [roundIndex, setRoundIndex] = useState(0);
  const [banPickSetting] = useState<RoundSetting>(banPickSettings[roundIndex]);

  // Fixed songs selected by user
  const [fixedSongs, setFixedSongs] = useState<Song[]>([]);

  // Random count (default 4, can be adjusted)
  const [randomCount, setRandomCount] = useState(4);

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
    // Auto transition to ban/pick after 1 second
    setTimeout(() => {
      setShowBanPick(true);
    }, 1000);
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
          localStorage.setItem('matchSongs', JSON.stringify([...pickedSongs, song]));
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
        localStorage.setItem('matchSongs', JSON.stringify([...pickedSongs, song]));
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
  };

  // Combined pool for ban/pick = random results + fixed songs
  const banPickPool = [...randomResults, ...fixedSongs];

  return (
    <main className="min-h-screen relative">
      <video id="background-video" loop autoPlay muted>
        <source src={'/assets/backgroundVideo.mp4'} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Random Count Selector (top left) */}
      {!showBanPick && (
        <RandomCountSelector
          randomCount={randomCount}
          fixedCount={fixedSongs.length}
          onRandomCountChange={setRandomCount}
          maxTotal={6}
          minTotal={4}
        />
      )}

      {/* Fixed Song Selector (top right) */}
      {!showBanPick && (
        <FixedSongSelector
          pool={songData}
          selectedSongs={fixedSongs}
          onChange={setFixedSongs}
        />
      )}

      {!showBanPick ? (
        /* Random Phase */
        <QuadRandomSlot
          pool={songData}
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
