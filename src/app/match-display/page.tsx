'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Song } from '../interface';

export default function MatchDisplay() {
    const router = useRouter();
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

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
    }; const FRAME_W = 140;
    const FRAME_H = 140;
    const FRAME_OVERLAY_W = 200;
    const FRAME_OVERLAY_H = 260;

    return (
        <div className="min-h-screen flex flex-col items-center justify-start pt-8 p-8 pb-16">
            {/* Track counter */}
            <div className="mb-8 text-white text-2xl font-bold">
                Track {currentIndex + 1} / {songs.length}
            </div>

            {/* Main display */}
            <div
                className="relative transition-all duration-300"
                style={{
                    width: FRAME_OVERLAY_W,
                    height: FRAME_OVERLAY_H,
                    paddingBottom: '8px'
                }}
            >
                {/* Jacket */}
                <img
                    src={currentSong.imgUrl}
                    alt={currentSong.title}
                    className="absolute"
                    style={{
                        width: FRAME_W,
                        height: FRAME_H,
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: `3px solid ${getBorderColor(currentSong.diff)}`,
                        boxShadow: `0 0 20px ${getBorderColor(currentSong.diff)}80`,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%) translateY(-20px)',
                        zIndex: 1
                    }}
                />

                {/* Frame */}
                <img
                    src={getFrameImage(currentSong.diff, currentSong.isDx)}
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
                            color: getDiffColor(currentSong.diff),
                            letterSpacing: '0.5px'
                        }}
                    >
                        {currentSong.diff}
                    </div>
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: getDiffColor(currentSong.diff),
                            letterSpacing: '0.5px'
                        }}
                    >
                        {currentSong.lv}
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
                        overflow: 'hidden',
                        clipPath: 'inset(0)',
                        pointerEvents: 'none',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#000',
                            whiteSpace: 'nowrap',
                            animation: currentSong.title.length > 15 ? 'marquee 15s linear infinite' : 'none',
                            display: 'inline-block'
                        }}
                    >
                        {currentSong.title}
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
                        overflow: 'hidden',
                        clipPath: 'inset(0)',
                        pointerEvents: 'none',
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
                            animation: currentSong.artist.length > 20 ? 'marquee 18s linear infinite' : 'none',
                            display: 'inline-block'
                        }}
                    >
                        {currentSong.artist}
                    </div>
                </div>
            </div>

            {/* Navigation hints */}
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
            </div>

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
