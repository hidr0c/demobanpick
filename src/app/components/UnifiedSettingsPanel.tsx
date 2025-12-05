'use client';

import React from 'react';
import { Song } from '../interface';

// Available pools
const POOL_OPTIONS = [
    { id: 'newbieSemi', name: 'Newbie Semi', file: 'newbieSemi.json' },
    { id: 'qualTop', name: 'Qual Top', file: 'qualTop.json' },
    { id: 'qualBottom', name: 'Qual Bottom', file: 'qualBottom.json' },
    { id: 'semiFinals', name: 'Semi Finals', file: 'semiFinals.json' },
    { id: 'finals', name: 'Finals', file: 'finals.json' },
    { id: 'top32', name: 'Top 32 (Custom)', file: 'top32.json' },
];

type UnifiedSettingsPanelProps = {
    pool: Song[];
    randomCount: number;
    fixedSongs: Song[];
    lockedTracks: { track3?: Song; track4?: Song };
    selectedPool: string;
    onRandomCountChange: (count: number) => void;
    onFixedSongsChange: (songs: Song[]) => void;
    onLockedTracksChange: (locked: { track3?: Song; track4?: Song }) => void;
    onPoolChange: (poolId: string) => void;
    maxTotal?: number;
    minTotal?: number;
};

const UnifiedSettingsPanel: React.FC<UnifiedSettingsPanelProps> = ({
    pool,
    randomCount,
    fixedSongs,
    lockedTracks,
    selectedPool,
    onRandomCountChange,
    onFixedSongsChange,
    onLockedTracksChange,
    onPoolChange,
    maxTotal = 6,
    minTotal = 2
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [poolSearch, setPoolSearch] = React.useState('');
    const [showPoolDropdown, setShowPoolDropdown] = React.useState(false);
    const [track3Search, setTrack3Search] = React.useState('');
    const [track4Search, setTrack4Search] = React.useState('');
    const [showTrack3Dropdown, setShowTrack3Dropdown] = React.useState(false);
    const [showTrack4Dropdown, setShowTrack4Dropdown] = React.useState(false);

    // Close dropdowns when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Don't close if clicking inside dropdown or input
            if (!target.closest('.track3-container') && showTrack3Dropdown) {
                setShowTrack3Dropdown(false);
            }
            if (!target.closest('.track4-container') && showTrack4Dropdown) {
                setShowTrack4Dropdown(false);
            }
            if (!target.closest('.pool-container') && showPoolDropdown) {
                setShowPoolDropdown(false);
            }
        };

        if (showTrack3Dropdown || showTrack4Dropdown || showPoolDropdown) {
            // Use setTimeout to avoid immediate trigger
            setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 0);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showTrack3Dropdown, showTrack4Dropdown, showPoolDropdown]); const fixedCount = fixedSongs.length;
    const totalSongs = randomCount + fixedCount;

    // Random songs: min 2, max 6 (independent of fixed)
    const maxRandom = 6;
    const minRandom = 2;

    const handleIncrement = () => {
        if (randomCount < maxRandom) {
            onRandomCountChange(randomCount + 1);
        }
    };

    const handleDecrement = () => {
        if (randomCount > minRandom) {
            onRandomCountChange(randomCount - 1);
        }
    };

    const toggleSong = (song: Song) => {
        const isSelected = fixedSongs.find(s => s.id === song.id);
        if (isSelected) {
            onFixedSongsChange(fixedSongs.filter(s => s.id !== song.id));
        } else {
            onFixedSongsChange([...fixedSongs, song]);
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

    // Filter out locked tracks from available pool
    const availablePool = React.useMemo(() => {
        return pool.filter(song =>
            song.id !== lockedTracks.track3?.id &&
            song.id !== lockedTracks.track4?.id
        );
    }, [pool, lockedTracks]);

    // Filter pools for locked track dropdowns
    const track3Options = React.useMemo(() => {
        return pool
            .filter(s => s.id !== lockedTracks.track4?.id)
            .filter(s =>
                s.title.toLowerCase().includes(track3Search.toLowerCase()) ||
                s.artist.toLowerCase().includes(track3Search.toLowerCase()) ||
                s.diff.toLowerCase().includes(track3Search.toLowerCase())
            );
    }, [pool, lockedTracks.track4, track3Search]);

    const track4Options = React.useMemo(() => {
        return pool
            .filter(s => s.id !== lockedTracks.track3?.id)
            .filter(s =>
                s.title.toLowerCase().includes(track4Search.toLowerCase()) ||
                s.artist.toLowerCase().includes(track4Search.toLowerCase()) ||
                s.diff.toLowerCase().includes(track4Search.toLowerCase())
            );
    }, [pool, lockedTracks.track3, track4Search]);

    // Sort: selected songs first, then filter by search
    const filteredPool = React.useMemo(() => {
        const filtered = availablePool.filter(song =>
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Sort selected songs to top
        return filtered.sort((a, b) => {
            const aSelected = fixedSongs.some(s => s.id === a.id);
            const bSelected = fixedSongs.some(s => s.id === b.id);
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return 0;
        });
    }, [availablePool, searchQuery, fixedSongs]);

    return (
        <div className="fixed top-8 left-0 z-50">
            {/* Container for panel + button */}
            <div
                className="flex items-start"
                style={{
                    transform: isOpen ? 'translateX(0)' : 'translateX(-380px)',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform',
                }}
            >
                {/* Slide Panel */}
                <div
                    className="bg-gray-900 rounded-r-lg shadow-2xl overflow-hidden flex flex-col"
                    style={{
                        width: '380px',
                        maxHeight: '90vh',
                        opacity: isOpen ? 1 : 0,
                        transition: 'opacity 0.2s ease-out',
                    }}
                >
                    {/* Always render content, just hide visually when closed */}
                    <div
                        className="flex flex-col h-full"
                        style={{
                            visibility: isOpen ? 'visible' : 'hidden',
                            maxHeight: '90vh'
                        }}
                    >
                        {/* Track Settings Section */}
                        <div className="p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
                            <h3 className="font-bold text-lg text-white mb-4">Track Settings</h3>

                            {/* Pool Selector */}
                            <div className="mb-4 relative pool-container">
                                <label className="text-gray-400 text-sm block mb-2">Song Pool</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={POOL_OPTIONS.find(p => p.id === selectedPool)?.name || "Select pool..."}
                                        value={poolSearch}
                                        onChange={(e) => setPoolSearch(e.target.value)}
                                        onFocus={() => setShowPoolDropdown(true)}
                                        className="w-full px-3 py-2 text-sm rounded-lg bg-gray-700 text-white border border-purple-500 outline-none placeholder-gray-300"
                                    />
                                </div>

                                {showPoolDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-purple-500 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                                        {POOL_OPTIONS
                                            .filter(p => p.name.toLowerCase().includes(poolSearch.toLowerCase()))
                                            .map(pool => (
                                                <div
                                                    key={pool.id}
                                                    onClick={() => {
                                                        onPoolChange(pool.id);
                                                        setPoolSearch('');
                                                        setShowPoolDropdown(false);
                                                    }}
                                                    className={`p-3 cursor-pointer flex items-center justify-between ${selectedPool === pool.id
                                                        ? 'bg-purple-600 text-white'
                                                        : 'hover:bg-purple-600 text-white'
                                                        }`}
                                                >
                                                    <span>{pool.name}</span>
                                                    {selectedPool === pool.id && (
                                                        <span className="text-green-400">✓</span>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Random Count */}
                            <div className="mb-3">
                                <label className="text-gray-400 text-sm block mb-2">Random Songs (4-6)</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleDecrement}
                                        disabled={randomCount <= minRandom}
                                        className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-bold text-xl"
                                    >
                                        -
                                    </button>
                                    <span className="text-white text-2xl font-bold w-12 text-center">
                                        {randomCount}
                                    </span>
                                    <button
                                        onClick={handleIncrement}
                                        disabled={randomCount >= maxRandom}
                                        className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-bold text-xl"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Fixed Count + Total */}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Fixed: <span className="text-white font-bold">{fixedCount}</span></span>
                                <span className="text-gray-400">Total: <span className="font-bold text-green-400">{totalSongs}</span></span>
                            </div>
                        </div>

                        {/* Locked Tracks Section */}
                        <div className="p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
                            <h3 className="font-bold text-white mb-3">Locked Tracks</h3>

                            {/* Track 3 Combobox */}
                            <div className="mb-3 relative track3-container">
                                <label className="text-gray-400 text-xs block mb-1">Track 3</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={lockedTracks.track3 ? `${lockedTracks.track3.title} (${lockedTracks.track3.diff} ${lockedTracks.track3.lv})` : "Search or select..."}
                                        value={track3Search}
                                        onChange={(e) => setTrack3Search(e.target.value)}
                                        onFocus={() => setShowTrack3Dropdown(true)}
                                        className="w-full px-2 py-1.5 text-sm rounded bg-gray-700 text-white border border-purple-500 outline-none placeholder-gray-400"
                                    />
                                    {lockedTracks.track3 && (
                                        <button
                                            onClick={() => {
                                                onLockedTracksChange({ ...lockedTracks, track3: undefined });
                                                setTrack3Search('');
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {showTrack3Dropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-purple-500 rounded max-h-48 overflow-y-auto shadow-lg">
                                        {track3Options.length === 0 ? (
                                            <div className="p-2 text-gray-400 text-sm text-center">No songs found</div>
                                        ) : (
                                            track3Options.slice(0, 100).map(song => (
                                                <div
                                                    key={song.id}
                                                    onClick={() => {
                                                        onLockedTracksChange({ ...lockedTracks, track3: song });
                                                        setTrack3Search('');
                                                        setShowTrack3Dropdown(false);
                                                    }}
                                                    className="p-2 hover:bg-purple-600 cursor-pointer flex items-center gap-2"
                                                >
                                                    <img src={song.imgUrl} alt={song.title} className="w-8 h-8 rounded object-cover" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-white text-xs truncate">{song.title}</div>
                                                        <div className={`text-xs font-bold ${getDiffColor(song.diff)}`}>
                                                            {song.diff} {song.lv}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Track 4 Combobox */}
                            <div className="relative track4-container">
                                <label className="text-gray-400 text-xs block mb-1">Track 4</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={lockedTracks.track4 ? `${lockedTracks.track4.title} (${lockedTracks.track4.diff} ${lockedTracks.track4.lv})` : "Search or select..."}
                                        value={track4Search}
                                        onChange={(e) => setTrack4Search(e.target.value)}
                                        onFocus={() => setShowTrack4Dropdown(true)}
                                        className="w-full px-2 py-1.5 text-sm rounded bg-gray-700 text-white border border-purple-500 outline-none placeholder-gray-400"
                                    />
                                    {lockedTracks.track4 && (
                                        <button
                                            onClick={() => {
                                                onLockedTracksChange({ ...lockedTracks, track4: undefined });
                                                setTrack4Search('');
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {showTrack4Dropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-purple-500 rounded max-h-48 overflow-y-auto shadow-lg">
                                        {track4Options.length === 0 ? (
                                            <div className="p-2 text-gray-400 text-sm text-center">No songs found</div>
                                        ) : (
                                            track4Options.slice(0, 100).map(song => (
                                                <div
                                                    key={song.id}
                                                    onClick={() => {
                                                        onLockedTracksChange({ ...lockedTracks, track4: song });
                                                        setTrack4Search('');
                                                        setShowTrack4Dropdown(false);
                                                    }}
                                                    className="p-2 hover:bg-purple-600 cursor-pointer flex items-center gap-2"
                                                >
                                                    <img src={song.imgUrl} alt={song.title} className="w-8 h-8 rounded object-cover" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-white text-xs truncate">{song.title}</div>
                                                        <div className={`text-xs font-bold ${getDiffColor(song.diff)}`}>
                                                            {song.diff} {song.lv}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                                Locked tracks won't appear in random/ban/pick pools
                            </p>
                        </div>

                        {/* Song Pool Section */}
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <div className="p-4 bg-purple-600 flex-shrink-0">
                                <h3 className="font-bold text-white">Fixed Song Pool</h3>
                                <p className="text-sm text-white/90">Selected: {fixedSongs.length}</p>
                            </div>

                            {/* Search Box */}
                            <div className="p-3 border-b border-gray-700 bg-gray-900 flex-shrink-0">
                                <input
                                    type="text"
                                    placeholder="Search songs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-purple-500 focus:border-purple-400 outline-none placeholder-gray-400"
                                />
                            </div>

                            {/* Song List */}
                            <div
                                className="flex-1 p-3 space-y-2 bg-gray-900"
                                style={{
                                    overflowY: 'auto',
                                    minHeight: 0
                                }}
                            >
                                {filteredPool.length === 0 ? (
                                    <div className="text-center text-gray-400 py-8">
                                        {searchQuery ? 'No songs found' : 'No songs available'}
                                    </div>
                                ) : (
                                    filteredPool.map((song) => {
                                        const isSelected = fixedSongs.find(s => s.id === song.id);
                                        return (
                                            <div
                                                key={song.id}
                                                onClick={() => toggleSong(song)}
                                                className={`
                                                    p-2 rounded-lg cursor-pointer transition-all duration-150
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

                            {/* Clear All Button */}
                            {fixedSongs.length > 0 && (
                                <div className="p-3 bg-gray-800 border-t border-gray-700">
                                    <button
                                        onClick={() => onFixedSongsChange([])}
                                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                                    >
                                        Deselect All ({fixedSongs.length})
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Toggle Arrow Button - stays with panel */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-white/20 backdrop-blur-sm p-3 rounded-r-lg transition-all hover:bg-white/30 flex-shrink-0"
                    style={{
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                >
                    <svg
                        className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.8)"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
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

export default UnifiedSettingsPanel;
