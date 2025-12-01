'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import banPickSettings from '../../public/roundBanPickSettings.json';
import { Song, RoundSetting } from './interface';

import QuadRandomSlot from './components/QuadRandomSlot';
import FixedSongSelector from './components/FixedSongSelector';
import BanPickCarousel from './components/BanPickCarousel';

import songData from '../../public/pools/test.json';

export default function Home() {
    const router = useRouter();
    const [roundIndex, setRoundIndex] = useState(0);
    const [banPickSetting] = useState<RoundSetting>(banPickSettings[roundIndex]);

    // Fixed songs selected by user
    const [fixedSongs, setFixedSongs] = useState<Song[]>([]);

    // Random results (4 songs)
    const [randomResults, setRandomResults] = useState<Song[]>([]);

    // Ban/Pick phase states
    const [showBanPick, setShowBanPick] = useState(false);
    const [bannedSongs, setBannedSongs] = useState<Song[]>([]);
    const [pickedSongs, setPickedSongs] = useState<Song[]>([]);

    const handleRandomComplete = useCallback((results: Song[]) => {
        setRandomResults(results);
        // Auto transition to ban/pick after 1 second
        setTimeout(() => {
            setShowBanPick(true);
        }, 1000);
    }, []);

    const handleBanPick = useCallback((song: Song) => {
        const remainingBans = banPickSetting.ban - bannedSongs.length;

        if (remainingBans > 0) {
            // Ban phase
            setBannedSongs(prev => [...prev, song]);
        } else if (pickedSongs.length < banPickSetting.pick) {
            // Pick phase
            setPickedSongs(prev => [...prev, song]);

            // When all picks are done, go to match display
            if (pickedSongs.length + 1 >= banPickSetting.pick) {
                setTimeout(() => {
                    // Save picked songs to localStorage for match-display page
                    localStorage.setItem('matchSongs', JSON.stringify([...pickedSongs, song]));
                    router.push('/match-display');
                }, 500);
            }
        }
    }, [bannedSongs.length, pickedSongs.length, banPickSetting, router, pickedSongs]);

    const handleBan = useCallback((song: Song) => {
        setBannedSongs(prev => [...prev, song]);
    }, []);

    const handlePick = useCallback((song: Song) => {
        setPickedSongs(prev => [...prev, song]);

        // When all picks are done, go to match display
        if (pickedSongs.length + 1 >= banPickSetting.pick) {
            setTimeout(() => {
                localStorage.setItem('matchSongs', JSON.stringify([...pickedSongs, song]));
                router.push('/match-display');
            }, 500);
        }
    }, [pickedSongs, banPickSetting, router]);

    const handleReset = () => {
        setFixedSongs([]);
        setRandomResults([]);
        setShowBanPick(false);
        setBannedSongs([]);
        setPickedSongs([]);
    };

    // Combined pool for ban/pick = random results + fixed songs
    const banPickPool = [...randomResults, ...fixedSongs];

    return (
        <main className="min-h-screen relative">
            {/* Fixed Song Selector (always visible in top right) */}
            {!showBanPick && (
                <FixedSongSelector
                    pool={songData}
                    selectedSongs={fixedSongs}
                    onChange={setFixedSongs}
                />
            )}

            {!showBanPick ? (
                /* Random Phase */
                <QuadRandomSlot
                    pool={songData}
                    fixedSongs={fixedSongs}
                    onRandomComplete={handleRandomComplete}
                />
            ) : (
                /* Ban/Pick Phase */
                <div className="min-h-screen flex flex-col items-center justify-center p-4">
                    <div className="mb-4 text-center">
                        <h2 className="text-2xl font-bold mb-2">
                            {bannedSongs.length < banPickSetting.ban
                                ? `Ban Phase (${bannedSongs.length}/${banPickSetting.ban})`
                                : `Pick Phase (${pickedSongs.length}/${banPickSetting.pick})`
                            }
                        </h2>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                        >
                            Reset
                        </button>
                    </div>

                    <BanPickCarousel
                        songs={banPickPool}
                        onBan={handleBan}
                        onPick={handlePick}
                        bannedSongs={bannedSongs}
                        pickedSongs={pickedSongs}
                        remainingBans={banPickSetting.ban - bannedSongs.length}
                        remainingPicks={banPickSetting.pick - pickedSongs.length}
                        onComplete={() => {
                            // Complete callback if needed
                        }}
                    />

                    {/* Display banned and picked songs */}
                    <div className="mt-8 flex gap-8">
                        <div>
                            <h3 className="font-bold text-red-500 mb-2">Banned ({bannedSongs.length})</h3>
                            <div className="flex gap-2 flex-wrap max-w-md">
                                {bannedSongs.map((song, i) => (
                                    <img
                                        key={i}
                                        src={song.imgUrl}
                                        alt={song.title}
                                        className="w-16 h-16 rounded object-cover opacity-50"
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-green-500 mb-2">Picked ({pickedSongs.length})</h3>
                            <div className="flex gap-2 flex-wrap max-w-md">
                                {pickedSongs.map((song, i) => (
                                    <img
                                        key={i}
                                        src={song.imgUrl}
                                        alt={song.title}
                                        className="w-16 h-16 rounded object-cover"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
