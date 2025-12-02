'use client';

import React from 'react';
import { Song } from '../interface';
import { Checkbox } from '@heroui/react';

type FixedSongSelectorProps = {
    pool: Song[];
    selectedSongs: Song[];
    onChange: (songs: Song[]) => void;
};

const FixedSongSelector: React.FC<FixedSongSelectorProps> = ({
    pool,
    selectedSongs,
    onChange
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    const toggleSong = (song: Song) => {
        const isSelected = selectedSongs.find(s => s.id === song.id);
        if (isSelected) {
            onChange(selectedSongs.filter(s => s.id !== song.id));
        } else {
            onChange([...selectedSongs, song]);
        }
    };

    const getDiffColor = (diff: string) => {
        switch (diff) {
            case 'EXPERT':
                return 'text-red-400';
            case 'MASTER':
                return 'text-purple-400';
            case 'RE:MASTER':
            case 'Re:MASTER':
                return 'text-pink-400';
            default:
                return 'text-purple-300';
        }
    };

    // Sort: selected songs first, then filter by search
    const filteredPool = React.useMemo(() => {
        const filtered = pool.filter(song =>
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        // Sort selected songs to top
        return filtered.sort((a, b) => {
            const aSelected = selectedSongs.some(s => s.id === a.id);
            const bSelected = selectedSongs.some(s => s.id === b.id);
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return 0;
        });
    }, [pool, searchQuery, selectedSongs]);

    return (
        <div className="fixed top-8 right-0 z-50 flex items-start">
            {/* Toggle Arrow Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white/20 backdrop-blur-sm p-3 rounded-l-lg transition-all hover:bg-white/30"
                style={{
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
            >
                <svg
                    className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-0' : 'rotate-180'}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.8)"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Slide Panel */}
            <div
                className="bg-gray-900 rounded-l-lg shadow-2xl overflow-hidden"
                style={{
                    width: isOpen ? '380px' : '0px',
                    maxHeight: '90vh',
                    opacity: isOpen ? 1 : 0,
                    transition: 'width 0.3s ease-out, opacity 0.2s ease-out',
                }}
            >
                {isOpen && (
                    <>
                        {/* Header */}
                        <div className="p-4 bg-purple-600 text-white">
                            <h3 className="font-bold text-lg">Fixed Songs</h3>
                            <p className="text-sm opacity-90">Selected: {selectedSongs.length}</p>
                        </div>

                        {/* Search Box */}
                        <div className="p-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-purple-500 focus:border-purple-400 outline-none placeholder-gray-400"
                            />
                        </div>

                        {/* Song List */}
                        <div
                            className="overflow-y-auto p-3 space-y-2"
                            style={{ maxHeight: 'calc(90vh - 160px)' }}
                        >
                            {filteredPool.length === 0 ? (
                                <div className="text-center text-gray-400 py-8">
                                    {searchQuery ? 'No songs found' : 'No songs available'}
                                </div>
                            ) : (
                                filteredPool.map((song) => {
                                    const isSelected = selectedSongs.find(s => s.id === song.id);
                                    return (
                                        <div
                                            key={song.id}
                                            onClick={() => toggleSong(song)}
                                            className={`
                                                p-2 rounded-lg cursor-pointer
                                                ${isSelected
                                                    ? 'bg-purple-900/50 border border-purple-500'
                                                    : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={song.imgUrl}
                                                    alt={song.title}
                                                    className="w-12 h-12 rounded object-cover"
                                                />

                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm truncate text-white">
                                                        {song.title}
                                                    </div>
                                                    <div className="text-xs text-gray-400 truncate">
                                                        {song.artist}
                                                    </div>
                                                    <div className={`text-xs font-bold ${getDiffColor(song.diff)}`}>
                                                        {song.diff} {song.lv}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Clear All Button - Always visible at bottom */}
                        {selectedSongs.length > 0 && (
                            <div className="p-3 bg-gray-800 border-t border-gray-700 sticky bottom-0">
                                <button
                                    onClick={() => onChange([])}
                                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                                >
                                    Deselect All ({selectedSongs.length})
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Overlay to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 -z-10 bg-black/10"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default FixedSongSelector;
