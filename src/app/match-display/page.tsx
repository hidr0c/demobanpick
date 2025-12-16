'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Song } from '../interface';

export default function MatchDisplay() {
    const router = useRouter();
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Track last user interaction to prevent sync overwriting local changes
    const lastInteractionRef = useRef<number>(0);

    // Update timestamp on any key press
    useEffect(() => {
        const handleInteraction = () => {
            lastInteractionRef.current = Date.now();
        };
        // Use capture to ensure we detect interaction before state updates triggers
        window.addEventListener('keydown', handleInteraction, true);
        return () => window.removeEventListener('keydown', handleInteraction, true);
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem('matchSongs');
        const lockedTracksStored = localStorage.getItem('lockedTracks');

        if (stored) {
            const parsed = JSON.parse(stored);
            let finalSongs = parsed;

            // Inject locked tracks at positions 3 & 4 if they exist
            if (lockedTracksStored) {
                const locked = JSON.parse(lockedTracksStored);
                const firstTwo = parsed.slice(0, 2);
                const remaining = parsed.slice(2);

                // Build final array: [track1, track2, locked3?, locked4?, ...rest]
                finalSongs = [
                    ...firstTwo,
                    ...(locked.track3 ? [locked.track3] : []),
                    ...(locked.track4 ? [locked.track4] : []),
                    ...remaining
                ];
            }

            setSongs(finalSongs);
        } else {
            // No songs, redirect back
            router.push('/');
        }
    }, [router]);

    // Sync to API when songs or currentIndex changes
    useEffect(() => {
        if (songs.length > 0) {
            const syncMatchDisplay = async () => {
                // Update interaction timestamp to prevent immediate overwrite
                lastInteractionRef.current = Date.now();

                try {
                    await fetch('/api/sync-state', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            matchDisplay: {
                                songs,
                                currentIndex
                            }
                        })
                    });
                } catch (error) {
                    console.error('Failed to sync match display:', error);
                }
            };
            syncMatchDisplay();

            // Also save to localStorage for fallback
            localStorage.setItem('matchCurrentIndex', String(currentIndex));
        }
    }, [songs, currentIndex]);

    // Poll for updates from other clients (e.g. controller)
    useEffect(() => {
        let lastTimestamp = 0;

        const checkForUpdates = async () => {
            // Prevent fighting: If user interacted recently (< 2 seconds), don't poll
            if (Date.now() - lastInteractionRef.current < 2000) {
                return;
            }

            try {
                // Lightweight check first
                const res = await fetch('/api/sync-state?check=1', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.timestamp && data.timestamp !== lastTimestamp) {
                        // Timestamp changed, fetch full data
                        const fullRes = await fetch('/api/sync-state', { cache: 'no-store' });
                        if (fullRes.ok) {
                            const fullData = await fullRes.json();
                            lastTimestamp = fullData.timestamp;

                            // Update match display if data exists
                            if (fullData.matchDisplay) {
                                if (fullData.matchDisplay.songs) setSongs(fullData.matchDisplay.songs);
                                if (typeof fullData.matchDisplay.currentIndex === 'number') {
                                    setCurrentIndex(fullData.matchDisplay.currentIndex);
                                }
                            } else if (fullData.matchSongs) {
                                // Fallback: try to reconstruct from game state if matchDisplay specific object is missing
                                // logic similar to initial load can go here if needed, but matchDisplay object is safer
                            }
                        }
                    }
                }
            } catch {
                // Silent fail
            }
        };

        const pollInterval = setInterval(checkForUpdates, 200);
        return () => clearInterval(pollInterval);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                setCurrentIndex(prev => (prev + 1) % songs.length);
            } else if (e.key === 'ArrowUp') {
                setCurrentIndex(prev => (prev - 1 + songs.length) % songs.length);
            } else if (e.key === 'Escape') {
                router.push('/');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [songs.length, router]);

    if (songs.length === 0) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const currentSong = songs[currentIndex];

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

    const getGradientColor = (diff: string) => {
        switch (diff) {
            case 'EXPERT':
                return '#ef4444';
            case 'MASTER':
                return '#9333ea';
            case 'RE:MASTER':
            case 'Re:MASTER':
                return '#c084fc';
            default:
                return '#a855f7';
        }
    };

    const getDiffBgColor = (diff: string) => {
        switch (diff) {
            case 'EXPERT':
                return '#ef4444';
            case 'MASTER':
                return '#9333ea';
            case 'RE:MASTER':
            case 'Re:MASTER':
                return '#c084fc';
            default:
                return '#9333ea';
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-end p-8 pb-2">
            {/* Main display - horizontal card */}
            <div
                className="relative flex items-center transition-all duration-300"
                style={{
                    background: `linear-gradient(to right, transparent 0%, ${getGradientColor(currentSong.diff)}90 30%, ${getGradientColor(currentSong.diff)} 100%)`,
                    borderRadius: '12px',
                    paddingBottom: '20px',
                    paddingTop: '12px',
                    paddingRight: '24px',
                    paddingLeft: '12px',
                    maxWidth: '600px',
                    width: '100%',
                    gap: '16px'
                }}
            >
                {/* Jacket */}
                <img
                    src={currentSong.imgUrl}
                    alt={currentSong.title}
                    style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: `2px solid rgba(255,255,255,0.3)`,
                        flexShrink: 0
                    }}
                />

                {/* Info section */}
                <div className="flex flex-col flex-grow min-w-0">
                    {/* Track number */}
                    <div
                        style={{
                            fontSize: '18px',
                            fontWeight: 800,
                            color: 'white',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '4px'
                        }}
                    >
                        TRACK {currentIndex + 1}/{songs.length}
                    </div>

                    {/* Title */}
                    <div
                        style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: 'white',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {currentSong.title}
                    </div>

                    {/* Artist */}
                    <div
                        style={{
                            fontSize: '14px',
                            color: 'rgba(255,255,255,0.8)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {currentSong.artist}
                    </div>
                </div>

                {/* Diff badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* STD/DX badge */}
                    <div
                        style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 700
                        }}
                    >
                        {currentSong.isDx === 'True' ? 'DX' : 'STD'}
                    </div>

                    {/* Diff badge */}
                    <div
                        style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            backgroundColor: getDiffBgColor(currentSong.diff),
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}
                    >
                        {currentSong.diff}
                    </div>

                    {/* Level */}
                    <div
                        style={{
                            fontSize: '16px',
                            fontWeight: 800,
                            color: 'white'
                        }}
                    >
                        {currentSong.lv}
                    </div>
                </div>
            </div>

            {/* Navigation hints
            <div className="mt-8 text-white text-center space-y-2">
                <div className="text-lg">
                    Press <kbd className="px-3 py-1 bg-white/20 rounded">↓</kbd> for next track
                </div>
                <div className="text-lg">
                    Press <kbd className="px-3 py-1 bg-white/20 rounded">↑</kbd> for previous track
                </div>
                <div className="text-sm opacity-70">
                    Press <kbd className="px-2 py-1 bg-white/20 rounded text-sm">ESC</kbd> to return
                </div>
            </div> */}

            {/* Track list indicator */}
            <div className="mt-8 flex gap-2">
                {songs.map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-3 h-3 rounded-full transition-all ${idx === currentIndex
                            ? 'bg-white scale-125'
                            : 'bg-white/30 hover:bg-white/50'
                            }`}
                        onClick={() => setCurrentIndex(idx)}
                        style={{ cursor: 'pointer' }}
                    />
                ))}
            </div>
        </div>
    );
}
