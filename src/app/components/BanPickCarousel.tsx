'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Song } from '../interface';

interface BanPickCarouselProps {
  songs: Song[];
  onBan: (song: Song) => void;
  onPick: (song: Song) => void;
  bannedSongs: Song[];
  pickedSongs: Song[];
  remainingBans: number;
  remainingPicks: number;
  onComplete?: () => void;
  showFinalOnly?: boolean;
}

const BanPickCarousel: React.FC<BanPickCarouselProps> = ({
  songs,
  onBan,
  onPick,
  bannedSongs,
  pickedSongs,
  remainingBans,
  remainingPicks,
  onComplete,
  showFinalOnly = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EXPERT':
        return '#ef4444';
      case 'MASTER':
        return '#9333ea';
      case 'RE:MASTER':
        return '#ec4899';
      default:
        return '#a855f7';
    }
  };

  const isBanned = (song: Song) => bannedSongs.some(s => s.id === song.id);
  const isPicked = (song: Song) => pickedSongs.some(s => s.id === song.id);
  const isProcessed = (song: Song) => isBanned(song) || isPicked(song);
  const isCompleted = remainingBans === 0 && remainingPicks === 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex(prev => Math.min(songs.length - 1, prev + 1));
      } else if (e.key === 'Enter') {
        if (isCompleted && onComplete) {
          onComplete();
        } else {
          const selectedSong = songs[selectedIndex];
          if (!isProcessed(selectedSong)) {
            if (remainingBans > 0) {
              onBan(selectedSong);
            } else if (remainingPicks > 0) {
              onPick(selectedSong);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, songs, onBan, onPick, remainingBans, remainingPicks, isCompleted, onComplete]);

  return (
    <div className="ban-pick-container py-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">Ban/Pick Phase</h2>
        {!showFinalOnly && (
          <>
            <p className="text-lg text-gray-600">
              {remainingBans > 0 ? (
                <span className="text-red-500 font-bold">Ban {remainingBans} songs</span>
              ) : remainingPicks > 0 ? (
                <span className="text-green-500 font-bold">Pick {remainingPicks} songs</span>
              ) : (
                <span className="text-blue-500 font-bold">Press Enter to confirm final selection</span>
              )}
            </p>
            <p className="text-sm text-gray-500 mt-2">Use ← → arrow keys to navigate, Enter to select</p>
          </>
        )}
        {showFinalOnly && (
          <p className="text-lg text-green-600 font-bold">Final Selected Songs</p>
        )}
      </div>

      <div className="flex justify-center items-end gap-8 px-8">
        {songs.map((song, index) => {
          const isSelected = index === selectedIndex;
          const banned = isBanned(song);
          const picked = isPicked(song);
          const processed = isProcessed(song);
          const notChosen = !processed && isCompleted;
          const shouldHide = showFinalOnly && (banned || notChosen);

          if (shouldHide) return null;

          return (
            <div
              key={song.id}
              className="relative transition-all duration-500 ease-out"
              style={{
                transform: `
                  scale(${picked ? 1.2 : banned || notChosen ? 0.8 : 1})
                  translateY(${picked ? '-20px' : banned || notChosen ? '10px' : '0px'})
                `,
                opacity: banned || notChosen ? 0.5 : 1,
                filter: banned || notChosen ? 'grayscale(100%)' : 'none'
              }}
            >
              <div
                className="relative"
                style={{
                  border: isSelected && !processed && !showFinalOnly ? `5px solid ${getDifficultyColor(song.diff)}` : '3px solid transparent',
                  borderRadius: '8px',
                  boxShadow: isSelected && !processed && !showFinalOnly ? `0 0 30px ${getDifficultyColor(song.diff)}` : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <Image
                  src={song.imgUrl}
                  alt={song.title}
                  width={200}
                  height={200}
                  className="rounded-lg"
                />

                {banned && !showFinalOnly && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="text-red-500 text-8xl font-bold">✕</div>
                  </div>
                )}

                {picked && (
                  <div className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold shadow-lg">
                    ✓
                  </div>
                )}
              </div>

              <div className="text-center mt-3">
                <p className="font-bold text-sm truncate max-w-[200px]">{song.title}</p>
                <p className="text-xs text-gray-600 truncate max-w-[200px]">{song.artist}</p>
                <p
                  className="text-xs font-bold mt-1"
                  style={{ color: getDifficultyColor(song.diff) }}
                >
                  {song.diff} {song.lv}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BanPickCarousel;
