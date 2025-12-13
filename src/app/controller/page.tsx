'use client';

import { useState, useEffect, useRef } from 'react';
import { Song } from '../interface';

// Pool file mapping
const POOL_FILES: Record<string, string> = {
    newbieQual1: '/pools/N1 - newbieQual1.json',
    newbieQual2: '/pools/N2 - newbieQual2.json',
    newbieSemi: '/pools/N3 - newbieSemi.json',
    newbieFinals: '/pools/N4 - newbieFinals.json',
    proQual: '/pools/P1 - proTop3216.json',
    proTop8: '/pools/P2 - proTop8.json',
    proSemi: '/pools/P3 - proSemi.json',
    proFinals: '/pools/P4 - proFinals.json',
    top32: '/pools/top32.json',
};

// Available pools
const POOL_OPTIONS = [
    { id: 'newbieQual1', name: 'Bảng dưới - Vòng loại 1', file: 'N1 - newbieQual1.json' },
    { id: 'newbieQual2', name: 'Bảng dưới - Vòng loại 2', file: 'N2 - newbieQual2.json' },
    { id: 'newbieSemi', name: 'Bảng dưới - Bán kết', file: 'N3 - newbieSemi.json' },
    { id: 'newbieFinals', name: 'Bảng dưới - Chung kết', file: 'N4 - newbieFinals.json' },
    { id: 'proQual', name: 'Bảng trên - Vòng 32 và 16', file: 'P1 - proTop3216.json' },
    { id: 'proTop8', name: 'Bảng trên - Vòng 8', file: 'P2 - proTop8.json' },
    { id: 'proSemi', name: 'Bảng trên - Bán kết', file: 'P3 - proSemi.json' },
    { id: 'proFinals', name: 'Bảng trên - Chung kết', file: 'P4 - proFinals.json' },
    { id: 'top32', name: 'Top 32 (Custom)', file: 'top32.json' },
];

// Helper to ensure songs have id field
const ensureIds = (songs: any[]): Song[] => {
    return songs.map((song, index) => ({
        ...song,
        id: song.id || `${song.title}-${song.diff}-${index}`,
        isDx: String(song.isDx)
    }));
};

