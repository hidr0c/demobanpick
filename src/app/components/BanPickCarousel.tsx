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
    const isBanPhase = remainingBans > 0;
    const isPickPhase = remainingBans === 0 && remainingPicks > 0;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                setSelectedIndex(prev => {
                    let newIndex = prev - 1;
                    // Skip banned songs
                    while (newIndex >= 0 && isBanned(songs[newIndex])) {
                        newIndex--;
                    }
                    return Math.max(0, newIndex);
                });
            } else if (e.key === 'ArrowRight') {
                setSelectedIndex(prev => {
                    let newIndex = prev + 1;
                    // Skip banned songs
                    while (newIndex < songs.length && isBanned(songs[newIndex])) {
                        newIndex++;
                    }
                    return Math.min(songs.length - 1, newIndex);
                });
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
    }, [selectedIndex, songs, onBan, onPick, remainingBans, remainingPicks, isCompleted, onComplete, bannedSongs]);

    // When showing final only, display songs in pick order
    const displaySongs = showFinalOnly ? pickedSongs : songs;

    return (
        <div className="ban-pick-container py-8">
            <div className="flex justify-center items-center gap-12 px-4" style={{ minHeight: '350px', paddingBottom: '40px', width: '100%', maxWidth: '100vw' }}>
                {displaySongs.map((song, index) => {
                    const originalIndex = songs.findIndex(s => s.id === song.id);
                    const isSelected = !showFinalOnly && originalIndex === selectedIndex;
                    const banned = isBanned(song);
                    const picked = isPicked(song);
                    const processed = isProcessed(song);
                    const notChosen = !processed && isCompleted;
                    const shouldHide = showFinalOnly && (banned || notChosen);

                    if (shouldHide) return null;

                    return (
                        <div
                            key={song.id}
                            className="relative"
                            style={{
                                flexShrink: 0,
                                transform: `
                  scale(${showFinalOnly ? 1.1 : (picked && isPickPhase) ? 1.08 : banned || notChosen ? 0.8 : 1})
                  translateY(${showFinalOnly ? '-10px' : (picked && isPickPhase) ? '-15px' : banned || notChosen ? '10px' : '0px'})
                `,
                                opacity: banned ? 1 : notChosen ? 0.5 : 1,
                                filter: banned || notChosen ? 'grayscale(100%)' : 'none',
                                transition: showFinalOnly
                                    ? 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                    : 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}
                        >
                            {showFinalOnly && picked && (
                                <div
                                    className="absolute -top-8 left-1/2 z-10"
                                    style={{
                                        transform: 'translateX(-50%)',
                                        animation: 'fadeInDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                                    }}
                                >
                                    <span className="text-black font-bold text-xl">
                                        Track #{index + 1}
                                    </span>
                                </div>
                            )}
                            <div
                                className="relative"
                                style={{
                                    border: showFinalOnly && picked
                                        ? `4px solid ${getDifficultyColor(song.diff)}`
                                        : isSelected && !processed && !showFinalOnly
                                            ? `5px solid ${getDifficultyColor(song.diff)}`
                                            : '2px solid transparent',

                                    borderRadius: '12px',
                                    boxShadow: 'none',
                                    transition: 'all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                    overflow: 'hidden',
                                    animation: showFinalOnly && picked ? 'jacketReveal 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none'
                                }}
                            >
                                <Image
                                    src={song.imgUrl}
                                    alt={song.title}
                                    width={200}
                                    height={200}
                                    className="rounded-lg"
                                    style={{ display: 'block' }}
                                />

                                {banned && !showFinalOnly && (
                                    <div
                                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
                                        style={{
                                            animation: 'fadeIn 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
                                        }}
                                    >
                                        <div
                                            className="text-red-500 text-8xl font-bold"
                                            style={{
                                                animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                            }}
                                        >✕</div>
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
