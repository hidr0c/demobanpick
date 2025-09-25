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
  const popupRef = useRef<HTMLDivElement>(null);

  // 3D Carousel state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [cellCount, setCellCount] = useState(8);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHorizontal] = useState(true);
  const [radius, setRadius] = useState(0);
  const [theta, setTheta] = useState(0);
  const [isIdleAnimating, setIsIdleAnimating] = useState(false);
  const idleAnimationRef = useRef<number | null>(null);

  const rotateFn = isHorizontal ? 'rotateY' : 'rotateX';

  // 3D Carousel initialization
  useEffect(() => {
    if (carouselRef.current) {
      const newRadius = Math.round(carouselRef.current.offsetWidth / 2 / Math.tan(Math.PI / cellCount));
      setRadius(newRadius);
      setTheta(360 / cellCount);
      rotateCarousel();
    }
  }, [cellCount, selectedIndex]);
  
  // Start idle animation when component mounts
  useEffect(() => {
    startIdleAnimation();
    
    return () => {
      // Cleanup animation on unmount
      stopIdleAnimation();
    };
  }, []);
  
  // Manage idle animation based on active state
  useEffect(() => {
    if (isAnimating || showResult || showBanPick) {
      // Stop idle animation when actively animating or showing results
      stopIdleAnimation();
    } else if (!isIdleAnimating) {
      // Restart idle animation when returning to idle state
      startIdleAnimation();
    }
  }, [isAnimating, showResult, showBanPick, isIdleAnimating]);

  // Rotation functions for carousel
  const rotateCarousel = () => {
    if (carouselRef.current) {
      const angle = theta * selectedIndex * -1;
      carouselRef.current.style.transform = `translateZ(${-radius}px) ${rotateFn}(${angle}deg)`;
    }
  };

  const rotateRandomCarousel = () => {
    if (carouselRef.current && !isAnimating) {
      // Stop idle animation when starting active animation
      stopIdleAnimation();
      setIsAnimating(true);
      
      // Pick a final random position first to ensure consistency
      const finalIndex = Math.floor(Math.random() * cellCount);
      const targetSong = songData[finalIndex % songData.length];
      
      // First, apply fast animation class
      if (carouselRef.current) {
        carouselRef.current.className = 'carousel animating-fast';
      }
      
      // Use requestAnimationFrame for smoother animation
      let spins = 0;
      const maxSpins = 20; // Increased for smoother effect
      let lastSpinTime = performance.now();
      
      const doSpin = (timestamp: number) => {
        // Calculate time elapsed since last spin
        const elapsed = timestamp - lastSpinTime;
        
        // Calculate progress (0 to 1)
        const progress = spins / maxSpins;
        
        // Determine desired interval based on progress
        let desiredInterval;
        if (progress < 0.3) {
          // Very fast at beginning
          desiredInterval = 30;
        } else if (progress < 0.7) {
          // Gradually slow down in middle
          desiredInterval = 30 + (progress - 0.3) / 0.4 * 70;
        } else {
          // Slower at end
          desiredInterval = 100 + (progress - 0.7) / 0.3 * 200;
        }
        
        // Update animation class based on progress
        if (carouselRef.current) {
          if (progress > 0.7) {
            carouselRef.current.className = 'carousel animating-slow';
          } else if (progress > 0.3) {
            carouselRef.current.className = 'carousel animating-medium';
          }
        }
        
        // Only update if enough time has passed
        if (elapsed >= desiredInterval) {
          spins++;
          setSelectedIndex(prev => (prev + 1) % cellCount);
          lastSpinTime = timestamp;
        }
        
        if (spins < maxSpins) {
          requestAnimationFrame(doSpin);
        } else {
          // Set the final position to ensure consistency with the selected song
          setSelectedIndex(finalIndex);
          setSelectedSong(targetSong);
          
          // Return to normal animation class
          setTimeout(() => {
            if (carouselRef.current) {
              carouselRef.current.className = 'carousel';
            }
            setIsAnimating(false);
          }, 500);
        }
      };
      
      // Start the animation loop
      requestAnimationFrame(doSpin);
    }
  };

  const previousCell = () => {
    setSelectedIndex(index => (index - 1 + cellCount) % cellCount);
  };

  const nextCell = () => {
    setSelectedIndex(index => (index + 1) % cellCount);
  };
  
  // Idle animation functions
  const startIdleAnimation = () => {
    if (isIdleAnimating || isAnimating) return;
    
    setIsIdleAnimating(true);
    if (carouselRef.current) {
      carouselRef.current.className = 'carousel animating-idle';
    }
    
    let lastTime = performance.now();
    const idleSpeed = 6000; // 6 seconds per full rotation
    
    const animateIdle = (time: number) => {
      if (!isIdleAnimating) return;
      
      const elapsed = time - lastTime;
      if (elapsed > idleSpeed / cellCount) {
        setSelectedIndex(index => (index + 1) % cellCount);
        lastTime = time;
      }
      
      idleAnimationRef.current = requestAnimationFrame(animateIdle);
    };
    
    idleAnimationRef.current = requestAnimationFrame(animateIdle);
  };
  
  const stopIdleAnimation = () => {
    setIsIdleAnimating(false);
    if (idleAnimationRef.current !== null) {
      cancelAnimationFrame(idleAnimationRef.current);
      idleAnimationRef.current = null;
    }
  };

  useEffect(() => {
    const h = localStorage.getItem('randomHistory');
    if (h) {
      const parsed = JSON.parse(h);
      setRandomHistory(parsed);
      if (parsed.length >= 6) {
        startBanPick();
      }
    }
  }, []);
  useEffect(() => {
    if (banPickSongs.length <= 3 && finalSongs.length === 0) {
      setFinalSongs(banPickSongs);
    }
  }, [banPickSongs, finalSongs]);

  const handleRandom = () => {
    if (randomHistory.length >= 6) {
      startBanPick();
      return;
    }
    
    // Stop idle animation and set as actively animating
    stopIdleAnimation();
    setIsAnimating(true);

    // Total animation duration - 5.5 seconds
    const totalDuration = 5500;
    
    // Pick a random final position and song FIRST to ensure consistency
    const finalIndex = Math.floor(Math.random() * cellCount);
    const randomSong = songData[finalIndex % songData.length];
    
    // Store the target song for later use
    const targetSong = randomSong;
    
    // Apply fast animation class at the beginning
    if (carouselRef.current) {
      carouselRef.current.className = 'carousel animating-fast';
    }

    // Use requestAnimationFrame for smoother animation
    const startTime = performance.now();
    let lastFrameTime = startTime;
    
    // Animation function using requestAnimationFrame
    const spinAnimation = (currentTime: number) => {
      // Calculate elapsed time and progress
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      
      // Calculate time since last frame
      const frameDelta = currentTime - lastFrameTime;
      
      // Three phases of animation
      let frameInterval;
      
      if (progress < 0.2) {
        // Phase 1: Very fast (30ms between cells)
        frameInterval = 30;
        
        // Keep fast animation class
        if (carouselRef.current) {
          carouselRef.current.className = 'carousel animating-fast';
        }
      } else if (progress < 0.8) {
        // Phase 2: Gradual slowdown (30ms to 200ms)
        frameInterval = 30 + Math.pow((progress - 0.2) / 0.6, 2) * 170;
        
        // Medium animation speed in middle phase
        if (progress > 0.5 && carouselRef.current) {
          carouselRef.current.className = 'carousel animating-medium';
        }
      } else {
        // Phase 3: Final slowdown (200ms to 500ms)
        frameInterval = 200 + Math.pow((progress - 0.8) / 0.2, 2) * 300;
        
        // Slow animation in final phase
        if (carouselRef.current) {
          carouselRef.current.className = 'carousel animating-slow';
        }
      }
      
      // Only update position if enough time has passed since last update
      if (frameDelta >= frameInterval) {
        nextCell();
        lastFrameTime = currentTime;
      }
      
      // Continue animation or finish
      if (progress < 1) {
        requestAnimationFrame(spinAnimation);
      } else {
        // Force final position and ensure it matches the pre-selected song
        setSelectedIndex(finalIndex);
        setSelectedSong(targetSong);
        
        // Update history with the pre-selected song
        setRandomHistory(prev => {
          const newHistory = [...prev, targetSong];
          localStorage.setItem('randomHistory', JSON.stringify(newHistory));
          return newHistory;
        });
        
        // Reset carousel animation class
        if (carouselRef.current) {
          setTimeout(() => {
            if (carouselRef.current) {
              carouselRef.current.className = 'carousel';
            }
          }, 500);
        }
        
        // Show result popup
        setShowResult(true);
        setShowStars(true);
        setIsAnimating(false);
        
        // Hide stars after animation
        setTimeout(() => setShowStars(false), 5000);
      }
    };
    
    // Start the animation
    requestAnimationFrame(spinAnimation);
  };

  const startBanPick = () => {
    // Select 6 random songs for ban pick
    const shuffled = [...songData].sort(() => 0.5 - Math.random());
    setBanPickSongs(shuffled.slice(0, 6));
    setShowBanPick(true);
    setShowResult(false);
  };

  const handleBanPick = (song: Song) => {
    setBanPickSongs(prev => prev.filter(s => s !== song));
  };

  const handleOutsideClick = (event: React.MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
      setShowResult(false);
      setShowStars(false);
      // Restart idle animation after popup closes
      setTimeout(startIdleAnimation, 500);
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-black">

      {!showResult && !showBanPick && (
        <div className="text-center">
          {/* 3D Carousel */}
          <div className="scene mb-8" style={{ perspective: '1000px', width: '240px', height: '240px', margin: '0 auto' }}>
            <div 
              ref={carouselRef} 
              className={`carousel ${isAnimating ? 'animating-fast' : isIdleAnimating ? 'animating-idle' : ''}`} 
              style={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative', 
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Use a subset of songs from the songData */}
              {Array.from({ length: cellCount }).map((_, i) => {
                // Get random song for each cell position
                const song = songData[i % songData.length];
                return (
                  <div
                    key={i}
                    className={`carousel__cell ${selectedIndex === i ? 'selected' : ''}`}
                    style={{
                      position: 'absolute',
                      width: '240px',
                      height: '240px',
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
                      width={200}
                      height={200}
                      className="object-cover rounded-lg shadow-md"
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Show current song info */}
          <div className="mt-4 mb-4 text-center">
            <h3 className="text-lg font-bold">{songData[selectedIndex % songData.length]?.title}</h3>
            <p className="text-gray-600">{songData[selectedIndex % songData.length]?.artist}</p>
            <p className="text-purple-600 text-sm">
              {songData[selectedIndex % songData.length]?.lv} 
              {" "}
              {songData[selectedIndex % songData.length]?.diff}
            </p>
          </div>
          
          <div className="carousel-controls mb-6 flex justify-center gap-4">
            <Button 
              onPress={previousCell} 
              variant="bordered" 
              startContent={<span>◀</span>}
              isDisabled={isAnimating}
            >
              Previous
            </Button>
            <Button 
              onPress={handleRandom}
              color="primary"
              size="lg"
              className="px-8"
              isDisabled={isAnimating}
              isLoading={isAnimating}
            >
              {isAnimating ? "Spinning..." : `Random (${randomHistory.length}/6)`}
            </Button>
            <Button 
              onPress={nextCell} 
              variant="bordered" 
              endContent={<span>▶</span>}
              isDisabled={isAnimating}
            >
              Next
            </Button>
          </div>
          
          <Button
            color="secondary"
            size="md"
            onPress={rotateRandomCarousel}
            className="mb-6"
            isDisabled={isAnimating}
          >
            Spin Carousel
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
            <p className="text-lg text-purple-600 mb-4">{selectedSong.lv} {selectedSong.diff}</p>
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

    </div>
  );
}
