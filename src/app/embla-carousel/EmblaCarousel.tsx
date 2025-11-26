import React from 'react';
import { Button } from '@heroui/react';
import { Song } from '../interface';
import { EmblaOptionsType } from 'embla-carousel';
import {
  PrevButton,
  NextButton,
  usePrevNextButtons
} from './ArrowButtons';
import useEmblaCarousel from 'embla-carousel-react';

type PropType = {
  slides: Song[];
  options?: EmblaOptionsType;
  onSlideChange?: (index: number) => void;
  onRandomComplete?: (song: Song) => void;
  onRandomStart?: () => void;
  disabled?: boolean;
  isIdleEnabled?: boolean;
  showPopup?: boolean;
}


const EmblaCarousel: React.FC<PropType> = (props) => {
  const { slides, options, onSlideChange, onRandomComplete, onRandomStart, disabled, isIdleEnabled = false, showPopup = false } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [isUserInteracting, setIsUserInteracting] = React.useState(false);
  const idleIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const {
    onPrevButtonClick,
    getRandomIndex,
    onNextButtonClick,
    onRandomButtonClickWithAnimation
  } = usePrevNextButtons(emblaApi, slides, (song) => {
    if (onRandomComplete && song) {
      setTimeout(() => onRandomComplete(song), 500);
    }
  }, onRandomStart);

  // Track slide changes and notify parent
  React.useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setSelectedIndex(index);
      if (onSlideChange) {
        onSlideChange(index);
      }
    };

    // Call once on mount to set initial index
    onSelect();

    // Listen for slide changes
    emblaApi.on('select', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSlideChange]);

  // Idle animation - smooth continuous scroll
  React.useEffect(() => {
    if (!emblaApi || !isIdleEnabled) {
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current);
        idleIntervalRef.current = null;
      }
      return;
    }

    const scroll = () => {
      if (emblaApi && isIdleEnabled) {
        emblaApi.scrollNext();
      }
    };

    // Slower interval for smoother appearance
    idleIntervalRef.current = setInterval(scroll, 3000);

    return () => {
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current);
        idleIntervalRef.current = null;
      }
    };
  }, [emblaApi, isIdleEnabled]);

  const onRandomButtonClick = () => {
    // Stop idle animation immediately when random starts
    if (idleIntervalRef.current) {
      clearInterval(idleIntervalRef.current);
      idleIntervalRef.current = null;
    }
    onRandomButtonClickWithAnimation();
  }

  // Keybind: Enter to random
  React.useEffect(() => {
    if (!emblaApi || disabled || showPopup) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !disabled && !showPopup) {
        onRandomButtonClick();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [emblaApi, disabled, showPopup, onRandomButtonClick]);

  // Configure carousel for smooth transitions
  React.useEffect(() => {
    if (!emblaApi) return;

    emblaApi.reInit({
      loop: true,
      duration: 30, // Slower duration for smoother idle animation
      skipSnaps: false
    });
  }, [emblaApi]);

  const FRAME_W = 240;          // jacket width (smaller)
  const FRAME_H = 270;          // jacket height (smaller)

  const FRAME_OVERLAY_W = 390;  // frame PNG width (bigger)
  const FRAME_OVERLAY_H = 477;  // frame PNG height (bigger)

  return (
    <section className="embla" style={{ position: 'relative', paddingTop: '20px', paddingBottom: '20px' }}>

      {/*<div className="embla__purple-frame">
        <img
          src="/assets/PurpleLayout.png"
          alt="Frame"
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '3000px',
            height: 'auto',
            pointerEvents: 'none',
            zIndex: 10,
            opacity: 0.95
          }}
        />
      </div>*/}

      <div className="embla__viewport" ref={emblaRef} style={{ overflow: 'visible' }}>
        <div className="embla__container" >
          {slides.map((song, index) => {
            const getBorderColor = (diff: string) => {
              switch (diff) {
                case 'EXPERT':
                  return '#ef4444';
                case 'MASTER':
                  return '#9333ea';
                case 'RE:MASTER':
                  return '#ec4899';
                default:
                  return '#a855f7';
              }
            };

            const getFrameImage = (diff: string, isDx: string) => {
              const type = isDx === 'True' ? 'DX' : 'STD';
              switch (diff) {
                case 'EXPERT':
                  return `/assets/expert-${type.toLowerCase()}.png`;
                case 'MASTER':
                  return `/assets/master-${type.toLowerCase()}.png`;
                case 'Re:MASTER':
                  return `/assets/re-${type.toLowerCase()}.png`;
                default:
                  return `/assets/master-${type.toLowerCase()}.png`;
              }
            };

            const isSelected = index === selectedIndex;
            const scale = isSelected ? 1.2 : 1;
            const translateY = isSelected ? -12 : 0;
            const frameScale = isSelected ? 1.15 : 1;

            return (
              <div
                className="embla__slide"
                key={song.id}
                style={{ position: 'relative', flex: '0 0 auto', minWidth: 0, display: 'flex', justifyContent: 'center' }}
              >
                {/* slide content wrapper sized to jacket area */}
                <div style={{ position: 'relative', width: FRAME_OVERLAY_W, height: FRAME_OVERLAY_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* jacket image (under the frame) */}
                  <img
                    src={song.imgUrl}
                    alt={song.title}
                    style={{
                      width: FRAME_W,
                      height: FRAME_H,
                      objectFit: 'cover',
                      padding: '0 0 35px 0',
                      borderRadius: '0px',
                      border: `0px solid ${getBorderColor(song.diff)}`,
                      boxShadow: `0 0 0px ${getBorderColor(song.diff)}40`,
                      transform: `scale(${scale}) translateY(${translateY - 20}px)`,
                      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />

                  {/* frame overlay centered on the jacket */}
                  <img
                    src={getFrameImage(song.diff, song.isDx)} alt="frame"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) scale(${frameScale}) translateY(${translateY}px)`,
                      width: FRAME_OVERLAY_W,
                      height: FRAME_OVERLAY_H,
                      pointerEvents: 'none',
                      zIndex: 3
                    }}
                  />

                  {/* Diff + Lv - positioned at bottom purple bar of frame */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: FRAME_OVERLAY_W * 0.7,
                      textAlign: 'center',
                      zIndex: 4,
                      pointerEvents: 'none',
                      // position slightly below center to sit on the label area of the frame
                      top: FRAME_OVERLAY_H * 0.69,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      alignItems: 'center',

                      textWrap: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'clip',
                    }}
                  >
                    {/* This one is for difficulty title */}
                    <div style={{
                      fontSize: 24 * scale,
                      fontWeight: 700,
                      color: getBorderColor(song.diff),
                      textShadow: '0 0 4px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.7)'
                    }}>
                      {song.diff} {song.lv}
                    </div>

                    {/* This one is for song title */}
                    <div style={{
                      paddingTop: FRAME_OVERLAY_H * 0.0175,
                      fontWeight: 700,
                      fontSize: 24 * scale,
                      fontFamily: "Arial, Helvetica, sans-serif",
                      color: '#111',
                      textShadow: '0 0 4px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.6)',
                      animation: song.title.length > 20 ? `marquee ${song.title.length / 4}s linear infinite` : 'none',
                    }}>
                      {song.title}
                    </div>
                    
                    {/* This one is for song artist */}
                    <div style={{
                      paddingTop: FRAME_OVERLAY_H * 0.025,
                      fontSize: 14 * scale,
                      color: '#444',
                      textShadow: '0 0 4px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.6)',
                      animation: song.artist.length > 30 ? `marquee ${song.artist.length / 4}s linear infinite` : 'none',
                    }}>
                      {song.artist}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default EmblaCarousel;