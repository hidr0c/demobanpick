'use client';

import '../css/embla.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameDisplay } from '../hooks/useGame';
import { Song } from '../interface';

// Match Display - controlled by Controller via Socket.IO
export default function MatchDisplay() {
    const router = useRouter();
    const { state } = useGameDisplay();
    const [localSongs, setLocalSongs] = useState<Song[]>([]);
    const [isClient, setIsClient] = useState(false);

    const songs = state.matchSongs;
    const currentIndex = state.currentMatchIndex;

    // Load localStorage data on client mount
    useEffect(() => {
        setIsClient(true);

        if (songs.length === 0) {
            const stored = localStorage.getItem('matchSongs');
            const lockedTracksStored = localStorage.getItem('lockedTracks');

            if (stored) {
                const parsed = JSON.parse(stored);
                if (lockedTracksStored) {
                    const locked = JSON.parse(lockedTracksStored);
                    const firstTwo = parsed.slice(0, 2);
                    setLocalSongs([
                        ...firstTwo,
                        ...(locked.track3 ? [locked.track3] : []),
                        ...(locked.track4 ? [locked.track4] : []),
                    ]);
                } else {
                    setLocalSongs(parsed);
                }
            }
        }
    }, [songs.length]);

    // Use songs from state, fallback to localStorage
    const displaySongs = songs.length > 0 ? songs : localSongs;

    // Show loading during SSR or when no songs
    if (!isClient || displaySongs.length === 0 || !displaySongs[currentIndex]) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white text-xl">
                Waiting for Controller...
            </div>
        );
    }

    const currentSong = displaySongs[currentIndex] || displaySongs[0];

    const getGradientColor = (diff: string) => {
        switch (diff) {
            case 'EXPERT': return '#ef4444';
            case 'MASTER': return '#9333ea';
            case 'RE:MASTER':
            case 'Re:MASTER': return '#c084fc';
            default: return '#a855f7';
        }
    };

    const getDiffBgColor = (diff: string) => {
        switch (diff) {
            case 'EXPERT': return '#ef4444';
            case 'MASTER': return '#9333ea';
            case 'RE:MASTER':
            case 'Re:MASTER': return '#c084fc';
            default: return '#9333ea';
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-end p-8 pb-2 bg-transparent">
            {/* Main display - horizontal card */}
            <div
                className="relative flex items-center transition-all duration-300"
                style={{
                    background: `linear-gradient(to right, ${getGradientColor(currentSong.diff)}90 20%, ${getGradientColor(currentSong.diff)}90 30%, ${getGradientColor(currentSong.diff)} 100%)`,
                    borderRadius: '12px',
                    paddingBottom: '16px',
                    paddingTop: '16px',
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
                        TRACK {currentIndex + 1}/{displaySongs.length}
                    </div>

                    {/* Title */}
                    <div
                        className="custom-title-font"
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
                            fontWeight: 500,
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

            {/* Track list indicator */}
            <div className="mt-8 flex gap-2">
                {displaySongs.map((_: Song, idx: number) => (
                    <div
                        key={idx}
                        className={`w-3 h-3 rounded-full transition-all ${idx === currentIndex
                            ? 'bg-white scale-125'
                            : 'bg-white/30'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
