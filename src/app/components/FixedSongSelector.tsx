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
                return 'text-red-500';
            case 'MASTER':
                return 'text-purple-600';
            case 'RE:MASTER':
            case 'Re:MASTER':
                return 'text-pink-500';
            default:
                return 'text-purple-400';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg font-semibold transition-colors"
            >
                Fixed Songs ({selectedSongs.length})
            </button>

            {isOpen && (
                <div className="absolute top-12 right-0 w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
                    <div className="p-4 bg-purple-600 text-white font-bold">
                        Select Fixed Songs for Ban/Pick
                    </div>

                    <div className="overflow-y-auto max-h-[500px] p-4">
                        {pool.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                No songs available
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pool.map((song) => {
                                    const isSelected = selectedSongs.find(s => s.id === song.id);
                                    return (
                                        <div
                                            key={song.id}
                                            onClick={() => toggleSong(song)}
                                            className={`
                        p-3 rounded-lg cursor-pointer transition-all
                        ${isSelected
                                                    ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                                                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                                                }
                      `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    isSelected={!!isSelected}
                                                    onChange={() => { }}
                                                    color="secondary"
                                                />

                                                <img
                                                    src={song.imgUrl}
                                                    alt={song.title}
                                                    className="w-12 h-12 rounded object-cover"
                                                />

                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm truncate">
                                                        {song.title}
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                        {song.artist}
                                                    </div>
                                                    <div className={`text-xs font-bold ${getDiffColor(song.diff)}`}>
                                                        {song.diff} {song.lv}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {selectedSongs.length > 0 && (
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 border-t">
                            <button
                                onClick={() => onChange([])}
                                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                            >
                                Clear All ({selectedSongs.length})
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Overlay to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 -z-10"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default FixedSongSelector;
