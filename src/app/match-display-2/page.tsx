'use client';

import { useEffect, useState } from 'react';
import { useGameDisplay } from '../hooks/useGame';
import { Song } from '../interface';

// Frame dimensions - match the frame PNG aspect ratio
const FRAME_W = 200;
const FRAME_H = 260;
const JACKET_SIZE = Math.floor(FRAME_W * 0.7);
const TOP_JACKET_OFFSET = Math.floor(FRAME_W * 0.2);
const LEFT_JACKET_OFFSET = Math.floor(FRAME_W * 0.15);

// Match Display 2 - controlled by Controller via Socket.IO
export default function MatchDisplay2() {
    const { state } = useGameDisplay();
    const [localSongs, setLocalSongs] = useState<Song[]>([]);
    const [isClient, setIsClient] = useState(false);

    const songs = state.matchSongs;
    const currentIndex = state.currentMatchIndex;

    // Load localStorage data only on client after mount
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

    const getDiffColor = (diff: string) => {
        switch (diff) {
            case 'EXPERT': return '#fe6069';
            case 'MASTER': return '#a352de';
            case 'RE:MASTER':
            case 'Re:MASTER': return '#e5d0f5';
            default: return '#a352de';
        }
    };

    const getFrameImage = (diff: string, isDx: string) => {
        const type = isDx === 'True' ? 'dx' : 'std';
        let diffName = diff.toLowerCase();

        if (diffName.includes('re:master') || diffName === 're:master') {
            diffName = 're';
        } else if (diffName.includes('master')) {
            diffName = 'master';
        } else if (diffName.includes('expert')) {
            diffName = 'expert';
        }

        return `/assets/${diffName}-${type}.png`;
    };

    // Use songs from state, fallback to localStorage
    const displaySongs = songs.length > 0 ? songs : localSongs;

    // Show loading state until client-side hydration completes
    if (!isClient || displaySongs.length === 0 || !displaySongs[currentIndex]) {
        return (
            <div
                className="min-h-screen w-full flex items-center"
                style={{ background: 'transparent', paddingLeft: '10px' }}
            >
                <div
                    className="flex items-center justify-center text-gray-400"
                    style={{
                        width: FRAME_W,
                        height: FRAME_H,
                        border: '2px dashed #444',
                        borderRadius: '8px'
                    }}
                >
                    <span className="text-sm">Waiting...</span>
                </div>
            </div>
        );
    }

    const currentSong = displaySongs[currentIndex] || displaySongs[0];

    return (
        <div
            className="min-h-screen w-full flex items-center"
            style={{ background: 'transparent', paddingLeft: '10px' }}
        >
            <div
                style={{
                    position: 'relative',
                    width: FRAME_W,
                    height: FRAME_H
                }}
            >
                {/* Jacket Image - behind frame */}
                <img
                    src={currentSong.imgUrl}
                    alt={currentSong.title}
                    style={{
                        position: 'absolute',
                        top: TOP_JACKET_OFFSET,
                        left: LEFT_JACKET_OFFSET,
                        width: JACKET_SIZE,
                        height: JACKET_SIZE,
                        objectFit: 'cover',
                        zIndex: 1
                    }}
                />

                {/* Frame Overlay - on top */}
                <img
                    src={getFrameImage(currentSong.diff, currentSong.isDx)}
                    alt="frame"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: FRAME_H,
                        zIndex: 2,
                        pointerEvents: 'none'
                    }}
                />

                {/* Diff + Lv - centered with gap */}
                <div
                    className="absolute"
                    style={{
                        position: 'absolute',
                        bottom: FRAME_H / 4.25,
                        left: 8,
                        right: 8,
                        textAlign: 'center',
                        fontSize: FRAME_W / 13,
                        fontWeight: 800,
                        color: '#FFFFFF',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        zIndex: 3,
                        gap: '4px',
                        textShadow: `
                        -2px -2px 0 ${getDiffColor(currentSong.diff)}, 
                        2px -2px 0 ${getDiffColor(currentSong.diff)},
                        -2px 2px 0 ${getDiffColor(currentSong.diff)},
                        2px 2px 0 ${getDiffColor(currentSong.diff)},
                        -2px 0px 0 ${getDiffColor(currentSong.diff)},
                        2px 0px 0 ${getDiffColor(currentSong.diff)},
                        0px -2px 0 ${getDiffColor(currentSong.diff)},
                        0px 2px 0 ${getDiffColor(currentSong.diff)}
                        `,
                        letterSpacing: '0.5px'
                    }}
                >
                    {currentSong.diff} {currentSong.lv}
                </div>

                {/* Title at bottom of frame */}
                <div
                    style={{
                        position: 'absolute',
                        width: FRAME_W * 0.71,
                        bottom: FRAME_H / 7.5,
                        left: FRAME_W * 0.15,
                        textAlign: 'center',
                        fontSize: FRAME_W / 17,
                        fontWeight: 800,
                        color: '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        zIndex: 3,
                        // animation: currentSong.title.length > 20 ? 'marquee 15s linear infinite' : 'none'
                    }}
                >
                    {currentSong.title}
                </div>

                {/* Artist at bottom of frame */}
                <div
                    style={{
                        position: 'absolute',
                        width: FRAME_W * 0.72,
                        bottom: FRAME_W / 15,
                        left: FRAME_W * 0.15,
                        textAlign: 'center',
                        fontSize: FRAME_W / 20 - 2,
                        fontWeight: 600,
                        color: '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        zIndex: 3,
                        // animation: currentSong.artist.length > 30 ? 'marquee 18s linear infinite' : 'none'
                    }}
                >
                    {currentSong.artist}
                </div>
                {/* Track number badge */}
                <div
                    style={{
                        position: 'absolute',
                        top: -FRAME_H / 10,
                        left: FRAME_W / 2.7,
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        color: 'white',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        fontSize: 9,
                        fontWeight: 700,
                        zIndex: 4
                    }}
                >
                    <span>TRACK </span>{currentIndex + 1}/{displaySongs.length}
                </div>
            </div>
        </div>
    );
}
