'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Song } from '../interface';

type DisplayAllProps = {
    pool: Song[];
    selectCount?: number;
    selectedPoolId: string;
    poolFile: string;
    onPoolChange: (poolId: string) => void;
    poolOptions: { id: string; name: string }[];
    onAddSong: (song: Song) => void;
    onDeleteSong: (songId: string) => void;
    onEditSong: (song: Song) => void;
};

type SearchTag = { type: 'diff' | 'level'; value: string };

const DIFF_MAP: Record<string, string> = {
    'ex': 'EXPERT', 'expert': 'EXPERT',
    'mas': 'MASTER', 'master': 'MASTER',
    're': 'RE:MASTER', 'remaster': 'RE:MASTER', 're:master': 'RE:MASTER'
};

const DisplayAll: React.FC<DisplayAllProps> = ({
    pool,
    selectCount = 4,
    selectedPoolId,
    poolFile,
    onPoolChange,
    poolOptions,
    onAddSong,
    onDeleteSong,
    onEditSong
}) => {
    const [slots, setSlots] = useState<Song[]>(pool);
    const [inputValue, setInputValue] = useState('');
    const [tags, setTags] = useState<SearchTag[]>([]);
    const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const [showAddSongPopup, setShowAddSongPopup] = useState(false);
    const [showEditSongPopup, setShowEditSongPopup] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);
    const [newSong, setNewSong] = useState<Partial<Song>>({
        title: '',
        artist: '',
        imgUrl: '',
        lv: '13',
        diff: 'MASTER',
        isDx: 'True'
    });
    const selectedSongsRef = useRef<Song[]>([]);
    const preloadedImagesRef = useRef<Set<string>>(new Set());

    // Sync slots with pool prop
    useEffect(() => {
        setSlots(pool);
    }, [pool]);

    // Toggle song selection
    const toggleSongSelection = (songId: string) => {
        setSelectedSongs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(songId)) {
                newSet.delete(songId);
            } else {
                newSet.add(songId);
            }
            return newSet;
        });
    };

    // Export selected songs to pool
    const exportToPool = async () => {
        if (selectedSongs.size === 0) return;

        setIsExporting(true);
        try {
            const songsToExport = slots.filter(song => selectedSongs.has(song.id));

            const response = await fetch('/api/export-pool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songs: songsToExport, filename: 'top32.json' })
            });

            if (response.ok) {
                alert(`Exported ${songsToExport.length} songs to pools/top32.json!`);
            } else {
                alert('Export failed!');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed!');
        } finally {
            setIsExporting(false);
        }
    };

    // Handle adding new song
    const handleAddSong = async () => {
        if (!newSong.title) {
            alert('Title is required!');
            return;
        }

        const songToAdd = {
            title: newSong.title || '',
            artist: newSong.artist || '',
            imgUrl: newSong.imgUrl || '/assets/testjacket.png',
            lv: newSong.lv || '13',
            diff: newSong.diff || 'MASTER',
            isDx: newSong.isDx || 'True'
        };

        try {
            const response = await fetch('/api/add-song', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    song: songToAdd,
                    poolFile: poolFile.replace('/pools/', '')
                })
            });

            const result = await response.json();

            if (result.success) {
                // Add to local state
                onAddSong(result.song);
                setNewSong({ title: '', artist: '', imgUrl: '', lv: '13', diff: 'MASTER', isDx: 'True' });
                setShowAddSongPopup(false);
                alert(`Song added! Total: ${result.totalSongs} songs`);
            } else {
                alert('Failed to add song: ' + result.error);
            }
        } catch (error) {
            console.error('Add song error:', error);
            alert('Failed to add song!');
        }
    };

    // Handle deleting a song
    const handleDeleteSong = async (song: Song) => {
        if (!confirm(`Delete "${song.title}"?`)) return;

        try {
            const response = await fetch('/api/delete-song', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    songId: song.id,
                    poolFile: poolFile.replace('/pools/', '')
                })
            });

            const result = await response.json();

            if (result.success) {
                onDeleteSong(song.id);
                alert(`Deleted! Remaining: ${result.totalSongs} songs`);
            } else {
                alert('Failed to delete: ' + result.error);
            }
        } catch (error) {
            console.error('Delete song error:', error);
            alert('Failed to delete song!');
        }
    };

    // Handle editing a song
    const handleEditSong = async () => {
        if (!editingSong) return;

        try {
            const response = await fetch('/api/edit-song', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    songId: editingSong.id,
                    updatedSong: editingSong,
                    poolFile: poolFile.replace('/pools/', '')
                })
            });

            const result = await response.json();

            if (result.success) {
                onEditSong(result.song);
                setShowEditSongPopup(false);
                setEditingSong(null);
                alert('Song updated!');
            } else {
                alert('Failed to edit: ' + result.error);
            }
        } catch (error) {
            console.error('Edit song error:', error);
            alert('Failed to edit song!');
        }
    };

    // Open edit popup
    const openEditPopup = (song: Song) => {
        setEditingSong({ ...song });
        setShowEditSongPopup(true);
    };

    // Add tag function
    const addTag = (type: 'diff' | 'level', value: string) => {
        if (!tags.some(t => t.type === type && t.value === value)) {
            setTags([...tags, { type, value }]);
        }
    };

    // Remove tag function
    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    // Handle key down for tag detection
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ' || e.key === 'Spacebar') {
            const trimmed = inputValue.trim().toLowerCase();

            // Check difficulty
            if (DIFF_MAP[trimmed]) {
                e.preventDefault();
                addTag('diff', DIFF_MAP[trimmed]);
                setInputValue('');
                return;
            }

            // Check level (1-15, with optional +)
            const levelMatch = trimmed.match(/^(1[0-5]|[1-9])(\+)?$/);
            if (levelMatch) {
                e.preventDefault();
                addTag('level', trimmed.toUpperCase());
                setInputValue('');
                return;
            }
        }
    };

    // Filter songs based on search query and tags
    const filteredSongs = slots.filter(song => {
        // Check text search (title/artist)
        const matchesText = !inputValue.trim() ||
            song.title.toLowerCase().includes(inputValue.toLowerCase()) ||
            song.artist.toLowerCase().includes(inputValue.toLowerCase());

        // Check diff tags
        const diffTags = tags.filter(t => t.type === 'diff');
        const matchesDiff = diffTags.length === 0 ||
            diffTags.some(t => song.diff.toUpperCase() === t.value ||
                (t.value === 'RE:MASTER' && song.diff.toUpperCase() === 'RE:MASTER'));

        // Check level tags
        const levelTags = tags.filter(t => t.type === 'level');
        const matchesLevel = levelTags.length === 0 ||
            levelTags.some(t => song.lv === t.value);

        return matchesText && matchesDiff && matchesLevel;
    });

    // Preload all images from pool on mount
    useEffect(() => {
        pool.forEach(song => {
            if (!preloadedImagesRef.current.has(song.imgUrl)) {
                const img = new Image();
                img.src = song.imgUrl;
                preloadedImagesRef.current.add(song.imgUrl);
            }
        });
    }, [pool]);

    const getDiffColor = (diff: string) => {
        switch (diff) {
            case 'EXPERT':
                return '#fe6069';
            case 'MASTER':
                return '#a352de';
            case 'RE:MASTER':
            case 'Re:MASTER':
                return '#ca97ca';
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

    // Enter key handler
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                // Set select/deselect function here
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [selectCount]);

    // Determine grid columns based on random count
    const gridColumns = 5;

    const scale = 0.75;
    const FRAME_OVERLAY_W = 300;
    const FRAME_OVERLAY_H = 390;
    const FRAME_W = FRAME_OVERLAY_W * 0.61;
    const FRAME_H = FRAME_OVERLAY_H * 0.5;
    const TITLE_FONT_SIZE = 20;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Sticky Search Navbar */}
            <div
                className="sticky top-0 z-50 px-6 pt-10 pb-4"
            >
                <div className="max-w-8/10 mx-auto">
                    <div
                        className="flex flex-wrap items-center gap-2 border border-gray-600 rounded-lg px-3 py-2"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                    >
                        {/* Pool Dropdown */}
                        <select
                            value={selectedPoolId}
                            onChange={(e) => onPoolChange(e.target.value)}
                            className="px-2 py-1 bg-gray-800 text-white border border-gray-600 rounded text-sm cursor-pointer hover:bg-gray-700 transition-colors"
                        >
                            {poolOptions.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>

                        {/* Divider */}
                        <div className="w-px h-6 bg-gray-400"></div>

                        {/* Tags */}
                        {tags.map((tag, index) => (
                            <span
                                key={`${tag.type}-${tag.value}-${index}`}
                                className="flex items-center gap-1 px-2 py-1 rounded text-sm text-white"
                                style={{
                                    backgroundColor: tag.type === 'diff'
                                        ? getDiffColor(tag.value)
                                        : '#2563eb'
                                }}
                            >
                                {tag.value}
                                <button
                                    onClick={() => removeTag(index)}
                                    className="ml-1 hover:text-red-300 font-bold"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        {/* Search Input */}
                        <input
                            type="text"
                            placeholder={tags.length > 0 ? "Add more filters..." : "Search by title, artist, or type 'ex', 'mas', 're', '13+' + Space..."}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 min-w-[200px] bg-transparent text-black focus:outline-none placeholder-gray-400"
                        />
                        {/* Deselect All Button */}
                        {selectedSongs.size > 0 && (
                            <button
                                onClick={() => setSelectedSongs(new Set())}
                                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                            >
                                Deselect All
                            </button>
                        )}
                        {/* Edit Button - show when exactly 1 song selected */}
                        {selectedSongs.size === 1 && (
                            <button
                                onClick={() => {
                                    const selectedId = Array.from(selectedSongs)[0];
                                    const song = slots.find(s => s.id === selectedId);
                                    if (song) openEditPopup(song);
                                }}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                            >
                                Edit
                            </button>
                        )}
                        {/* Delete Button - show when exactly 1 song selected */}
                        {selectedSongs.size === 1 && (
                            <button
                                onClick={() => {
                                    const selectedId = Array.from(selectedSongs)[0];
                                    const song = slots.find(s => s.id === selectedId);
                                    if (song) handleDeleteSong(song);
                                }}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                            >
                                Delete
                            </button>
                        )}
                        {/* Export Button */}
                        <button
                            onClick={exportToPool}
                            disabled={selectedSongs.size === 0 || isExporting}
                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                        >
                            {isExporting ? 'Exporting...' : `Export (${selectedSongs.size})`}
                        </button>
                        {/* Add Song Button */}
                        <button
                            onClick={() => setShowAddSongPopup(true)}
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                        >
                            + Add Song
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid display - 6 columns */}
            <div
                className="grid gap-2 p-4 justify-items-center"
                style={{
                    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                    maxWidth: '1600px',
                    margin: '0 auto',
                    width: '100%'
                }}
            >
                {filteredSongs.map((song, index) => {
                    const isSelected = selectedSongs.has(song.id);
                    return (
                        <div
                            key={`slot-${song.id}-${index}`}
                            className="relative cursor-pointer"
                            onClick={() => toggleSongSelection(song.id)}
                            style={{
                                width: FRAME_OVERLAY_W,
                                height: FRAME_OVERLAY_H,
                                transform: `scale(${scale}) ${isSelected ? 'translateY(-15px)' : ''}`,
                                transition: 'transform 0.2s ease-out'
                            }}
                        >
                            {/* Selection highlight overlay */}
                            {isSelected && (
                                <div
                                    className="absolute inset-0 rounded-lg pointer-events-none"
                                    style={{
                                        backgroundColor: 'rgba(147, 51, 234, 0.25)',
                                        boxShadow: '0 0 25px rgba(147, 51, 234, 0.6), inset 0 0 15px rgba(147, 51, 234, 0.3)',
                                        zIndex: 10,
                                        border: '2px solid rgba(168, 85, 247, 0.8)'
                                    }}
                                />
                            )}
                            
                            {/* Jacket image */}
                            <img
                                src={song.imgUrl}
                                alt={song.title}
                                className="absolute"
                                style={{
                                    width: FRAME_W,
                                    height: FRAME_H,
                                    objectFit: 'cover',
                                    left: '50%',
                                    top: '50%',
                                    transform: `translate(-50%, -50%) translateY(-${FRAME_OVERLAY_H / 13}px)`,
                                    zIndex: 1,
                                    backfaceVisibility: 'hidden',
                                    willChange: 'contents'
                                }}
                            />

                            {/* Frame overlay */}
                            <img
                                src={getFrameImage(song.diff, song.isDx)}
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
                                    bottom: FRAME_OVERLAY_H * 0.235,
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
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color: '#f1f1f1',
                                        textShadow: `
                                        -2px -2px 0 ${getDiffColor(song.diff)}, 
                                        2px -2px 0 ${getDiffColor(song.diff)},
                                        -2px 2px 0 ${getDiffColor(song.diff)},
                                        2px 2px 0 ${getDiffColor(song.diff)},
                                        -3px 0px 0 ${getDiffColor(song.diff)},
                                        3px 0px 0 ${getDiffColor(song.diff)},
                                        0px -3px 0 ${getDiffColor(song.diff)},
                                        0px 3px 0 ${getDiffColor(song.diff)}
                                        `,
                                        letterSpacing: '1px'
                                    }}
                                >
                                    {song.diff}
                                </div>
                                <div
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color: '#f1f1f1',
                                        textShadow: `
                                        -2px -2px 0 ${getDiffColor(song.diff)}, 
                                        2px -2px 0 ${getDiffColor(song.diff)},
                                        -2px 2px 0 ${getDiffColor(song.diff)},
                                        2px 2px 0 ${getDiffColor(song.diff)},
                                        -3px 0px 0 ${getDiffColor(song.diff)},
                                        3px 0px 0 ${getDiffColor(song.diff)},
                                        0px -3px 0 ${getDiffColor(song.diff)},
                                        0px 3px 0 ${getDiffColor(song.diff)}
                                        `,
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    {song.lv}
                                </div>
                            </div>

                            {/* Title */}
                            <div
                                className="absolute"
                                style={{
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    bottom: FRAME_OVERLAY_H * 0.14,
                                    width: FRAME_OVERLAY_W * 0.72,
                                    textAlign: 'center',
                                    zIndex: 4,
                                    pointerEvents: 'none',
                                    overflow: 'hidden',
                                    clipPath: 'inset(0)',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: `${TITLE_FONT_SIZE}`,
                                        color: '#000',
                                        whiteSpace: 'nowrap',
                                        animation: song.title.length > 20 ? 'marquee 15s linear infinite' : 'none',
                                        display: 'inline-block'
                                    }}

                                >
                                    {song.title}
                                </div>
                            </div>

                            {/* Artist */}
                            <div
                                className="absolute"
                                style={{
                                    left: '51%',
                                    transform: 'translateX(-50%)',
                                    bottom: FRAME_OVERLAY_H * 0.05,
                                    width: FRAME_OVERLAY_W * 0.73,
                                    textAlign: 'center',
                                    zIndex: 4,
                                    pointerEvents: 'none',
                                    overflow: 'hidden',
                                    clipPath: 'inset(0)',
                                    height: `${TITLE_FONT_SIZE}px`,
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
                                        animation: song.artist.length > 20 ? 'marquee 18s linear infinite' : 'none',
                                        display: 'inline-block'
                                    }}
                                >
                                    {song.artist}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Song Popup */}
            {showAddSongPopup && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                    onClick={() => setShowAddSongPopup(false)}
                >
                    <div
                        className="bg-gray-800 rounded-xl p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Add New Song</h2>

                        <div className="space-y-3">
                            {/* Title */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={newSong.title}
                                    onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                                    placeholder="Song title"
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Artist */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Artist</label>
                                <input
                                    type="text"
                                    value={newSong.artist}
                                    onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                                    placeholder="Artist name"
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Image URL (optional)</label>
                                <input
                                    type="text"
                                    value={newSong.imgUrl}
                                    onChange={(e) => setNewSong({ ...newSong, imgUrl: e.target.value })}
                                    placeholder="Leave empty for default image"
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Default: /assets/testjacket.png</p>
                            </div>

                            {/* Level & Difficulty Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Level</label>
                                    <input
                                        type="text"
                                        value={newSong.lv}
                                        onChange={(e) => setNewSong({ ...newSong, lv: e.target.value })}
                                        placeholder="13+"
                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Difficulty</label>
                                    <select
                                        value={newSong.diff}
                                        onChange={(e) => setNewSong({ ...newSong, diff: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="EXPERT">EXPERT</option>
                                        <option value="MASTER">MASTER</option>
                                        <option value="RE:MASTER">RE:MASTER</option>
                                    </select>
                                </div>
                            </div>

                            {/* Chart Type */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Chart Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-white">
                                        <input
                                            type="radio"
                                            checked={newSong.isDx === 'True'}
                                            onChange={() => setNewSong({ ...newSong, isDx: 'True' })}
                                            className="text-purple-500"
                                        />
                                        DX
                                    </label>
                                    <label className="flex items-center gap-2 text-white">
                                        <input
                                            type="radio"
                                            checked={newSong.isDx === 'False'}
                                            onChange={() => setNewSong({ ...newSong, isDx: 'False' })}
                                            className="text-purple-500"
                                        />
                                        Standard
                                    </label>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                                <img
                                    src={newSong.imgUrl || '/assets/testjacket.png'}
                                    alt="preview"
                                    className="w-12 h-12 rounded object-cover"
                                    onError={(e) => (e.target as HTMLImageElement).src = '/assets/testjacket.png'}
                                />
                                <div>
                                    <p className="text-white text-sm">{newSong.title || 'Title'}</p>
                                    <p className="text-gray-400 text-xs">{newSong.artist || 'Artist'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddSongPopup(false)}
                                className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSong}
                                className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors"
                            >
                                Add Song
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Song Popup */}
            {showEditSongPopup && editingSong && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                    onClick={() => {
                        setShowEditSongPopup(false);
                        setEditingSong(null);
                    }}
                >
                    <div
                        className="bg-gray-800 rounded-xl p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Edit Song</h2>

                        <div className="space-y-3">
                            {/* Title */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={editingSong.title}
                                    onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                                    placeholder="Song title"
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Artist */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Artist</label>
                                <input
                                    type="text"
                                    value={editingSong.artist}
                                    onChange={(e) => setEditingSong({ ...editingSong, artist: e.target.value })}
                                    placeholder="Artist name"
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Image URL (optional)</label>
                                <input
                                    type="text"
                                    value={editingSong.imgUrl}
                                    onChange={(e) => setEditingSong({ ...editingSong, imgUrl: e.target.value })}
                                    placeholder="Leave empty for default image"
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Level & Difficulty Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Level</label>
                                    <input
                                        type="text"
                                        value={editingSong.lv}
                                        onChange={(e) => setEditingSong({ ...editingSong, lv: e.target.value })}
                                        placeholder="13+"
                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Difficulty</label>
                                    <select
                                        value={editingSong.diff}
                                        onChange={(e) => setEditingSong({ ...editingSong, diff: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="EXPERT">EXPERT</option>
                                        <option value="MASTER">MASTER</option>
                                        <option value="RE:MASTER">RE:MASTER</option>
                                    </select>
                                </div>
                            </div>

                            {/* Chart Type */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Chart Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-white">
                                        <input
                                            type="radio"
                                            checked={editingSong.isDx === 'True'}
                                            onChange={() => setEditingSong({ ...editingSong, isDx: 'True' })}
                                            className="text-blue-500"
                                        />
                                        DX
                                    </label>
                                    <label className="flex items-center gap-2 text-white">
                                        <input
                                            type="radio"
                                            checked={editingSong.isDx === 'False'}
                                            onChange={() => setEditingSong({ ...editingSong, isDx: 'False' })}
                                            className="text-blue-500"
                                        />
                                        Standard
                                    </label>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                                <img
                                    src={editingSong.imgUrl || '/assets/testjacket.png'}
                                    alt="preview"
                                    className="w-12 h-12 rounded object-cover"
                                    onError={(e) => (e.target as HTMLImageElement).src = '/assets/testjacket.png'}
                                />
                                <div>
                                    <p className="text-white text-sm">{editingSong.title || 'Title'}</p>
                                    <p className="text-gray-400 text-xs">{editingSong.artist || 'Artist'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowEditSongPopup(false);
                                    setEditingSong(null);
                                }}
                                className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSong}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisplayAll;
