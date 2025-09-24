'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import Image from 'next/image';
import songData from '../../public/databanpick.json';

console.log('songData loaded:', songData);
console.log('songData length:', songData?.length);

export interface Song {
  imgUrl: string;
  artist: string;
  title: string;
  lv: string;
  diff: string;
  isDx: boolean;
}

export default function Home() {
  console.log('Home component rendering');
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [randomHistory, setRandomHistory] = useState<Song[]>([]);
  const [showStars, setShowStars] = useState(false);
  const [showBanPick, setShowBanPick] = useState(false);
  const [banPickSongs, setBanPickSongs] = useState<Song[]>([]);
  const [finalSongs, setFinalSongs] = useState<Song[]>([]);
  const [animationPhase, setAnimationPhase] = useState<'fast' | 'slow' | 'idle'>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  /* This use effect checks if enough songs are selected to go to ban/pick phase */
  useEffect(() => {
    // Get item with key 'randomHistory' from local storage
    const h = localStorage.getItem('randomHistory');

    // If data exists, parse the JSON string into an array and updates randomHistory
    if (h) {
      const parsed = JSON.parse(h);
      setRandomHistory(parsed);

      // Start ban/pick phase once 6 songs are selected
      if (parsed.length >= 6) {
        startBanPick();
      }
    }
  }, []);
  
  /* This use effect is used for banning and picking songs */
  useEffect(() => {
    // finalSongs is the number of songs that needs banning
    // banPickSongs is the number of songs remaining in the pool
    if (banPickSongs.length <= 3 && finalSongs.length === 0) {
      setFinalSongs(banPickSongs);
    }
  }, [banPickSongs, finalSongs]);

  /* This function runs when the random button is pressed */
  const handleRandom = () => {
    // Start ban pick when random history reaches 6 songs
    if (randomHistory.length >= 6) {
      startBanPick();
      return;
    }

    // Start spinning
    setIsAnimating(true);
    setAnimationPhase('fast');
    setTimeout(() => setAnimationPhase('slow'), 2000);
    
    // What happens when the wheel finishes spinning
    setTimeout(() => {
      // Return animation to idle state
      setAnimationPhase('idle');
      setIsAnimating(false);

      // Pick selected song
      const randomSong = songData[Math.floor(Math.random() * songData.length)];
      setSelectedSong(randomSong);

      // Update random history
      setRandomHistory(prev => {
        const newHistory = [...prev, randomSong];
        localStorage.setItem('randomHistory', JSON.stringify(newHistory));
        return newHistory;
      });

      // Show result
      setShowResult(true);
      setShowStars(true);
      if (audioRef.current) {
        audioRef.current.play();
      }

      // Hide stars after animation
      setTimeout(() => setShowStars(false), 5000);
    }, 3000);
  };

  const startBanPick = () => {
    // Select 6 random songs for ban pick
    const shuffled = [...songData].sort(() => 0.5 - Math.random());
    setBanPickSongs(shuffled.slice(0, 6));
    setShowBanPick(true);
    setShowResult(false);
  };

  /* This function simply removes the song from the pool of selected songs */
  const handleBanPick = (song: Song) => {
    setBanPickSongs(prev => prev.filter(s => s !== song));
  };

  const handleOutsideClick = (event: React.MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
      setShowResult(false);
      setShowStars(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const handleReset = () => {
    localStorage.removeItem('randomHistory');
    setRandomHistory([]);
    setSelectedSong(null);
    setShowResult(false);
    setShowStars(false);
    setShowBanPick(false);
    setBanPickSongs([]);
    setFinalSongs([]);
    setAnimationPhase('idle');
    setShowHistory(false);
    setShowHistoryDetails(false);
  };

  // Create multiple images for the moving row
  const images = Array.from({ length: 20 }, (_, i) => i);

  // This return the HTML code corresponding to whatever is happening above
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-black">
      <div className="relative w-full h-64 overflow-hidden mb-8">
        <div
          className={`absolute inset-0 flex ${isAnimating
              ? animationPhase === 'fast'
                ? 'animate-move-fast-phase'
                : animationPhase === 'slow'
                  ? 'animate-move-slow-phase'
                  : ''
              : 'animate-move-loop'
            }`}>
          {images.map((_, index) => (
            <div key={index} className="flex-shrink-0 w-64 h-64 mx-4">
              <Image
                src="/assets/random.png"
                alt="Random outline"
                width={260}
                height={301}
                className="w-full h-full"
              />
            </div>
          ))}

          {/* Duplicate the images for seamless loop */}
          {images.map((_, index) => (
            <div key={`dup-${index}`} className="flex-shrink-0 w-64 h-64 mx-4">
              <Image
                src="/assets/random.png"
                alt="Random outline"
                width={260}
                height={301}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>

      {!showResult && !showBanPick && (
        <div className="text-center">
          <Button
            color="primary"
            size="lg"
            onPress={handleRandom}
            disabled={isAnimating}
          >
            Random ({randomHistory.length}/6)
          </Button>
          {randomHistory.length > 0 && (
            <p className="text-gray-600 mt-4">
              Random History: {randomHistory.length}/6 songs selected
            </p>
          )}
          <div className="mt-4 flex gap-4 justify-center">
            <Button
              onPress={() => setShowHistoryDetails(!showHistoryDetails)}
              variant="bordered"
            >
              {showHistoryDetails ? 'Hide History' : 'Check History'}
            </Button>
            <Button
              onPress={handleReset}
              color="danger"
            >
              Reset
            </Button>
          </div>
          {showHistoryDetails && randomHistory.length > 0 && (
            <div className="mt-4 max-w-4xl mx-auto">
              <h3 className="text-lg font-bold mb-4">Random History Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {randomHistory.map((song, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 text-center">
                    <Image
                      src={song.imgUrl}
                      alt={song.title}
                      width={100}
                      height={100}
                      className="mx-auto mb-2"
                    />
                    <h4 className="font-bold text-sm">{song.title}</h4>
                    <p className="text-gray-600 text-xs">{song.artist}</p>
                    <p className="text-purple-600 text-xs">{song.lv} {song.diff}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showResult && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={handleOutsideClick}
        >
          {/* Star effects */}
          {showStars && (
            <>
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-star-explosion"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                >
                  ⭐
                </div>
              ))}
              {[...Array(10)].map((_, i) => (
                <div
                  key={`fall-${i}`}
                  className="absolute animate-star-fall text-yellow-400 text-2xl"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                  }}
                >
                  ⭐
                </div>
              ))}
            </>
          )}

          <div
            ref={popupRef}
            className="bg-white p-8 rounded-lg shadow-2xl animate-popup text-center relative z-10"
          >
            <h1 className="text-4xl font-bold mb-2">{selectedSong?.title}</h1>
            <p className="text-xl text-gray-600 mb-4">{selectedSong?.artist}</p>
            <p className="text-lg text-purple-600 mb-4">{selectedSong?.lv} {selectedSong?.diff}</p>
            <Image
              src={selectedSong?.imgUrl || ''}
              alt="Jacket"
              width={256}
              height={256}
              className="mx-auto mb-4"
            />
            <p className="text-gray-600 text-sm mt-4">
              Click outside to close
            </p>
          </div>
        </div>
      )}

      {showBanPick && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Ban Pick Phase</h2>
            <p className="text-center text-gray-600 mb-6">
              Click on songs to ban them ({3 - (6 - banPickSongs.length)} bans remaining)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {banPickSongs.map((song, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-red-500 transition-colors"
                  onClick={() => handleBanPick(song)}
                >
                  <Image
                    src={song.imgUrl}
                    alt={song.title}
                    width={150}
                    height={150}
                    className="mx-auto mb-2"
                  />
                  <h3 className="font-bold text-center">{song.title}</h3>
                  <p className="text-gray-600 text-center text-sm">{song.artist}</p>
                  <p className="text-purple-600 text-center text-sm">{song.lv} {song.diff}</p>
                </div>
              ))}
            </div>
            {finalSongs.length > 0 && (
              <div className="mt-8 p-4 bg-green-50 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-center">Final Selection ({finalSongs.length}/3)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {finalSongs.map((song, index) => (
                    <div key={index} className="text-center">
                      <Image
                        src={song.imgUrl}
                        alt={song.title}
                        width={120}
                        height={120}
                        className="mx-auto mb-2"
                      />
                      <h4 className="font-bold">{song.title}</h4>
                      <p className="text-gray-600 text-sm">{song.artist}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 text-center">
              <Button
                onPress={handleReset}
                color="danger"
                size="lg"
              >
                Reset & Go Back to Random
              </Button>
            </div>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        src="/assets/SSvid.net--Xaleid-scopiX-xi-maimai-でらっくす.mp3"
        preload="auto"
      />
    </div>
  );
}
