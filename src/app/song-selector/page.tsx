'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Song, RoundSetting } from '../interface';
import DisplayAll from './DisplayAllSongs';

// Helper to ensure songs have id field
const ensureIds = (songs: any[]): Song[] => {
  return songs.map((song, index) => ({
    ...song,
    id: song.id || `${song.title}-${song.diff}-${index}`,
    isDx: String(song.isDx)
  }));
};

// Pool file mapping - same as main page
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

const POOL_OPTIONS = [
  { id: 'newbieQual1', name: 'Bảng dưới - Vòng loại 1' },
  { id: 'newbieQual2', name: 'Bảng dưới - Vòng loại 2' },
  { id: 'newbieSemi', name: 'Bảng dưới - Bán kết' },
  { id: 'newbieFinals', name: 'Bảng dưới - Chung kết' },
  { id: 'proQual', name: 'Bảng trên - Vòng 32 và 16' },
  { id: 'proTop8', name: 'Bảng trên - Vòng 8' },
  { id: 'proSemi', name: 'Bảng trên - Bán kết' },
  { id: 'proFinals', name: 'Bảng trên - Chung kết' },
  { id: 'top32', name: 'Top 32 (Custom)' },
];

export default function SongSelector() {
  const router = useRouter();

  // Selected pool - sync with localStorage
  const [selectedPool, setSelectedPool] = useState('newbieSemi');
  const [songData, setSongData] = useState<Song[]>([]);
  const [isLoadingPool, setIsLoadingPool] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load selected pool from localStorage on mount
  useEffect(() => {
    const savedPool = localStorage.getItem('selectedPool');
    if (savedPool && POOL_FILES[savedPool]) {
      setSelectedPool(savedPool);
    }
  }, []);

  // Save selected pool to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selectedPool', selectedPool);
  }, [selectedPool]);

  // Load pool data when selected pool changes
  useEffect(() => {
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
        const res = await fetch(`${poolFile}?t=${Date.now()}`, {
          signal: abortController.signal,
          cache: 'no-store'
        });

        if (!res.ok) {
          throw new Error(`Failed to load ${poolFile}`);
        }

        const data = await res.json();

        if (!abortController.signal.aborted) {
          setSongData(ensureIds(data));
          console.log(`Pool loaded: ${selectedPool}, songs: ${data.length}`);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Error loading pool:', error);
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

    return () => {
      abortController.abort();
    };
  }, [selectedPool]);

  const handlePoolChange = (poolId: string) => {
    setSelectedPool(poolId);
  };

  const handleAddSong = (song: Song) => {
    // Add the song to current pool data
    setSongData(prev => [...prev, song]);
  };

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

      {isLoadingPool ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Loading pool...</div>
        </div>
      ) : (
        <DisplayAll
          pool={songData}
          selectCount={12}
          selectedPoolId={selectedPool}
          poolFile={POOL_FILES[selectedPool]}
          onPoolChange={handlePoolChange}
          poolOptions={POOL_OPTIONS}
          onAddSong={handleAddSong}
        />
      )}
    </main>
  );
}
