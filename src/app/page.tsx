'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import Image from 'next/image';
import banPickSettings from '../../public/roundBanPickSettings.json';

// Task: How to import different song datas from pools folder to here?
import songData from '../../public/pools/newbieSemi.json';

console.log('songData loaded:', songData);
console.log('songData length:', songData?.length);
console.log('banPickSettings:', banPickSettings);
console.log('banPickSettings length:', banPickSettings?.length);

export interface Song {
  imgUrl: string;
  artist: string;
  title: string;
  lv: string;
  diff: string;
  isDx: boolean;
}

export interface RoundSetting {
  poolPath: string;
  totalBanPick: number;
  ban: number;
  pick: number;
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
  const [roundSetting, setRoundSetting] = useState<RoundSetting>(banPickSettings[0]);
  const [animationPhase, setAnimationPhase] = useState<'fast' | 'slow' | 'idle'>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isCarouselReady, setIsCarouselReady] = useState(false);

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

   const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EXPERT':
        return 'red';
      case 'MASTER':
        return '#9333ea'; // a shade of purple
      default:
        return '#DDA0DD'; // plum, for RE:MASTER
    }
  };

  // 3D Carousel initialization
  useEffect(() => {
    if (carouselRef.current) {
    const cellW = cellWidth; 
    const newRadius = Math.round(cellW / 2 / Math.tan(Math.PI / cellCount));
    setRadius(newRadius);
    setTheta(360 / cellCount);
    rotateCarousel();
    setIsCarouselReady(true); // Đánh dấu carousel đã sẵn sàng
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
  const rotateCarousel = (angle?: number) => {
    if (carouselRef.current) {
      const rotationAngle = angle !== undefined ? angle : theta * selectedIndex * -1;
      carouselRef.current.style.transform = `translateZ(${-radius}px) ${rotateFn}(${rotationAngle}deg)`;
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
      targetIndexRef.current = finalIndex;

      // Calculate angles for smooth animation
      const startAngle = theta * selectedIndex * -1;
      const minSpins = 2;
      const extraRotation = 360 * minSpins;
      currentRotationRef.current = startAngle;

      // First, apply fast animation class
      if (carouselRef.current) {
        carouselRef.current.className = 'carousel animating-fast';
      }

      const totalDuration = 3000; // 3 seconds
      const startTime = performance.now();

      const doSpin = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);

        // Ease out cubic for smooth deceleration
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);

        // Calculate current angle
        const currentAngle = startAngle - (extraRotation + (theta * finalIndex)) * easedProgress;
        currentRotationRef.current = currentAngle;

        // Update animation class based on progress
        if (carouselRef.current) {
          if (progress > 0.7) {
            carouselRef.current.className = 'carousel animating-slow';
          } else if (progress > 0.3) {
            carouselRef.current.className = 'carousel animating-medium';
          }
        }

        // Apply rotation
        rotateCarousel(currentAngle);

        // Update selected index based on current position
        const normalizedAngle = ((currentAngle % 360) + 360) % 360;
        const currentCell = Math.round(normalizedAngle / theta) % cellCount;
        setSelectedIndex(currentCell);

        if (progress < 1) {
          requestAnimationFrame(doSpin);
        } else {
          // Set the final position to ensure consistency with the selected song
          const finalAngle = theta * finalIndex * -1;
          rotateCarousel(finalAngle);
          setSelectedIndex(finalIndex);
          setSelectedSong(targetSong);
          targetIndexRef.current = null;

          // Return to normal animation class
          setTimeout(() => {
            if (carouselRef.current) {
              carouselRef.current.className = 'carousel';
            }
            setIsAnimating(false);
          }, 300);
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
      nextCell();
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
      if (parsed.length >= roundSetting.totalBanPick) {
        startBanPick();
      }
    }
  }, []);
  useEffect(() => {
    if (banPickSongs.length <= roundSetting.pick && finalSongs.length === 0) {
      setFinalSongs(banPickSongs);
    }
  }, [banPickSongs, finalSongs]);

  const handleRandom = () => {
    if (randomHistory.length >= roundSetting.totalBanPick) {
      startBanPick();
      return;
    }

    // Stop idle animation and set as actively animating
    stopIdleAnimation();
    setIsAnimating(true);

    // STEP 1: Random kết quả TRƯỚC khi bắt đầu animation
    let finalIndex = Math.floor(Math.random() * cellCount);
    let targetSong = songData[finalIndex % songData.length];
    let attempts = 0;
    while (randomHistory.some(s => s.title === targetSong.title && s.diff === targetSong.diff) && attempts < 100) {
    finalIndex = Math.floor(Math.random() * cellCount);
    targetSong = songData[finalIndex % songData.length];
    attempts++;
  }

    targetIndexRef.current = finalIndex;

    // STEP 2: Tính toán các thông số animation
    const startAngle = theta * selectedIndex * -1;
    const targetAngle = theta * finalIndex * -1;

    // Animation settings
    const totalDuration = 4000; // 4 seconds total
    const minSpins = 3; // Minimum full rotations

    // Tính khoảng cách từ vị trí hiện tại đến target
    const directDistance = Math.abs(finalIndex - selectedIndex);
    const wrappedDistance = cellCount - directDistance;
    const shortestDistance = Math.min(directDistance, wrappedDistance);

    // Tính số vòng quay cần thiết để đủ thời gian animation
    // Công thức: minSpins vòng + khoảng cách đến target
    const totalCells = (minSpins * cellCount) + shortestDistance;
    const extraRotation = 360 * minSpins;

    currentRotationRef.current = startAngle;

    // Apply fast animation at the beginning
    if (carouselRef.current) {
      carouselRef.current.className = 'carousel animating-fast';
    }

    const startTime = performance.now();

    // Animation function using requestAnimationFrame
    const spinAnimation = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      let progress = Math.min(elapsed / totalDuration, 1);

      // Easing function: starts fast, ends slow (ease-out cubic)
      const easeOutCubic = (t: number) => {
        return 1 - Math.pow(1 - t, 3);
      };

      const easedProgress = easeOutCubic(progress);

      // STEP 3: Tính toán góc quay hiện tại
      // Quay theo chiều âm (ngược chiều kim đồng hồ)
      let targetRotation;
      if (finalIndex >= selectedIndex) {
        // Target ở phía trước, quay thuận
        targetRotation = extraRotation + (finalIndex - selectedIndex) * theta;
      } else {
        // Target ở phía sau, quay qua 0
        targetRotation = extraRotation + (cellCount - selectedIndex + finalIndex) * theta;
      }

      const currentAngle = startAngle - (targetRotation * easedProgress);
      currentRotationRef.current = currentAngle;

      // Update CSS class based on progress for smoother transitions
      if (carouselRef.current) {
        if (progress < 0.3) {
          carouselRef.current.className = 'carousel animating-fast';
        } else if (progress < 0.7) {
          carouselRef.current.className = 'carousel animating-medium';
        } else {
          carouselRef.current.className = 'carousel animating-slow';
        }
      }

      // Apply rotation directly to carousel
      rotateCarousel(currentAngle);

      // Calculate which cell we're currently showing
      const normalizedAngle = (((-currentAngle) % 360) + 360) % 360;
      const currentCell = Math.round(normalizedAngle / theta) % cellCount;
      setSelectedIndex(currentCell);

      // STEP 4: Kiểm tra điều kiện kết thúc
      // Nếu progress = 1 VÀ đã đến đúng target position
      if (progress >= 1) {
        const currentNormalizedAngle = (((-currentAngle) % 360) + 360) % 360;
        const currentPosition = Math.round(currentNormalizedAngle / theta) % cellCount;

        // Kiểm tra xem đã đến đúng vị trí target chưa
        if (currentPosition === finalIndex) {
          // ĐÃ ĐẾN ĐÚNG VỊ TRÍ - Kết thúc animation
          const finalAngle = theta * finalIndex * -1;
          rotateCarousel(finalAngle);
          setSelectedIndex(finalIndex);
          setSelectedSong(targetSong);
          targetIndexRef.current = null;

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
            }, 300);
          }

          // Show result popup
          setShowResult(true);
          setShowStars(true);
          setIsAnimating(false);

          // Hide stars after animation
          setTimeout(() => setShowStars(false), 5000);
        } else {
          // CHƯA ĐẾN VỊ TRÍ - Tiếp tục quay với tốc độ chậm
          // Calculate how much more we need to rotate
          const currentPos = currentPosition;
          let remainingCells;

          if (finalIndex >= currentPos) {
            remainingCells = finalIndex - currentPos;
          } else {
            remainingCells = cellCount - currentPos + finalIndex;
          }

          // Continue rotating slowly until we reach target
          const additionalRotation = remainingCells * theta;
          const newTargetAngle = currentAngle - additionalRotation;

          // Slow animation for final approach
          if (carouselRef.current) {
            carouselRef.current.className = 'carousel animating-slow';
          }

          const finalApproachDuration = 500; // 0.5 seconds for final approach
          const finalStartTime = performance.now();

          const finalApproach = (time: number) => {
            const finalElapsed = time - finalStartTime;
            const finalProgress = Math.min(finalElapsed / finalApproachDuration, 1);

            const finalAngle = currentAngle - (additionalRotation * finalProgress);
            rotateCarousel(finalAngle);

            const finalNormalizedAngle = (((-finalAngle) % 360) + 360) % 360;
            const finalCell = Math.round(finalNormalizedAngle / theta) % cellCount;
            setSelectedIndex(finalCell);

            if (finalProgress < 1) {
              requestAnimationFrame(finalApproach);
            } else {
              // Force exact position
              const exactAngle = theta * finalIndex * -1;
              rotateCarousel(exactAngle);
              setSelectedIndex(finalIndex);
              setSelectedSong(targetSong);
              targetIndexRef.current = null;

              setRandomHistory(prev => {
                const newHistory = [...prev, targetSong];
                localStorage.setItem('randomHistory', JSON.stringify(newHistory));
                return newHistory;
              });

              if (carouselRef.current) {
                setTimeout(() => {
                  if (carouselRef.current) {
                    carouselRef.current.className = 'carousel';
                  }
                }, 300);
              }

              setShowResult(true);
              setShowStars(true);
              setIsAnimating(false);
              setTimeout(() => setShowStars(false), 5000);
            }
          };

          requestAnimationFrame(finalApproach);
        }
      } else {
        // Continue main animation
        requestAnimationFrame(spinAnimation);
      }
    };

    // Start the animation
    requestAnimationFrame(spinAnimation);
  };

  const startBanPick = () => {
    const shuffled = [...songData].sort(() => 0.5 - Math.random());
    setBanPickSongs(shuffled.slice(0, roundSetting.totalBanPick));
    setBanPickSongs([...randomHistory]);
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

  const handleRemoveHistory = (index: number) => {
    setRandomHistory(prev => {
    const removed = prev[index];
    const newArr = prev.filter((_, i) => i !== index);
    localStorage.setItem('randomHistory', JSON.stringify(newArr));

    // Also remove from banPickSongs / finalSongs if present (match by title+diff)
    if (removed) {
      setBanPickSongs(bp => bp.filter(s => !(s.title === removed.title && s.diff === removed.diff)));
      setFinalSongs(f => f.filter(s => !(s.title === removed.title && s.diff === removed.diff)));
       // If history is now below required, hide ban/pick modal
      if (newArr.length < roundSetting.totalBanPick) {
         setShowBanPick(false);
      }
       // If the removed song was currently selected in popup, close it
      if (selectedSong && selectedSong.title === removed.title && selectedSong.diff === removed.diff) {
         setSelectedSong(null);
         setShowResult(false);
         setShowStars(false);
      }
    }

     return newArr;
   });
 };

  // Create multiple images for the moving row
  const images = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-black">
      {!showResult && !showBanPick && (
        <div className="w-full flex flex-col items-center justify-center" style={{ minHeight: '110vh' }}>
          {/* Carousel ở trên, căn giữa */}
          <div className="w-full flex justify-center mt-8">
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
          </div>

          {/* Show current song info */}
          <div className="mt-4 mb-4 text-center">
            <h3 className="text-lg font-bold">{songData[selectedIndex % songData.length]?.title}</h3>
            <p className="text-gray-600">{songData[selectedIndex % songData.length]?.artist}</p>
            <p className="text-sm" style={{ color: getDifficultyColor(songData[selectedIndex % songData.length]?.diff) }}>
              {songData[selectedIndex % songData.length]?.diff}{" "}
              {songData[selectedIndex % songData.length]?.lv}
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
              {isAnimating ? "Spinning..." : `Random (${randomHistory.length}/${roundSetting.totalBanPick})`}
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

          {randomHistory.length > 0 && (
            <p className="text-gray-600 mt-4">
              Random History: {randomHistory.length} / {roundSetting.totalBanPick} songs selected
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
                    <Image
                      src={song.imgUrl}
                      alt={song.title}
                      width={100}
                      height={100}
                      className="mx-auto rounded-xl"
                    />
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
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Ban Pick Phase</h2>
            <p className="text-center text-gray-600 mb-6">
              Click on songs to ban them ({roundSetting.ban - (roundSetting.totalBanPick - banPickSongs.length)} bans remaining)
            </p>

            {/* Display songs for banning */}
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
                  <p className="text-center text-sm" style={{ color: getDifficultyColor(song.diff) }}>
                    {song.diff} {song.lv}
                  </p>
                </div>
              ))}
            </div>

            {/* Display final selection */}
            {finalSongs.length > 0 && (
              <div className="mt-8 p-4 bg-green-50 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-center">Final Selection ({finalSongs.length} / {roundSetting.pick})</h3>
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
