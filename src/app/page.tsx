'use client';

import './css/embla.css'
import { useGameDisplay } from './hooks/useGame';
import { Song } from './interface';

import QuadRandomSlot from './components/QuadRandomSlot';
import BanPickCarousel from './components/BanPickCarousel';

// Display-only page - controlled by Controller via BroadcastChannel
export default function Home() {
  const { state, isAnimating, animationSlots, showOverlay } = useGameDisplay();

  // Combine pools for display
  const displaySlots = isAnimating ? animationSlots : state.randomResults;
  const banPickPool = [...state.randomResults, ...state.fixedSongs];

  // Final picked songs including locked tracks
  const finalSongs = [
    ...state.pickedSongs,
    ...(state.lockedTracks.track3 ? [state.lockedTracks.track3] : []),
    ...(state.lockedTracks.track4 ? [state.lockedTracks.track4] : [])
  ];

  return (
    <main className="min-h-screen relative">
      {/* Background
      <iframe
        src="/assets/prism+.html"
        className="fixed inset-0 w-full h-full border-0"
        style={{
          zIndex: -1,
          pointerEvents: 'none'
        }}
        title="background"
      /> */}

      {state.phase === 'final' ? (
        /* Final Results Phase */
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h2 className="text-4xl font-bold text-white mb-8 text-center drop-shadow-lg tracking-wide"
            style={{ textShadow: '0 0 20px rgba(168, 85, 247, 0.5), 0 4px 8px rgba(0,0,0,0.3)' }}>
            BAN PICK RESULT
          </h2>
          <BanPickCarousel
            songs={finalSongs}
            onBan={() => { }}
            onPick={() => { }}
            bannedSongs={[]}
            pickedSongs={finalSongs}
            remainingBans={0}
            remainingPicks={0}
            showFinalOnly={true}
            lockedTracks={state.lockedTracks}
            hiddenTracks={state.hiddenTracks}
          />
        </div>
      ) : state.phase === 'banpick' ? (
        /* Ban/Pick Phase - Display only, no interaction */
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <BanPickCarousel
            songs={banPickPool}
            onBan={() => { }} // No action - Controller handles this
            onPick={() => { }} // No action - Controller handles this
            bannedSongs={state.bannedSongs}
            pickedSongs={state.pickedSongs}
            remainingBans={state.banCount - state.bannedSongs.length}
            remainingPicks={state.pickCount - state.pickedSongs.length}
            onComplete={() => { }}
          />
        </div>
      ) : state.phase === 'random' ? (
        /* Random Phase - Display slots with gray overlay fade */
        <QuadRandomSlotDisplay
          slots={displaySlots}
          randomCount={state.randomCount}
          isAnimating={isAnimating}
          showPlaceholder={false}
          showOverlay={showOverlay}
        />
      ) : state.phase === 'preview' ? (
        /* Preview Phase - Show gray placeholder frames */
        <QuadRandomSlotDisplay
          slots={[]}
          randomCount={state.randomCount}
          isAnimating={false}
          showPlaceholder={true}
        />
      ) : (
        /* Idle Phase - Waiting for controller */
        <QuadRandomSlotDisplay
          slots={[]}
          randomCount={state.randomCount}
          isAnimating={false}
          showPlaceholder={false}
        />
      )}
    </main>
  );
}

