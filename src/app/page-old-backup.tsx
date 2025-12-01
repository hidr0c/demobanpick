'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import Image from 'next/image';
import banPickSettings from '../../public/roundBanPickSettings.json';
import { Song, RoundSetting } from './interface';

import EmblaCarousel from './embla-carousel/EmblaCarousel';
import BanPickCarousel from './components/BanPickCarousel';
import './css/embla.css'

import songData from '../../public/pools/test.json';

export default function Home() {
  const [roundIndex, setRoundIndex] = useState(0); // 0 is newbie semi, 1 is newbie final, 2 is pro top 8, 3 is pro semi, 4 is pro final
  const preSelectedSongs = useMemo(() =>
    songData.filter(song => ['7', '8', '13'].includes(song.id))
    , []);

  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [randomHistory, setRandomHistory] = useState<Song[]>([]);
  const [showStars, setShowStars] = useState(false);
  const [showBanPick, setShowBanPick] = useState(false);
  const [banPickSongs, setBanPickSongs] = useState<Song[]>([]);
  const [finalSongs, setFinalSongs] = useState<Song[]>([]);
  const [banPickSetting, setBanPickSetting] = useState<RoundSetting>(banPickSettings[roundIndex]);
  const [animationPhase, setAnimationPhase] = useState<'fast' | 'slow' | 'idle'>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isCarouselReady, setIsCarouselReady] = useState(false);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [randomResults, setRandomResults] = useState<Song[]>([]);
  const [showRandomPopup, setShowRandomPopup] = useState(false);
  const [bannedSongs, setBannedSongs] = useState<Song[]>([]);
  const [showFinalOnly, setShowFinalOnly] = useState(false);
  const [isRandomAnimating, setIsRandomAnimating] = useState(false);
  const hasRestoredRef = useRef(false);
  const [showBanPickButton, setShowBanPickButton] = useState(false);

  // 3D Carousel state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [cellCount, setCellCount] = useState(songData.length * 2);
  const [cellWidth] = useState(240);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHorizontal] = useState(true);
  const [radius, setRadius] = useState(0);
  const [theta, setTheta] = useState(0);
  const [isIdleAnimating, setIsIdleAnimating] = useState(false);
  const idleAnimationRef = useRef<number | null>(null);
  const targetIndexRef = useRef<number | null>(null);
  const currentRotationRef = useRef(0);
  const rotateFn = isHorizontal ? 'rotateY' : 'rotateX';

  // Options for embla-carousel
  const OPTIONS = { loop: true };
  const SLIDE_COUNT = songData?.length
  const SLIDES = songData;

  // Callback to sync Embla carousel index with our state
  const handleSlideChange = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  // Difficulty color - memoize to avoid recreating on every render
  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case 'EXPERT':
        return '#ef4444';
      case 'MASTER':
        return '#9333ea';
      case 'RE:MASTER':
        return '#ec4899';
      default:
        return '#a855f7';
    }
  }, []);

  const handleRandomComplete = useCallback((song: Song) => {
    setIsRandomAnimating(false);
    if (randomHistory.length < banPickSetting.random) {
      setRandomResults(prev => [...prev, song]);
      setSelectedSong(song);
      setShowRandomPopup(true);
    }
  }, [randomHistory.length]);

  const handleBanPick = useCallback((song: Song) => {
    const remainingBans = banPickSetting.ban - bannedSongs.length;

    if (remainingBans > 0) {
      setBannedSongs(prev => [...prev, song]);
    } else if (finalSongs.length < banPickSetting.pick) {
      setFinalSongs(prev => [...prev, song]);
    }
  }, [bannedSongs.length, finalSongs.length, banPickSetting.ban, banPickSetting.pick]);

  const handleReset = useCallback(() => {
    localStorage.removeItem('randomHistory');
    hasRestoredRef.current = false;
    setIsInitialLoad(true);
    setRandomHistory([]);
    setSelectedSong(null);
    setShowResult(false);
    setShowStars(false);
    setShowBanPick(false);
    setShowBanPickButton(false);
    setBanPickSongs([]);
    setFinalSongs([]);
    setBannedSongs([]);
    setShowFinalOnly(false);
    setAnimationPhase('idle');
    setShowHistory(false);
    setShowHistoryDetails(false);
    setRandomResults([]);
    setShowRandomPopup(false);
    setTimeout(() => {
      hasRestoredRef.current = true;
      setIsInitialLoad(false);
    }, 0);
  }, []);  

  const handleOutsideClick = (event: React.MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
      setShowResult(false);
      setShowStars(false);
      // Restart idle animation after popup closes
      // setTimeout(startIdleAnimation, 500);
    }
  };

  // handleReset moved to top with other handlers

  const handleRemoveHistory = (index: number) => {
    setRandomHistory(prev => {
      const removed = prev[index];
      const newArr = prev.filter((_, i) => i !== index);
      localStorage.setItem('randomHistory', JSON.stringify(newArr));

      // Remove from ban/pick lists if present
      if (removed) {
        setBanPickSongs(bp => bp.filter(s => !(s.title === removed.title && s.diff === removed.diff)));
        setFinalSongs(f => f.filter(s => !(s.title === removed.title && s.diff === removed.diff)));

        // If the removed song was currently shown in popup, close it
        if (selectedSong && selectedSong.title === removed.title && selectedSong.diff === removed.diff) {
          setShowRandomPopup(false);
          setSelectedSong(null);
        }

        // If history drop below required total, hide ban/pick modal
        if (newArr.length < (banPickSetting.totalBanPick ?? 0)) {
          setShowBanPick(false);
        }
      }

      return newArr;
    });
  };

  useEffect(() => {
    const h = localStorage.getItem('randomHistory');
    
    if (h) {
      const parsed = JSON.parse(h);
      setRandomHistory(parsed);
    }

    hasRestoredRef.current = true;
    setTimeout(() => setIsInitialLoad(false), 0);
  }, []);

  // persist history whenever it changes
  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem('randomHistory', JSON.stringify(randomHistory));
    }
  }, [randomHistory]);
 
  const handlePopupContinue = useCallback(() => {
    // add selectedSong to history (avoid duplicates by title+diff)
    if (selectedSong) {
      setRandomHistory(prev => {
        const exists = prev.some(s => s.title === selectedSong.title && s.diff === selectedSong.diff && s.lv === selectedSong.lv);
        const newArr = exists ? prev : [...prev, selectedSong];
        localStorage.setItem('randomHistory', JSON.stringify(newArr));
        return newArr;
      });
    }

    setShowRandomPopup(false);

    if (randomHistory.length + 1 >= banPickSetting.random) {
        setShowBanPickButton(true);
      // Only include randomly selected songs (exclude preSelectedSongs)
      const allSongs = [...randomResults, selectedSong]
        .filter((s): s is Song => s !== null && s !== undefined)
        .filter((s, i, arr) => 
          arr.findIndex(x => x.title === s.title && x.diff === s.diff && x.isDx === s.isDx) === i
        );
      setBanPickSongs(allSongs);
    }
  }, [randomHistory.length, randomResults, preSelectedSongs, selectedSong, banPickSetting.random]);
  // Spacebar keybind + Enter to close popup
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && showBanPick) {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'Enter' && showRandomPopup) {
        e.preventDefault();
        handlePopupContinue();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showBanPick, showRandomPopup, handleReset, handlePopupContinue]);

  // Create multiple images for the moving row
  const images = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-black" >
      {!showResult && !showBanPick && (
        <div className="w-full flex flex-col items-center justify-center" style={{ minHeight: '110vh' }}>

          {randomHistory.length < banPickSetting.random && (
            <div className="mb-12 text-center" style={{ marginTop: '-120px' }}>
              <h2 className="text-3xl font-bold mb-2">Random Round {randomHistory.length + 1} / {banPickSetting.random} </h2>
              <p className="text-gray-600 text-lg">Spin to select a song</p>
            </div>
          )}

          <div className="w-full flex justify-center mt-8">
            <EmblaCarousel
              slides={SLIDES}
              options={OPTIONS}
              onSlideChange={handleSlideChange}
              onRandomComplete={handleRandomComplete}
              onRandomStart={() => setIsRandomAnimating(true)}
              disabled={randomHistory.length >= banPickSetting.random || isRandomAnimating}
              isIdleEnabled={false}
              showPopup={showRandomPopup}
            />
          </div>

          {/* Carousel ở trên, căn giữa */}
          { /* <div className="w-full flex justify-center mt-8">
            <div 
              className="scene mb-8" 
              style={{ 
                perspective: '1000px', 
                width: `${cellWidth}px`,
                height: `${cellWidth}px`, 
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'center', 
                }}
            >
              <div
                ref={carouselRef}                
                className={`carousel ${isCarouselReady ? (isAnimating ? 'animating-fast' : isIdleAnimating ? 'animating-idle' : '') : 'no-transition'}`}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  transformStyle: 'preserve-3d'
                }}
              >
                {Array.from({ length: cellCount }).map((_, i) => {
                  const song = songData[i % songData.length];
                  return (
                    <div
                      key={i}
                      className={`carousel__cell ${selectedIndex === i ? 'selected' : ''}`}
                      style={{
                        position: 'absolute',
                        width: `${cellWidth}px`,
                        height: `${cellWidth}px`,
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        backgroundColor: selectedIndex === i ? '#f3f4ff' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: `${rotateFn}(${theta * i}deg) translateZ(${radius}px)`,
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src={song.imgUrl}
                        alt={song.title}
                        width={cellWidth}
                        height={cellWidth}
                        className="object-cover rounded-lg shadow-md"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div> */}

          {/* Show current song info */}
          <div className="mt-4 mb-4 text-center">
            <h3 className="text-lg font-bold">{songData[selectedIndex % songData.length]?.title}</h3>
            <p className="text-gray-600">{songData[selectedIndex % songData.length]?.artist}</p>
            <p className="text-sm" style={{ color: getDifficultyColor(songData[selectedIndex % songData.length]?.diff) }}>
              {songData[selectedIndex % songData.length]?.diff}{" "}
              {songData[selectedIndex % songData.length]?.lv}
            </p>
          </div>

          {randomHistory.length > 0 && (
            <p className="text-gray-600 mt-4">
              Songs selected: {randomHistory.length} 
            </p>
          )}
          <div className="mt-4 flex gap-4 justify-center">
            {showBanPickButton && (
              <Button
                onPress={() => setShowBanPick(true)}
                color="primary"
                size="lg"
                className="font-bold"
              >
                Start Ban/Pick
              </Button>
           )}
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
                  <div
                    key={`${song.title}-${song.diff}-${index}`}
                    className="border border-gray-200 rounded-lg p-4 text-center relative"
                  >
                    <button
                      onClick={() => handleRemoveHistory(index)}
                      className="absolute top-2 right-2 text-sm text-red-600 hover:opacity-80"
                      title="Remove from history"
                      aria-label={`Remove ${song.title} from history`}
                    >
                      ✖
                    </button>

                    <h4 className="font-bold text-sm mt-2">{song.title}</h4>
                    <p className="text-gray-600 text-xs">{song.artist}</p>
                    <p className="text-xs" style={{ color: getDifficultyColor(song.diff) }}>
                      {song.diff} {song.lv}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showRandomPopup && selectedSong && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/70"
          onClick={handlePopupContinue}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md relative p-8 pt-12"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handlePopupContinue}
              className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full text-3xl font-bold transition-colors"
            >
              ✕
            </button>
            <div className="text-center mb-4">
              <span className="inline-block text-black font-bold text-2xl">
                Track #{randomHistory.length + 1}
              </span>
            </div>

            <img
              src={selectedSong.imgUrl}
              alt={selectedSong.title}
              className="mx-auto mb-4 rounded-lg"
              style={{
                width: 280,
                height: 280,
                objectFit: 'cover',
                border: `5px solid ${getDifficultyColor(selectedSong.diff)}`,
                boxShadow: `0 0 20px ${getDifficultyColor(selectedSong.diff)}aa`
              }}
            />

            <h3 className="text-xl font-bold text-center mb-2">{selectedSong.title}</h3>
            <p className="text-gray-600 text-center mb-2">{selectedSong.artist}</p>
            <p
              className="text-center font-bold text-lg"
              style={{ color: getDifficultyColor(selectedSong.diff) }}
            >
              {selectedSong.diff} {selectedSong.lv}
            </p>
          </div>
        </div>
      )}

      {showResult && selectedSong && (
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
            <h1 className="text-4xl font-bold mb-2">{selectedSong.title}</h1>
            <p className="text-xl text-gray-600 mb-4">{selectedSong.artist}</p>
            <p className="text-lg mb-4" style={{ color: getDifficultyColor(selectedSong.diff) }}>
              {selectedSong.diff} {selectedSong.lv}
            </p>
            <Image
              src={selectedSong.imgUrl}
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
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-[95vw] mx-auto">
            <BanPickCarousel
              songs={banPickSongs}
              onBan={(song) => {
                setBannedSongs(prev => [...prev, song]);
              }}
              onPick={(song) => {
                setFinalSongs(prev => [...prev, song]);
              }}
              bannedSongs={bannedSongs}
              pickedSongs={finalSongs}
              remainingBans={banPickSetting.ban - bannedSongs.length}
              remainingPicks={banPickSetting.pick - finalSongs.length}
              onComplete={() => setShowFinalOnly(true)}
              showFinalOnly={showFinalOnly}
            />

            {!showFinalOnly && finalSongs.length === 0 && bannedSongs.length === 0 && (
              <div className="mt-6 text-center">
                <Button
                  onPress={handleReset}
                  color="danger"
                  variant="bordered"
                >
                  Cancel & Reset
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
