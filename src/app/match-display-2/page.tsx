'use client';

import { useEffect, useState } from 'react';
import { Song } from '../interface';

// Frame dimensions - match the frame PNG aspect ratio
// Original frame is 300x390, scale down to ~60%
const FRAME_W = 180;
const FRAME_H = 234;
// Jacket should be square and fit inside the frame's image area
const JACKET_SIZE = Math.floor(FRAME_W * 0.92); // ~166px
const JACKET_OFFSET = Math.floor(FRAME_W * 0.04); // ~7px from edge

export default function MatchDisplay2() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        let lastTimestamp = 0;

        // Poll API for match state updates
        const handleUpdate = async () => {
            try {
                const res = await fetch('/api/sync-state', {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                });

                if (res.ok) {
                    const data = await res.json();

                    if (data.timestamp && data.timestamp !== lastTimestamp) {
                        lastTimestamp = data.timestamp;

                        // Get match songs and current index
                        if (data.matchDisplay) {
                            if (data.matchDisplay.songs) {
                                setSongs(data.matchDisplay.songs);
                            }
                            if (data.matchDisplay.currentIndex !== undefined) {
                                setCurrentIndex(data.matchDisplay.currentIndex);
                            }
                        }
                    }
                }
            } catch (err) {
                console.log('[match-display-2] API failed:', err);
            }

            // Fallback to localStorage
            try {
                const stored = localStorage.getItem('matchSongs');
                const indexStored = localStorage.getItem('matchCurrentIndex');
                const lockedTracksStored = localStorage.getItem('lockedTracks');

                if (stored) {
                    const parsed = JSON.parse(stored);
                    let finalSongs = parsed;

                    if (lockedTracksStored) {
                        const locked = JSON.parse(lockedTracksStored);
                        const firstTwo = parsed.slice(0, 2);
                        const remaining = parsed.slice(2);
                        finalSongs = [
                            ...firstTwo,
                            ...(locked.track3 ? [locked.track3] : []),
                            ...(locked.track4 ? [locked.track4] : []),
                            ...remaining
                        ];
                    }
                    setSongs(finalSongs);
                }
                if (indexStored) {
                    setCurrentIndex(parseInt(indexStored));
                }
            } catch {
                // localStorage not available
            }
        };

        // Initial load
        handleUpdate();

        // Poll for updates
        const pollInterval = setInterval(handleUpdate, 500);

        return () => clearInterval(pollInterval);
    }, []);

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

    if (songs.length === 0 || !songs[currentIndex]) {
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
                    <span className="text-sm">No Song</span>
                </div>
            </div>
        );
    }

    const currentSong = songs[currentIndex];

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
                        top: JACKET_OFFSET,
                        left: JACKET_OFFSET,
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
                        width: FRAME_W,
                        height: FRAME_H,
                        objectFit: 'contain',
                        zIndex: 2,
                        pointerEvents: 'none'
                    }}
                />

                {/* Title at bottom of frame */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 6,
                        left: 8,
                        right: 8,
                        textAlign: 'center',
                        fontSize: 9,
                        fontWeight: 600,
                        color: '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        zIndex: 3
                    }}
                >
                    {currentSong.title}
                </div>

                {/* Track number badge */}
                <div
                    style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: 9,
                        fontWeight: 700,
                        zIndex: 4
                    }}
                >
                    {currentIndex + 1}/{songs.length}
                </div>
            </div>
        </div>
    );
}