// Simplified display component for random slots
function QuadRandomSlotDisplay({
  slots,
  randomCount,
  isAnimating,
  showPlaceholder = false,
  showOverlay = false
}: {
  slots: Song[];
  randomCount: number;
  isAnimating: boolean;
  showPlaceholder?: boolean;
  showOverlay?: boolean;
}) {
  // Grid columns logic: 1-2=cols, 3=3cols, 4=2x2, 5-6=3x2
  const getGridColumns = () => {
    if (randomCount <= 0) return 1;
    if (randomCount === 1) return 1;
    if (randomCount === 2) return 2;
    if (randomCount === 3) return 3;
    if (randomCount === 4) return 2; // 2x2 grid
    if (randomCount === 5) return 3; // 3x2 grid
    if (randomCount === 6) return 3; // 3x2 grid
    return Math.min(randomCount, 4);
  };

  const gridColumns = getGridColumns();

  const getDiffColor = (diff: string) => {
    switch (diff) {
      case 'EXPERT': return '#fe6069';
      case 'MASTER': return '#a352de';
      case 'RE:MASTER':
      case 'Re:MASTER': return '#ca97ca';
      default: return '#a352de';
    }
  };

  const getFrameImage = (diff: string, isDx: string) => {
    const type = isDx === 'True' ? 'dx' : 'std';
    let diffName = diff.toLowerCase();
    if (diffName.includes('re:master')) diffName = 're';
    else if (diffName.includes('master')) diffName = 'master';
    else if (diffName.includes('expert')) diffName = 'expert';
    return `/assets/${diffName}-${type}.png`;
  };

  const FRAME_OVERLAY_W = 375;
  const FRAME_OVERLAY_H = 488;
  const FRAME_W = FRAME_OVERLAY_W * 0.61;
  const FRAME_H = FRAME_OVERLAY_H * 0.5;
  const TITLE_FONT_SIZE = 24;
  const DIFF_FONT_SIZE = 26;

  // If showing placeholder, create empty placeholder slots
  const displayedSlots = showPlaceholder
    ? Array(randomCount).fill(null).map((_, i) => ({
      id: `placeholder-${i}`,
      imgUrl: '/assets/random.png',
      title: 'Random',
      artist: 'Random',
      lv: 'Random',
      diff: 'Random',
      isDx: 'True'
    } as Song))
    : slots.slice(0, randomCount);

  if (displayedSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-white text-2xl opacity-50">Waiting for Controller...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-2">
      <div
        className="grid gap-4 justify-center items-center"
        style={{
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          maxWidth: gridColumns >= 4 ? '1600px' : '1200px',
          margin: '0 auto'
        }}
      >
        {displayedSlots.map((song, index) => {
          const isPlaceholder = song.id.startsWith('placeholder-');

          return (
            <div
              key={`slot-${index}`}
              className="relative"
              style={{
                width: FRAME_OVERLAY_W + 100,
                height: FRAME_OVERLAY_H,
              }}
            >
              {/* LAYER 1: Real Card (always rendered) */}
              {!isPlaceholder && (
                <>
                  {/* Real Jacket image */}
                  <img
                    src={song.imgUrl}
                    alt={song.title}
                    loading="eager"
                    className="absolute"
                    style={{
                      width: FRAME_W,
                      height: FRAME_H,
                      objectFit: 'cover',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) translateY(-${FRAME_OVERLAY_H / 13}px)`,
                      zIndex: 1
                    }}
                  />

                  {/* Real Frame overlay */}
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

                  {/* Real Diff + Lv */}
                  <div
                    className="absolute"
                    style={{
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bottom: FRAME_OVERLAY_H * 0.235,
                      zIndex: 4,
                      display: 'flex',
                      gap: '4px'
                    }}
                  >
                    <div style={{
                      fontSize: DIFF_FONT_SIZE,
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
                    `
                    }}>
                      {song.diff} {song.lv}
                    </div>
                  </div>

                  {/* Real Title */}
                  <div
                    className="absolute custom-title-font"
                    style={{
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bottom: FRAME_OVERLAY_H * 0.14,
                      width: FRAME_OVERLAY_W * 0.72,
                      textAlign: 'center',
                      zIndex: 4,
                      overflow: 'hidden',
                      height: `${TITLE_FONT_SIZE + 10}px`
                    }}
                  >
                    <div style={{
                      fontWeight: 800,
                      fontSize: TITLE_FONT_SIZE,
                      color: '#1a1a1a',
                      whiteSpace: 'nowrap',
                      textShadow: '0 0 1px rgba(255,255,255,0.8)',
                      WebkitFontSmoothing: 'antialiased',
                      animation: song.title.length > 20 ? 'marquee 15s linear infinite' : 'none'
                    }}>
                      {song.title}
                    </div>
                  </div>

                  {/* Real Artist */}
                  <div
                    className="absolute"
                    style={{
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bottom: FRAME_OVERLAY_H * 0.057,
                      width: FRAME_OVERLAY_W * 0.73,
                      textAlign: 'center',
                      zIndex: 4,
                      overflow: 'hidden',
                      height: '18px'
                    }}
                  >
                    <div style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#1a1a1a',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.3,
                      textShadow: '0 0 1px rgba(255,255,255,0.8)',
                      WebkitFontSmoothing: 'antialiased',
                      animation: song.artist.length > 30 ? 'marquee 18s linear infinite' : 'none'
                    }}>
                      {song.artist}
                    </div>
                  </div>
                </>
              )}

              {/* LAYER 2: Overlay with Diagonal "/" Wipe Effect */}
              {(isPlaceholder || showOverlay !== undefined) && (
                <div
                  className={`absolute ${isPlaceholder
                      ? ''
                      : showOverlay
                        ? 'diagonal-wipe-visible'
                        : 'diagonal-wipe-out'
                    }`}
                  style={{
                    width: FRAME_OVERLAY_W + 100,
                    height: FRAME_OVERLAY_H,
                    left: 0,
                    top: 0,
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}
                >
                  {/* Random.png image - scaled to fill the frame (grayscale) */}
                  <img
                    src="/assets/random.png"
                    alt="random"
                    className="absolute"
                    style={{
                      width: FRAME_W + 10,
                      height: FRAME_H + 15,
                      objectFit: 'cover',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) translateY(-${FRAME_OVERLAY_H / 13}px)`,
                      zIndex: 11,
                      filter: 'grayscale(100%) brightness(0.6)'
                    }}
                  />

                  {/* Gray frame overlay (with grayscale filter) */}
                  <img
                    src={isPlaceholder
                      ? '/assets/master-dx.png'
                      : getFrameImage(song.diff, song.isDx)}
                    alt="frame-overlay"
                    className="absolute"
                    style={{
                      width: FRAME_OVERLAY_W,
                      height: FRAME_OVERLAY_H,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                      zIndex: 13,
                      filter: 'grayscale(100%) brightness(0.7)'
                    }}
                  />

                  {/* Overlay text */}
                  <div
                    className="absolute"
                    style={{
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bottom: FRAME_OVERLAY_H * 0.235,
                      zIndex: 14,
                      display: 'flex',
                      gap: '4px'
                    }}
                  >
                    <div style={{
                      fontSize: DIFF_FONT_SIZE,
                      fontWeight: 800,
                      color: '#f1f1f1',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      ?
                    </div>
                  </div>

                  <div
                    className="absolute custom-title-font"
                    style={{
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bottom: FRAME_OVERLAY_H * 0.14,
                      width: FRAME_OVERLAY_W * 0.72,
                      textAlign: 'center',
                      zIndex: 14,
                      overflow: 'hidden',
                      height: `${TITLE_FONT_SIZE + 10}px`
                    }}
                  >
                    <div style={{
                      fontWeight: 800,
                      fontSize: TITLE_FONT_SIZE,
                      color: '#1a1a1a',
                      whiteSpace: 'nowrap',
                      textShadow: '0 0 1px rgba(255,255,255,0.8)'
                    }}>
                      ???
                    </div>
                  </div>

                  <div
                    className="absolute"
                    style={{
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bottom: FRAME_OVERLAY_H * 0.057,
                      width: FRAME_OVERLAY_W * 0.73,
                      textAlign: 'center',
                      zIndex: 14,
                      overflow: 'hidden',
                      height: '18px'
                    }}
                  >
                    <div style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#1a1a1a',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.3,
                      textShadow: '0 0 1px rgba(255,255,255,0.8)'
                    }}>
                      ???
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
