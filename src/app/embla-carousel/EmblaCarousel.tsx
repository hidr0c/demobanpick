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
  disabled?: boolean;
  isIdleEnabled?: boolean;
  showPopup?: boolean;
}


const EmblaCarousel: React.FC<PropType> = (props) => {
  const { slides, options, onSlideChange, onRandomComplete, disabled, isIdleEnabled = false, showPopup = false } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [isUserInteracting, setIsUserInteracting] = React.useState(false);
  const idleIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const {
    onPrevButtonClick,
    getRandomIndex,
    onNextButtonClick,
    onRandomButtonClickWithAnimation
  } = usePrevNextButtons(emblaApi, slides, (song) => {
    if (onRandomComplete && song) {
      setTimeout(() => onRandomComplete(song), 500);
    }
  });

  // Track slide changes and notify parent
  React.useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
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
  return (
    <section className="embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((song) => {
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

            return (
              <div className="embla__slide" key={song.id}>
                <img
                  className="embla__slide__number"
                  src={song.imgUrl}
                  alt={song.id}
                  style={{
                    border: `2px solid ${getBorderColor(song.diff)}`,
                    boxShadow: `0 0 8px ${getBorderColor(song.diff)}40`
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  )
}

export default EmblaCarousel
