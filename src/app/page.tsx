'use client';

import './css/embla.css'
import { useGameDisplay } from './hooks/useGame';
import { Song } from './interface';

import QuadRandomSlot from './components/QuadRandomSlot';
import BanPickCarousel from './components/BanPickCarousel';

// Display-only page - controlled by Controller via BroadcastChannel
export default function Home() {
  const { state, isAnimating, animationSlots } = useGameDisplay();

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
        /* Random Phase - Display slots */
        <QuadRandomSlotDisplay
          slots={displaySlots}
          randomCount={state.randomCount}
          isAnimating={isAnimating}
        />
      ) : state.phase === 'preview' ? (
        /* Preview Phase - Display 6 random songs */
        <QuadRandomSlotDisplay
          slots={state.previewSongs}
          randomCount={6}
          isAnimating={false}
        />
      ) : (
        /* Idle Phase - Waiting for controller */
        <QuadRandomSlotDisplay
          slots={[]}
          randomCount={state.randomCount}
          isAnimating={false}
        />
      )}
    </main>
  );
}

// Simplified display component for random slots
function QuadRandomSlotDisplay({
  slots,
  randomCount,
  isAnimating
}: {
  slots: Song[];
  randomCount: number;
  isAnimating: boolean;
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

  if (slots.length === 0) {
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
        {slots.map((song, index) => (
          <div
            key={`slot-${index}`}
            className="relative"
            style={{
              width: FRAME_OVERLAY_W + 100, // Add 100 to fit the diff text and diff level
              height: FRAME_OVERLAY_H,
              transform: isAnimating ? 'scale(0.98)' : 'scale(1)',
              transition: 'transform 0.1s ease-out'
            }}
          >
            {/* Jacket image */}
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

            {/* Diff + Lv */}
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

            {/* Title */}
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
                // lineHeight: 1.1,
                textShadow: '0 0 1px rgba(255,255,255,0.8)',
                WebkitFontSmoothing: 'antialiased',
                animation: song.title.length > 20 ? 'marquee 15s linear infinite' : 'none'
              }}>
                {song.title}
              </div>
            </div>

            {/* Artist */}
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
          </div>
        ))}
      </div>
    </div>
  );
}
