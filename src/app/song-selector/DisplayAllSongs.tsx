'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Song } from '../interface';

type DisplayAllProps = {
    pool: Song[];
    selectCount?: number;
};

type SearchTag = { type: 'diff' | 'level'; value: string };

const DIFF_MAP: Record<string, string> = {
    'ex': 'EXPERT', 'expert': 'EXPERT',
    'mas': 'MASTER', 'master': 'MASTER',
    're': 'RE:MASTER', 'remaster': 'RE:MASTER', 're:master': 'RE:MASTER'
};

const DisplayAll: React.FC<DisplayAllProps> = ({
    pool,
    selectCount = 4
}) => {
    const [slots, setSlots] = useState<Song[]>(pool);
    const [inputValue, setInputValue] = useState('');
    const [tags, setTags] = useState<SearchTag[]>([]);
    const selectedSongsRef = useRef<Song[]>([]);
    const preloadedImagesRef = useRef<Set<string>>(new Set());

    // Add tag function
    const addTag = (type: 'diff' | 'level', value: string) => {
        if (!tags.some(t => t.type === type && t.value === value)) {
            setTags([...tags, { type, value }]);
        }
    };

    // Remove tag function
    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    // Handle key down for tag detection
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ' || e.key === 'Spacebar') {
            const trimmed = inputValue.trim().toLowerCase();

            // Check difficulty
            if (DIFF_MAP[trimmed]) {
                e.preventDefault();
                addTag('diff', DIFF_MAP[trimmed]);
                setInputValue('');
                return;
            }

            // Check level (1-15, with optional +)
            const levelMatch = trimmed.match(/^(1[0-5]|[1-9])(\+)?$/);
            if (levelMatch) {
                e.preventDefault();
                addTag('level', trimmed.toUpperCase());
                setInputValue('');
                return;
            }
        }
    };

    // Filter songs based on search query and tags
    const filteredSongs = slots.filter(song => {
        // Check text search (title/artist)
        const matchesText = !inputValue.trim() ||
            song.title.toLowerCase().includes(inputValue.toLowerCase()) ||
            song.artist.toLowerCase().includes(inputValue.toLowerCase());

        // Check diff tags
        const diffTags = tags.filter(t => t.type === 'diff');
        const matchesDiff = diffTags.length === 0 ||
            diffTags.some(t => song.diff.toUpperCase() === t.value ||
                (t.value === 'RE:MASTER' && song.diff.toUpperCase() === 'RE:MASTER'));

        // Check level tags
        const levelTags = tags.filter(t => t.type === 'level');
        const matchesLevel = levelTags.length === 0 ||
            levelTags.some(t => song.lv === t.value);

        return matchesText && matchesDiff && matchesLevel;
    });

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
    const gridColumns = 5;

    const scale = 0.75;
    const FRAME_OVERLAY_W = 300;
    const FRAME_OVERLAY_H = 390;
    const FRAME_W = FRAME_OVERLAY_W * 0.61;
    const FRAME_H = FRAME_OVERLAY_H * 0.5;
    const TITLE_FONT_SIZE = 20;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Sticky Search Navbar */}
            <div
                className="sticky top-0 z-50 px-6 pt-10 pb-4"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-wrap items-center gap-2 bg-transparent border border-gray-600 rounded-lg px-3 py-2">
                        {/* Tags */}
                        {tags.map((tag, index) => (
                            <span
                                key={`${tag.type}-${tag.value}-${index}`}
                                className="flex items-center gap-1 px-2 py-1 rounded text-sm text-white"
                                style={{
                                    backgroundColor: tag.type === 'diff'
                                        ? getDiffColor(tag.value)
                                        : '#2563eb'
                                }}
                            >
                                {tag.value}
                                <button
                                    onClick={() => removeTag(index)}
                                    className="ml-1 hover:text-red-300 font-bold"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        {/* Search Input */}
                        <input
                            type="text"
                            placeholder={tags.length > 0 ? "Add more filters..." : "Search by title, artist, or type 'ex', 'mas', 're', '13+' + Space..."}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 min-w-[200px] bg-transparent text-white focus:outline-none placeholder-gray-400"
                        />
                    </div>
                </div>
            </div>

            {/* Grid display - 6 columns */}
            <div
                className="grid gap-2 p-4 justify-items-center"
                style={{
                    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                    maxWidth: '1600px',
                    margin: '0 auto',
                    width: '100%'
                }}
            >
                {filteredSongs.map((song, index) => (
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