export default function ControllerPage() {
    // Settings state
    const [selectedPool, setSelectedPool] = useState('newbieSemi');
    const [songData, setSongData] = useState<Song[]>([]);
    const [isLoadingPool, setIsLoadingPool] = useState(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [randomCount, setRandomCount] = useState(4);
    const [pickCount, setPickCount] = useState(2);
    const [banCount, setBanCount] = useState(0);
    const [fixedSongs, setFixedSongs] = useState<Song[]>([]);
    const [lockedTracks, setLockedTracks] = useState<{ track3?: Song; track4?: Song }>({});
    const [hiddenTracks, setHiddenTracks] = useState<{ track3Hidden: boolean; track4Hidden: boolean }>({
        track3Hidden: false,
        track4Hidden: false
    });

    // UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [poolSearch, setPoolSearch] = useState('');
    const [showPoolDropdown, setShowPoolDropdown] = useState(false);
    const [track3Search, setTrack3Search] = useState('');
    const [track4Search, setTrack4Search] = useState('');
    const [showTrack3Dropdown, setShowTrack3Dropdown] = useState(false);
    const [showTrack4Dropdown, setShowTrack4Dropdown] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedPool = localStorage.getItem('selectedPool');
        const savedRandomCount = localStorage.getItem('randomCount');
        const savedPickCount = localStorage.getItem('pickCount');
        const savedBanCount = localStorage.getItem('banCount');
        const savedFixedSongs = localStorage.getItem('fixedSongs');
        const savedLockedTracks = localStorage.getItem('lockedTracks');
        const savedHiddenTracks = localStorage.getItem('hiddenTracks');

        if (savedPool && POOL_FILES[savedPool]) {
            setSelectedPool(savedPool);
        }
        if (savedRandomCount) setRandomCount(parseInt(savedRandomCount));
        if (savedPickCount) setPickCount(parseInt(savedPickCount));
        if (savedBanCount) setBanCount(parseInt(savedBanCount));
        if (savedFixedSongs) setFixedSongs(JSON.parse(savedFixedSongs));
        if (savedLockedTracks) setLockedTracks(JSON.parse(savedLockedTracks));
        if (savedHiddenTracks) setHiddenTracks(JSON.parse(savedHiddenTracks));
    }, []);

    // Save all settings to localStorage and dispatch event
    const saveSettings = () => {
        localStorage.setItem('selectedPool', selectedPool);
        localStorage.setItem('randomCount', String(randomCount));
        localStorage.setItem('pickCount', String(pickCount));
        localStorage.setItem('banCount', String(banCount));
        localStorage.setItem('fixedSongs', JSON.stringify(fixedSongs));
        localStorage.setItem('lockedTracks', JSON.stringify(lockedTracks));
        localStorage.setItem('hiddenTracks', JSON.stringify(hiddenTracks));

        // Dispatch storage event for other tabs/windows
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'controllerSettings',
            newValue: Date.now().toString()
        }));
    };

    // Auto-save when settings change
    useEffect(() => {
        saveSettings();
    }, [selectedPool, randomCount, pickCount, banCount, fixedSongs, lockedTracks, hiddenTracks]);

    // Load pool data when selected pool changes
    useEffect(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const loadPool = async () => {
            setIsLoadingPool(true);
            const poolFile = POOL_FILES[selectedPool];

            if (!poolFile) {
                console.error('Unknown pool:', selectedPool);
                setSelectedPool('newbieSemi');
                return;
            }

            try {
                const res = await fetch(`${poolFile}?t=${Date.now()}`, {
                    signal: abortController.signal,
                    cache: 'no-store'
                });

                if (!res.ok) {
                    throw new Error(`Failed to load ${poolFile}`);
                }

                const data = await res.json();

                if (!abortController.signal.aborted) {
                    setSongData(ensureIds(data));
                }
            } catch (error: any) {
                if (error.name === 'AbortError') return;
                console.error('Error loading pool:', error);
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoadingPool(false);
                }
            }
        };

        loadPool();

        return () => {
            abortController.abort();
        };
    }, [selectedPool]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
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
            setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 0);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showTrack3Dropdown, showTrack4Dropdown, showPoolDropdown]);

    const handlePoolChange = (poolId: string) => {
        setSelectedPool(poolId);
        // Reset selections when pool changes
        setFixedSongs([]);
        setLockedTracks({});
        setShowPoolDropdown(false);
        setPoolSearch('');
    };

    // Settings limits
    const maxRandom = 6;
    const minRandom = 2;
    const maxPick = 4;
    const minPick = 2;
    const fixedCount = fixedSongs.length;
    const totalSongs = randomCount + fixedCount;

    const handleRandomIncrement = () => {
        if (randomCount < maxRandom) setRandomCount(randomCount + 1);
    };

    const handleRandomDecrement = () => {
        if (randomCount > minRandom) setRandomCount(randomCount - 1);
    };

    const handlePickIncrement = () => {
        if (pickCount < maxPick && pickCount + banCount < totalSongs) {
            setPickCount(pickCount + 1);
        }
    };

    const handlePickDecrement = () => {
        if (pickCount > minPick) setPickCount(pickCount - 1);
    };

    const handleBanIncrement = () => {
        if (pickCount + banCount < totalSongs) {
            setBanCount(banCount + 1);
        }
    };

    const handleBanDecrement = () => {
        if (banCount > 0) setBanCount(banCount - 1);
    };

    const toggleSong = (song: Song) => {
        const isSelected = fixedSongs.find(s => s.id === song.id);
        if (isSelected) {
            setFixedSongs(fixedSongs.filter(s => s.id !== song.id));
        } else {
            setFixedSongs([...fixedSongs, song]);
        }
    };

    const getDiffColor = (diff: string) => {
        switch (diff) {
            case 'EXPERT': return 'text-red-400';
            case 'MASTER': return 'text-purple-400';
            case 'RE:MASTER':
            case 'Re:MASTER': return 'text-pink-400';
            default: return 'text-purple-300';
        }
    };

    // Filter out locked tracks from available pool
    const availablePool = songData.filter(song =>
        song.id !== lockedTracks.track3?.id &&
        song.id !== lockedTracks.track4?.id
    );

    // Filter pools for locked track dropdowns
    const track3Options = songData
        .filter(s => s.id !== lockedTracks.track4?.id)
        .filter(s =>
            s.title.toLowerCase().includes(track3Search.toLowerCase()) ||
            s.artist.toLowerCase().includes(track3Search.toLowerCase()) ||
            s.diff.toLowerCase().includes(track3Search.toLowerCase())
        );

    const track4Options = songData
        .filter(s => s.id !== lockedTracks.track3?.id)
        .filter(s =>
            s.title.toLowerCase().includes(track4Search.toLowerCase()) ||
            s.artist.toLowerCase().includes(track4Search.toLowerCase()) ||
            s.diff.toLowerCase().includes(track4Search.toLowerCase())
        );

    // Sort: selected songs first, then filter by search
    const filteredPool = availablePool
        .filter(song =>
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const aSelected = fixedSongs.some(s => s.id === a.id);
            const bSelected = fixedSongs.some(s => s.id === b.id);
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return 0;
        });

    const filteredPools = POOL_OPTIONS.filter(p =>
        p.name.toLowerCase().includes(poolSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(poolSearch.toLowerCase())
    );

    const handleReset = () => {
        setFixedSongs([]);
        setRandomCount(4);
        setPickCount(2);
        setBanCount(0);
        setLockedTracks({});
        setHiddenTracks({ track3Hidden: false, track4Hidden: false });
    };

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">
                    Controller Panel
                </h1>

                <div className="grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Pool Selection */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h2 className="text-lg font-semibold text-white mb-3">Pool Selection</h2>
                            <div className="pool-container relative">
                                <input
                                    type="text"
                                    value={showPoolDropdown ? poolSearch : (POOL_OPTIONS.find(p => p.id === selectedPool)?.name || '')}
                                    placeholder="Search pool..."
                                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                    onFocus={() => {
                                        setShowPoolDropdown(true);
                                        setPoolSearch('');
                                    }}
                                    onChange={(e) => setPoolSearch(e.target.value)}
                                />
                                {showPoolDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {filteredPools.map((pool) => (
                                            <div
                                                key={pool.id}
                                                className={`px-4 py-2 cursor-pointer hover:bg-purple-600 ${selectedPool === pool.id ? 'bg-purple-600' : ''}`}
                                                onClick={() => handlePoolChange(pool.id)}
                                            >
                                                <span className="text-white">{pool.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {isLoadingPool && (
                                <p className="text-yellow-400 text-sm mt-2">Loading pool...</p>
                            )}
                            <p className="text-gray-400 text-sm mt-2">
                                {songData.length} songs in pool
                            </p>
                        </div>

                        {/* Game Settings */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h2 className="text-lg font-semibold text-white mb-3">Game Settings</h2>
                            <div className="grid grid-cols-3 gap-4">
                                {/* Random Count */}
                                <div className="text-center">
                                    <p className="text-gray-300 text-sm mb-2">Random</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={handleRandomDecrement}
                                            disabled={randomCount <= minRandom}
                                            className="w-8 h-8 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 rounded-lg text-white font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="text-2xl font-bold text-white w-6">{randomCount}</span>
                                        <button
                                            onClick={handleRandomIncrement}
                                            disabled={randomCount >= maxRandom}
                                            className="w-8 h-8 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 rounded-lg text-white font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Pick Count */}
                                <div className="text-center">
                                    <p className="text-gray-300 text-sm mb-2">Pick</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={handlePickDecrement}
                                            disabled={pickCount <= minPick}
                                            className="w-8 h-8 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded-lg text-white font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="text-2xl font-bold text-white w-6">{pickCount}</span>
                                        <button
                                            onClick={handlePickIncrement}
                                            disabled={pickCount >= maxPick || pickCount + banCount >= totalSongs}
                                            className="w-8 h-8 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded-lg text-white font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Ban Count */}
                                <div className="text-center">
                                    <p className="text-gray-300 text-sm mb-2">Ban</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={handleBanDecrement}
                                            disabled={banCount <= 0}
                                            className="w-8 h-8 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded-lg text-white font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="text-2xl font-bold text-white w-6">{banCount}</span>
                                        <button
                                            onClick={handleBanIncrement}
                                            disabled={pickCount + banCount >= totalSongs}
                                            className="w-8 h-8 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded-lg text-white font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm mt-4 text-center">
                                Total: {totalSongs} (Random: {randomCount} + Fixed: {fixedCount})
                            </p>
                        </div>

                        {/* Locked Tracks */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h2 className="text-lg font-semibold text-white mb-3">Locked Tracks</h2>
                            <div className="space-y-4">
                                {/* Track 3 */}
                                <div className="track3-container relative">
                                    <p className="text-gray-300 text-sm mb-2">Track 3</p>
                                    <input
                                        type="text"
                                        value={showTrack3Dropdown ? track3Search : (lockedTracks.track3?.title || '')}
                                        placeholder="Select song..."
                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                        onFocus={() => {
                                            setShowTrack3Dropdown(true);
                                            setTrack3Search('');
                                        }}
                                        onChange={(e) => setTrack3Search(e.target.value)}
                                    />
                                    {showTrack3Dropdown && (
                                        <div className="absolute z-50 left-0 right-0 mt-1 bg-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            <div
                                                className="px-3 py-2 cursor-pointer hover:bg-red-600 text-gray-400 flex items-center gap-2"
                                                onClick={() => {
                                                    setLockedTracks({ ...lockedTracks, track3: undefined });
                                                    setShowTrack3Dropdown(false);
                                                }}
                                            >
                                                <span className="text-red-400">✕</span> Clear selection
                                            </div>
                                            {track3Options.slice(0, 20).map((song) => (
                                                <div
                                                    key={song.id}
                                                    className={`px-3 py-2 cursor-pointer hover:bg-purple-600 flex items-center gap-2 ${lockedTracks.track3?.id === song.id ? 'bg-purple-600' : ''}`}
                                                    onClick={() => {
                                                        setLockedTracks({ ...lockedTracks, track3: song });
                                                        setShowTrack3Dropdown(false);
                                                        setTrack3Search('');
                                                    }}
                                                >
                                                    <img src={song.imgUrl} alt="" className="w-8 h-8 rounded object-cover" />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-white text-sm truncate block">{song.title}</span>
                                                        <span className={`text-xs ${getDiffColor(song.diff)}`}>{song.diff} {song.lv}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {lockedTracks.track3 && (
                                        <label className="flex items-center gap-2 mt-2 text-sm text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={hiddenTracks.track3Hidden}
                                                onChange={(e) => setHiddenTracks({ ...hiddenTracks, track3Hidden: e.target.checked })}
                                                className="rounded"
                                            />
                                            Hidden track
                                        </label>
                                    )}
                                </div>

                                {/* Track 4 */}
                                <div className="track4-container relative">
                                    <p className="text-gray-300 text-sm mb-2">Track 4</p>
                                    <input
                                        type="text"
                                        value={showTrack4Dropdown ? track4Search : (lockedTracks.track4?.title || '')}
                                        placeholder="Select song..."
                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                        onFocus={() => {
                                            setShowTrack4Dropdown(true);
                                            setTrack4Search('');
                                        }}
                                        onChange={(e) => setTrack4Search(e.target.value)}
                                    />
                                    {showTrack4Dropdown && (
                                        <div className="absolute z-50 left-0 right-0 mt-1 bg-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            <div
                                                className="px-3 py-2 cursor-pointer hover:bg-red-600 text-gray-400 flex items-center gap-2"
                                                onClick={() => {
                                                    setLockedTracks({ ...lockedTracks, track4: undefined });
                                                    setShowTrack4Dropdown(false);
                                                }}
                                            >
                                                <span className="text-red-400">✕</span> Clear selection
                                            </div>
                                            {track4Options.slice(0, 20).map((song) => (
                                                <div
                                                    key={song.id}
                                                    className={`px-3 py-2 cursor-pointer hover:bg-purple-600 flex items-center gap-2 ${lockedTracks.track4?.id === song.id ? 'bg-purple-600' : ''}`}
                                                    onClick={() => {
                                                        setLockedTracks({ ...lockedTracks, track4: song });
                                                        setShowTrack4Dropdown(false);
                                                        setTrack4Search('');
                                                    }}
                                                >
                                                    <img src={song.imgUrl} alt="" className="w-8 h-8 rounded object-cover" />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-white text-sm truncate block">{song.title}</span>
                                                        <span className={`text-xs ${getDiffColor(song.diff)}`}>{song.diff} {song.lv}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {lockedTracks.track4 && (
                                        <label className="flex items-center gap-2 mt-2 text-sm text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={hiddenTracks.track4Hidden}
                                                onChange={(e) => setHiddenTracks({ ...hiddenTracks, track4Hidden: e.target.checked })}
                                                className="rounded"
                                            />
                                            Hidden track
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={handleReset}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
                        >
                            Reset All Settings
                        </button>
                    </div>

                    {/* Right Column - Fixed Songs */}
                    <div className="bg-gray-800 rounded-xl p-4 h-fit">
                        <h2 className="text-lg font-semibold text-white mb-3">Fixed Songs ({fixedSongs.length})</h2>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search songs..."
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                        />
                        <div className="max-h-[500px] overflow-y-auto space-y-1">
                            {filteredPool.slice(0, 100).map((song) => {
                                const isSelected = fixedSongs.some(s => s.id === song.id);
                                return (
                                    <div
                                        key={song.id}
                                        className={`px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${isSelected ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
                                        onClick={() => toggleSong(song)}
                                    >
                                        <img src={song.imgUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-white text-sm truncate block">{song.title}</span>
                                            <span className={`text-xs ${getDiffColor(song.diff)}`}>
                                                {song.diff} {song.lv}
                                            </span>
                                        </div>
                                        {isSelected && <span className="text-green-400 flex-shrink-0">✓</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="text-center text-gray-400 text-sm mt-6">
                    <p>Made by PXT with luv &lt;3 (and chatgbt). Ofc Shard and Necros1s also</p>
                </div>
            </div>
        </div>
    );
}
