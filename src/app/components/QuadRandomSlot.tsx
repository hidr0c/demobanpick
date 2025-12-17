'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Song } from '../interface';

type QuadRandomSlotProps = {
    pool: Song[];
    poolId?: string; // Pool ID for API calls
    onRandomComplete?: (results: Song[]) => void;
    disabled?: boolean;
    fixedSongs?: Song[];
    randomCount?: number;
    externalResults?: Song[]; // For OBS mode - display results from API
    lockedTracks?: { track3?: Song; track4?: Song }; // For excluding from random
};

const QuadRandomSlot: React.FC<QuadRandomSlotProps> = ({
    pool,
    poolId = 'newbieSemi',
    onRandomComplete,
    disabled = false,
    fixedSongs = [],
    randomCount = 4,
    externalResults,
    lockedTracks = {}
}) => {
    const [slots, setSlots] = useState<Song[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationPool, setAnimationPool] = useState<Song[]>([]);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const animationStartTimeRef = useRef<number>(0);
    const hasCompletedRef = useRef<boolean>(false);
    const finalResultsRef = useRef<Song[]>([]);
    const preloadedImagesRef = useRef<Set<string>>(new Set());
    const currentPoolRef = useRef<string>('');

    // If external results provided (OBS mode), use them directly
    useEffect(() => {
        if (externalResults && externalResults.length > 0) {
            setSlots(externalResults);
            hasCompletedRef.current = true;
            finalResultsRef.current = externalResults;
        }
    }, [externalResults]);

    // Preload all images from pool on mount
    useEffect(() => {
        pool.forEach(song => {
            if (!preloadedImagesRef.current.has(song.imgUrl)) {
                const img = new Image();
                img.src = song.imgUrl;
                preloadedImagesRef.current.add(song.imgUrl);
            }
        });
    }, [pool]);

    // Reset when pool changes (detected by first song id change)
    useEffect(() => {
        const poolId = pool.length > 0 ? pool[0].id : '';
        if (currentPoolRef.current && currentPoolRef.current !== poolId) {
            // Pool changed - reset everything
            hasCompletedRef.current = false;
            finalResultsRef.current = [];
            setSlots([]);
        }
        currentPoolRef.current = poolId;
    }, [pool]);

    // Initialize with random songs (only once per pool, before any animation completes)
    useEffect(() => {
        if (pool.length >= randomCount && !hasCompletedRef.current && slots.length === 0) {
            const availablePool = pool.filter(
                song => !fixedSongs.find(f => f.id === song.id)
            );
            const initial = getRandomUniqueSongs(availablePool, randomCount);
            setSlots(initial);
        }
    }, [pool, randomCount, slots.length]);

    const getRandomUniqueSongs = (availablePool: Song[], count: number): Song[] => {
        const shuffled = [...availablePool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    };

    const getBorderColor = (diff: string) => {
        switch (diff) {
            case 'EXPERT':
                return '#ef4444';
            case 'MASTER':
                return '#9333ea';
            case 'RE:MASTER':
            case 'Re:MASTER':
                return '#ec4899';
            default:
                return '#a855f7';
        }
    };

    const getDiffColor = (diff: string) => {
        switch (diff) {
            case 'EXPERT':
                return '#fe6069';
            case 'MASTER':
                return '#a352de';
            case 'RE:MASTER':
            case 'Re:MASTER':
                return '#ca97ca';
            default:
                return '#a352de';
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

    const startRandomAnimation = async () => {
        if (isAnimating || disabled) return;

        setIsAnimating(true);
        animationStartTimeRef.current = Date.now();

        // Build exclude IDs list
        const excludeIds = [
            ...fixedSongs.map(s => s.id),
            ...(lockedTracks.track3 ? [lockedTracks.track3.id] : []),
            ...(lockedTracks.track4 ? [lockedTracks.track4.id] : [])
        ];

        try {
            // Call API to get random results and animation pool
            const response = await fetch('/api/random', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    poolId,
                    randomCount,
                    excludeIds,
                    animationPoolSize: 60
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get random results');
            }

            const data = await response.json();
            const { results, animationPool: fetchedAnimationPool } = data;

            // Store final results
            finalResultsRef.current = results;

            // Use fetched animation pool or fallback to local pool
            const poolForAnimation = fetchedAnimationPool && fetchedAnimationPool.length > 0
                ? fetchedAnimationPool
                : pool.filter(song => !fixedSongs.find(f => f.id === song.id));

            // Preload animation pool images
            poolForAnimation.forEach((song: Song) => {
                if (!preloadedImagesRef.current.has(song.imgUrl)) {
                    const img = new Image();
                    img.src = song.imgUrl;
                    preloadedImagesRef.current.add(song.imgUrl);
                }
            });

            // Run animation with fetched pool
            const animate = () => {
                const elapsed = Date.now() - animationStartTimeRef.current;
                const duration = 3000; // 3 seconds animation

                if (elapsed < duration) {
                    // Fast random cycling using animation pool
                    const tempSlots = getRandomUniqueSongs(poolForAnimation, randomCount);
                    setSlots(tempSlots);
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    // Show final results from server
                    hasCompletedRef.current = true;
                    setSlots(finalResultsRef.current);
                    setIsAnimating(false);

                    if (onRandomComplete) {
                        onRandomComplete(finalResultsRef.current);
                    }
                }
            };

            animate();
        } catch (error) {
            console.error('Random API error:', error);
            // Fallback to client-side random if API fails
            const availablePool = pool.filter(
                song => !fixedSongs.find(f => f.id === song.id)
            );

            const animate = () => {
                const elapsed = Date.now() - animationStartTimeRef.current;
                const duration = 3000;

                if (elapsed < duration) {
                    const tempSlots = getRandomUniqueSongs(availablePool, randomCount);
                    setSlots(tempSlots);
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    const finalResults = getRandomUniqueSongs(availablePool, randomCount);
                    finalResultsRef.current = finalResults;
                    hasCompletedRef.current = true;
                    setSlots(finalResults);
                    setIsAnimating(false);

                    if (onRandomComplete) {
                        onRandomComplete(finalResultsRef.current);
                    }
                }
            };

            animate();
        }
    };

    // Enter key handler
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !disabled && !isAnimating) {
                startRandomAnimation();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [disabled, isAnimating, randomCount]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Determine grid columns based on random count - improved logic
    const getGridColumns = () => {
        const count = randomCount;
        if (count <= 0) return 1;
        if (count === 1) return 1;
        if (count === 2) return 2;
        if (count === 3) return 3;
        if (count === 4) return 4;
        if (count === 5) return 3; // 3 columns (row 1: 3, row 2: 2)
        if (count === 6) return 3; // 3 columns (3x2)
        if (count === 7) return 4;
        if (count === 8) return 4;
        if (count === 9) return 3;
        if (count === 10) return 5;
        // For larger counts
        if (count % 4 === 0) return 4;
        if (count % 3 === 0) return 3;
        if (count % 5 === 0) return 5;
        return Math.min(count, 5); // Max 5 columns
    };
    const gridColumns = getGridColumns();

    const FRAME_OVERLAY_W = 375;
    const FRAME_OVERLAY_H = 488;
    const FRAME_W = FRAME_OVERLAY_W * 0.61;
    const FRAME_H = FRAME_OVERLAY_H * 0.5;
    const TITLE_FONT_SIZE = 28;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-2">
            {/* Random slots display */}
            <div
                className="grid gap-4 justify-center items-center"
                style={{
                    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                    gridTemplateRows: 'repeat(auto-fill, 1fr)',
                    maxWidth: gridColumns >= 4 ? '1600px' : '1200px',
                    margin: '0 auto'
                }}
            >
                {slots.map((song, index) => (
                    <div
                        key={`slot-${index}`}
                        className="relative"
                        style={{
                            width: FRAME_OVERLAY_W,
                            height: FRAME_OVERLAY_H,
                            transform: isAnimating ? 'scale(0.98)' : 'scale(1)',
                            transition: 'transform 0.1s ease-out'
                        }}
                    >
                        {/* Jacket image */}
                        <img
                            src={song.imgUrl}
                            alt={song.title}
                            loading="eager"
                            decoding="async"
                            className="absolute"
                            style={{
                                width: FRAME_W,
                                height: FRAME_H,
                                objectFit: 'cover',
                                left: '50%',
                                top: '50%',
                                transform: `translate(-50%, -50%) translateY(-${FRAME_OVERLAY_H / 13}px)`,
                                zIndex: 1,
                                backfaceVisibility: 'hidden',
                                willChange: 'contents',
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
                                zIndex: 3
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
                                    color: '#f1f1f1',
                                    textShadow: `
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
                                    fontSize: 20,
                                    fontWeight: 800,
                                    color: '#f1f1f1',
                                    textShadow: `
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
                                {song.lv}
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
                                    animation: song.title.length > 20 ? 'marquee 15s linear infinite' : 'none',
                                    display: 'inline-block'
                                }}

                            >
                                {song.title}
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
                                    animation: song.artist.length > 20 ? 'marquee 18s linear infinite' : 'none',
                                    display: 'inline-block'
                                }}
                            >
                                {song.artist}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuadRandomSlot;
