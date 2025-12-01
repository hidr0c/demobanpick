'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Song } from '../interface';

type QuadRandomSlotProps = {
    pool: Song[];
    onRandomComplete?: (results: Song[]) => void;
    disabled?: boolean;
    fixedSongs?: Song[];
};

const QuadRandomSlot: React.FC<QuadRandomSlotProps> = ({
    pool,
    onRandomComplete,
    disabled = false,
    fixedSongs = []
}) => {
    const [slots, setSlots] = useState<Song[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const animationStartTimeRef = useRef<number>(0);

    // Initialize with random songs
    useEffect(() => {
        if (pool.length >= 4) {
            const availablePool = pool.filter(
                song => !fixedSongs.find(f => f.id === song.id)
            );
            const initial = getRandomUniqueSongs(availablePool, 4);
            setSlots(initial);
        }
    }, [pool, fixedSongs]);

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
                return '#e5d0f5';
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

    const startRandomAnimation = () => {
        if (isAnimating || disabled) return;

        setIsAnimating(true);
        animationStartTimeRef.current = Date.now();

        const availablePool = pool.filter(
            song => !fixedSongs.find(f => f.id === song.id)
        );

        const animate = () => {
            const elapsed = Date.now() - animationStartTimeRef.current;
            const duration = 3000; // 3 seconds animation

            if (elapsed < duration) {
                // Fast random cycling
                const tempSlots = getRandomUniqueSongs(availablePool, 4);
                setSlots(tempSlots);
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                // Final result
                const finalResults = getRandomUniqueSongs(availablePool, 4);
                setSlots(finalResults);
                setIsAnimating(false);

                if (onRandomComplete) {
                    setTimeout(() => onRandomComplete(finalResults), 500);
                }
            }
        };

        animate();
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
    }, [disabled, isAnimating, pool, fixedSongs]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const FRAME_W = 180;
    const FRAME_H = 180;
    const FRAME_OVERLAY_W = 300;
    const FRAME_OVERLAY_H = 390;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
            {/* 4 vertical slots */}
            <div className="flex flex-row gap-8 justify-center items-center flex-wrap">
                {slots.map((song, index) => (
                    <div
                        key={`${song.id}-${index}`}
                        className={`relative transition-all duration-300 ${isAnimating ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
                            }`}
                        style={{
                            width: FRAME_OVERLAY_W,
                            height: FRAME_OVERLAY_H
                        }}
                    >
                        {/* Jacket image */}
                        <img
                            src={song.imgUrl}
                            alt={song.title}
                            className="absolute"
                            style={{
                                width: FRAME_W,
                                height: FRAME_H,
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: `2px solid ${getBorderColor(song.diff)}`,
                                boxShadow: `0 0 8px ${getBorderColor(song.diff)}40`,
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%) translateY(-20px)',
                                zIndex: 1
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
                                bottom: FRAME_OVERLAY_H * 0.215,
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
                                    fontSize: 16,
                                    fontWeight: 800,
                                    color: getDiffColor(song.diff),
                                    letterSpacing: '0.5px'
                                }}
                            >
                                {song.diff}
                            </div>
                            <div
                                style={{
                                    fontSize: 16,
                                    fontWeight: 800,
                                    color: getDiffColor(song.diff),
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
                                bottom: FRAME_OVERLAY_H * 0.12,
                                width: FRAME_OVERLAY_W * 0.75,
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
                                    fontSize: 14,
                                    color: '#000',
                                    whiteSpace: 'nowrap',
                                    animation: song.title.length > 15 ? 'marquee 15s linear infinite' : 'none',
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
                                left: '50%',
                                transform: 'translateX(-50%)',
                                bottom: FRAME_OVERLAY_H * 0.045,
                                width: FRAME_OVERLAY_W * 0.75,
                                textAlign: 'center',
                                zIndex: 4,
                                pointerEvents: 'none',
                                overflow: 'hidden',
                                clipPath: 'inset(0)',
                                height: '16px',
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
