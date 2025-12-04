'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Song } from '../interface';

type DisplayAllProps = {
    pool: Song[];
    selectCount?: number;
};

const DisplayAll: React.FC<DisplayAllProps> = ({
    pool,
    selectCount = 4
}) => {
    const [slots, setSlots] = useState<Song[]>(pool);
    const selectedSongsRef = useRef<Song[]>([]);
    const preloadedImagesRef = useRef<Set<string>>(new Set());

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

    // Enter key handler
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                // Set select/deselect function here
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [selectCount]);

    // Determine grid columns based on random count
    const gridColumns = 8;

    const scale = 0.8;
    const FRAME_OVERLAY_W = 300;
    const FRAME_OVERLAY_H = 390;
    const FRAME_W = FRAME_OVERLAY_W * 0.61;
    const FRAME_H = FRAME_OVERLAY_H * 0.5;
    const TITLE_FONT_SIZE = 20;

    return (
        <div 
            className="flex flex-col items-start justify-center min-h-screen gap-8 p-4"
            style={{

            }}
        >
            
            {/* Random slots display */}
            <div
                className="flex flex-row gap-8 justify-center items-center flex-wrap"
                style={{
                    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                    gridTemplateRows: 'repeat(auto-fill, 1fr)',
                    maxWidth: gridColumns >= 4 ? '1400px' : '1100px',
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
                            transform: `scale(${scale})`,
                            transition: 'transform 0.1s ease-out'
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
                                left: '50%',
                                top: '50%',
                                transform: `translate(-50%, -50%) translateY(-${FRAME_OVERLAY_H / 13}px)`,
                                zIndex: 1,
                                backfaceVisibility: 'hidden',
                                willChange: 'contents'
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

export default DisplayAll;
