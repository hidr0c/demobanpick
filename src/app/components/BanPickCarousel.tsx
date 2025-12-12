'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
    lockedTracks?: { track3?: Song; track4?: Song };
    hiddenTracks?: { track3Hidden: boolean; track4Hidden: boolean };
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
    showFinalOnly = false,
    lockedTracks = {},
    hiddenTracks = { track3Hidden: false, track4Hidden: false }
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const preloadedImagesRef = useRef<Set<string>>(new Set());

    // Check if a song is a hidden locked track
    const isHiddenLockedTrack = (song: Song): boolean => {
        if (lockedTracks.track3 && song.id === lockedTracks.track3.id && hiddenTracks.track3Hidden) {
            return true;
        }
        if (lockedTracks.track4 && song.id === lockedTracks.track4.id && hiddenTracks.track4Hidden) {
            return true;
        }
        return false;
    };

    // Preload images when songs change
    useEffect(() => {
        songs.forEach(song => {
            if (!preloadedImagesRef.current.has(song.imgUrl)) {
                const img = new window.Image();
                img.src = song.imgUrl;
                preloadedImagesRef.current.add(song.imgUrl);
            }
        });
    }, [songs]);

    const getDiffColor = (difficulty: string) => {
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

    const getFrameImage = (diff: string, isDx: string) => {
        const type = isDx === 'True' ? 'dx' : 'std';
        let diffName = diff.toLowerCase();

        // Handle Re:MASTER -> re
        if (diffName.includes('re:master') || diffName === 're:master') {
            diffName = 're';
        } else if (diffName.includes('master')) {
            diffName = 'master';
        } else if (diffName.includes('expert')) {
            diffName = 'expert';
        }

        return `/assets/${diffName}-${type}.png`;
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
                    while (newIndex >= 0 && (isBanned(songs[newIndex]) || isPicked(songs[newIndex]))) {
                        newIndex--;
                    }
                    return Math.max(0, newIndex);
                });
            } else if (e.key === 'ArrowRight') {
                setSelectedIndex(prev => {
                    let newIndex = prev + 1;
                    // Skip banned songs
                    while (newIndex < songs.length && (isBanned(songs[newIndex]) || isPicked(songs[newIndex]))) {
                        newIndex++;
                    }
                    return Math.min(songs.length - 1, newIndex);
                });
            } else if (e.key === 'ArrowUp') {
                setSelectedIndex(prev => {
                    let newIndex = prev - gridColumns;
                    // Skip banned songs
                    while (newIndex >= 0 && (isBanned(songs[newIndex]) || isPicked(songs[newIndex]))) {
                        newIndex--;
                    }
                    return Math.max(0, newIndex);
                });
            } else if (e.key === 'ArrowDown') {
                setSelectedIndex(prev => {
                    let newIndex = prev + gridColumns;
                    // Skip banned songs
                    while (newIndex < songs.length && (isBanned(songs[newIndex]) || isPicked(songs[newIndex]))) {
                        newIndex++;
                    }
                    return Math.min(songs.length - 1, newIndex);
                });
            }
            else if (e.key === 'Enter') {
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

    // For sizing purposes
    const FRAME_OVERLAY_W = 300;
    const FRAME_OVERLAY_H = 390;
    const FRAME_W = FRAME_OVERLAY_W * 0.61;
    const FRAME_H = FRAME_OVERLAY_H * 0.5;
    const TITLE_FONT_SIZE = 20;

    // Determine grid columns based on song count
    const getGridColumns = () => {
        const count = displaySongs.length;
        if (count === 5) return 3;
        if (count === 4) return 4;
        if (count <= 3) return count;
        if (count % 3 === 0) return 3; // 6, 9, 12...
        if (count % 2 === 0) return count / 2; // Even numbers
        return 4; // Default
    };

    const gridColumns = getGridColumns();

    return (
        <div className="ban-pick-container py-8">
            <div
                className="flex flex-row gap-8 justify-center items-center flex-wrap"
                style={{
                    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                    gridTemplateRows: 'repeat(auto-fill, 1fr)',
                    maxWidth: gridColumns >= 4 ? '1400px' : '1100px',
                    margin: '0 auto'
                }}
            >
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
                            key={`${song.id}-${song.title}-${song.diff}-${index}`}
                            className="relative transition-all duration-300 ease-out"
                            style={{
                                width: FRAME_OVERLAY_W,
                                height: FRAME_OVERLAY_H,
                                flexShrink: 0,
                                transform: showFinalOnly
                                    ? 'scale(1)'
                                    : picked
                                        ? 'scale(1.05) translateY(-10px)'
                                        : banned || notChosen
                                            ? 'scale(0.9) translateY(10px)'
                                            : 'scale(1)',
                                opacity: 1,
                                zIndex: picked ? 10 : banned || notChosen ? 1 : 5,
                                marginTop: showFinalOnly ? '40px' : '0' // Space for track label
                            }}
                        >

                            {/* Jacket image - use random.png if hidden locked track in final view */}
                            <img
                                src={showFinalOnly && isHiddenLockedTrack(song) ? '/assets/random.png' : song.imgUrl}
                                alt={song.title}
                                loading="eager"
                                decoding="async"
                                className="absolute"
                                style={{
                                    width: showFinalOnly && isHiddenLockedTrack(song) ? FRAME_W * 1.1 : FRAME_W,
                                    height: showFinalOnly && isHiddenLockedTrack(song) ? FRAME_H * 1.1 : FRAME_H,
                                    objectFit: 'cover',
                                    left: '50%',
                                    top: '50%',
                                    transform: `translate(-50%, -50%) translateY(-${FRAME_OVERLAY_H / 13}px)`,
                                    zIndex: 1,
                                    filter: (banned || notChosen) ? 'grayscale(100%)' : 'none',
                                    contentVisibility: 'auto'
                                }}
                            />

                            {/* Frame overlay */}
                            <img
                                src={getFrameImage(song.diff, song.isDx)}
                                alt="frame"
                                className="absolute"
                                style={{
                                    width: FRAME_OVERLAY_W,
                                    height: FRAME_OVERLAY_H,
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    pointerEvents: 'none',
                                    zIndex: 3,
                                    filter: (banned || notChosen) ? 'grayscale(100%) brightness(0.7)' : 'none'
                                }}
                            />

                            {/* Diff + Lv - centered with gap */}
                            <div
                                className="absolute"
                                style={{
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    bottom: FRAME_OVERLAY_H * 0.235,
                                    zIndex: 4,
                                    pointerEvents: 'none',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color: (banned || notChosen) ? '#d1d5db' : '#f1f1f1',
                                        textShadow: (banned || notChosen)
                                            ? '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)'
                                            : `
                                        -2px -2px 0 ${getDiffColor(song.diff)}, 
                                        2px -2px 0 ${getDiffColor(song.diff)},
                                        -2px 2px 0 ${getDiffColor(song.diff)},
                                        2px 2px 0 ${getDiffColor(song.diff)},
                                        -3px 0px 0 ${getDiffColor(song.diff)},
                                        3px 0px 0 ${getDiffColor(song.diff)},
                                        0px -3px 0 ${getDiffColor(song.diff)},
                                        0px 3px 0 ${getDiffColor(song.diff)}
                                        `,
                                        letterSpacing: '1px'
                                    }}
                                >
                                    {song.diff}
                                </div>
                                <div
                                    style={{
                                        fontSize: (showFinalOnly && isHiddenLockedTrack(song)) ? 22 : 20,
                                        fontWeight: 800,
                                        color: (banned || notChosen) ? '#9ca3af' : '#f1f1f1',
                                        textShadow: (banned || notChosen)
                                            ? '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)'
                                            : (showFinalOnly && isHiddenLockedTrack(song))
                                                ? `-2px -2px 0 ${getDiffColor(song.diff)}, 2px -2px 0 ${getDiffColor(song.diff)}, -2px 2px 0 ${getDiffColor(song.diff)}, 2px 2px 0 ${getDiffColor(song.diff)}, -3px 0px 0 ${getDiffColor(song.diff)}, 3px 0px 0 ${getDiffColor(song.diff)}, 0px -3px 0 ${getDiffColor(song.diff)}, 0px 3px 0 ${getDiffColor(song.diff)}`
                                                : `
                                        -2px -2px 0 ${getDiffColor(song.diff)}, 
                                        2px -2px 0 ${getDiffColor(song.diff)},
                                        -2px 2px 0 ${getDiffColor(song.diff)},
                                        2px 2px 0 ${getDiffColor(song.diff)},
                                        -3px 0px 0 ${getDiffColor(song.diff)},
                                        3px 0px 0 ${getDiffColor(song.diff)},
                                        0px -3px 0 ${getDiffColor(song.diff)},
                                        0px 3px 0 ${getDiffColor(song.diff)}
                                        `,
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    {showFinalOnly && isHiddenLockedTrack(song) ? '???' : song.lv}
                                </div>
                            </div>

                            {/* Title */}
                            <div
                                className="absolute"
                                style={{
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    bottom: FRAME_OVERLAY_H * 0.14,
                                    width: FRAME_OVERLAY_W * 0.72,
                                    textAlign: 'center',
                                    zIndex: 4,
                                    pointerEvents: 'none',
                                    overflow: 'hidden',
                                    clipPath: 'inset(0)',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: `${TITLE_FONT_SIZE}`,
                                        color: '#000',
                                        whiteSpace: 'nowrap',
                                        animation: (!showFinalOnly || !isHiddenLockedTrack(song)) && song.title.length > 20 ? 'marquee 15s linear infinite' : 'none',
                                        display: 'inline-block'
                                    }}

                                >
                                    {showFinalOnly && isHiddenLockedTrack(song) ? '???' : song.title}
                                </div>
                            </div>

                            {/* Artist */}
                            <div
                                className="absolute"
                                style={{
                                    left: '51%',
                                    transform: 'translateX(-50%)',
                                    bottom: FRAME_OVERLAY_H * 0.05,
                                    width: FRAME_OVERLAY_W * 0.73,
                                    textAlign: 'center',
                                    zIndex: 4,
                                    pointerEvents: 'none',
                                    overflow: 'hidden',
                                    clipPath: 'inset(0)',
                                    height: `${TITLE_FONT_SIZE}px`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: '#000',
                                        whiteSpace: 'nowrap',
                                        animation: (!showFinalOnly || !isHiddenLockedTrack(song)) && song.artist.length > 20 ? 'marquee 18s linear infinite' : 'none',
                                        display: 'inline-block'
                                    }}
                                >
                                    {showFinalOnly && isHiddenLockedTrack(song) ? '???' : song.artist}
                                </div>
                            </div>

                            {/* Selection Overlay with Glow */}
                            {isSelected && !processed && !showFinalOnly && !banned && !notChosen && (
                                <div
                                    className="absolute inset-0 rounded-lg pointer-events-none z-50"
                                    style={{
                                        boxShadow: `0 0 0 4px ${getDiffColor(song.diff)}, 0 0 20px ${getDiffColor(song.diff)}80, 0 0 40px ${getDiffColor(song.diff)}40`,
                                        animation: 'pulse 1.5s ease-in-out infinite'
                                    }}
                                />
                            )}

                            {/* Track number label for final results */}
                            {showFinalOnly && (
                                <div
                                    className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-50"
                                    style={{
                                        fontSize: '24px',
                                        fontWeight: 800,
                                        color: '#fff',
                                        textShadow: `0 0 10px ${getDiffColor(song.diff)}, 0 2px 4px rgba(0,0,0,0.5)`,
                                        letterSpacing: '2px'
                                    }}
                                >
                                    TRACK {index + 1}
                                </div>
                            )}

                            {/* Banned Overlay */}
                            {banned && !showFinalOnly && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center rounded-lg z-50"
                                >
                                    <div className="text-gray-400 text-8xl font-bold">
                                        ✕
                                    </div>
                                </div>
                            )}

                            {/* <div className="text-center mt-3">
                                <p className="font-bold text-sm truncate max-w-[200px]">{song.title}</p>
                                <p className="text-xs text-gray-600 truncate max-w-[200px]">{song.artist}</p>
                                <p
                                    className="text-xs font-bold mt-1"
                                    style={{ color: getDiffColor(song.diff) }}
                                >
                                    {song.diff} {song.lv}
                                </p>
                            </div> */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BanPickCarousel;
