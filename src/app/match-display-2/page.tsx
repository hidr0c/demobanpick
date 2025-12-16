'use client';

import { useEffect, useState } from 'react';
import { Song } from '../interface';

// Frame dimensions - match the frame PNG aspect ratio
// Original frame is 300x390, scale down to ~60%
const FRAME_W = 200;
const FRAME_H = 260;
// Jacket should be square and fit inside the frame's image area
const JACKET_SIZE = Math.floor(FRAME_W * 0.7); // ~166px
const TOP_JACKET_OFFSET = Math.floor(FRAME_W * 0.2); // ~7px from edge
const LEFT_JACKET_OFFSET = Math.floor(FRAME_W * 0.15); // ~7px from edge

export default function MatchDisplay2() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
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
    useEffect(() => {
        let lastTimestamp = 0;
        let isFirstLoad = true;

        // Lightweight check - only fetch timestamp
        const checkForUpdates = async (): Promise<boolean> => {
            try {
                const res = await fetch('/api/sync-state?check=1', {
                    cache: 'no-store'
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.timestamp && data.timestamp !== lastTimestamp) {
                        return true; // Has updates
                    }
                }
            } catch {
                // Silent fail
            }
            return false;
        };

        // Full data fetch
        const fetchFullData = async () => {
            try {
                const res = await fetch('/api/sync-state', {
                    cache: 'no-store'
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.timestamp) {
                        lastTimestamp = data.timestamp;
                    }
                    if (data.matchDisplay) {
                        if (data.matchDisplay.songs) {
                            setSongs(data.matchDisplay.songs);
                        }
                        if (data.matchDisplay.currentIndex !== undefined) {
                            setCurrentIndex(data.matchDisplay.currentIndex);
                        }
                    }
                    isFirstLoad = false;
                }
            } catch {
                // Silent fail
            }
        };

        // Poll API for match state updates
        const handleUpdate = async () => {
            if (isFirstLoad) {
                // First load - get full data
                await fetchFullData();

                // Fallback to localStorage if API failed
                if (isFirstLoad) {
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
                        isFirstLoad = false;
                    } catch {
                        // localStorage not available
                    }
                }
            } else {
                // Subsequent loads - lightweight check first
                const hasUpdates = await checkForUpdates();
                if (hasUpdates) {
                    await fetchFullData();
                }
            }
        };

        // Initial load
        handleUpdate();

        // Poll for updates - lightweight check most of the time
        const pollInterval = setInterval(handleUpdate, 1000);

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
                        width: FRAME_W,
                        height: FRAME_H,
                        // objectFit: 'contain',
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
                        -3px 0px 0 ${getDiffColor(currentSong.diff)},
                        3px 0px 0 ${getDiffColor(currentSong.diff)},
                        0px -3px 0 ${getDiffColor(currentSong.diff)},
                        0px 3px 0 ${getDiffColor(currentSong.diff)}
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
                        bottom: FRAME_W / 5.5,
                        left: 8,
                        right: 8,
                        textAlign: 'center',
                        fontSize: FRAME_W / 20,
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
                
                {/* Artist at bottom of frame */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: FRAME_W / 15,
                        left: 8,
                        right: 8,
                        textAlign: 'center',
                        fontSize: FRAME_W / 20 - 2,
                        fontWeight: 600,
                        color: '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        zIndex: 3
                    }}
                >
                    {currentSong.artist}
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
