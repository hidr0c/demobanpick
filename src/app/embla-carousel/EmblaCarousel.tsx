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
}


const EmblaCarousel: React.FC<PropType> = (props) => {
  const { slides, options, onSlideChange } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [isUserInteracting, setIsUserInteracting] = React.useState(false);

  const {
    onPrevButtonClick,
    getRandomIndex,
    onNextButtonClick,
    onRandomButtonClickWithAnimation
  } = usePrevNextButtons(emblaApi);

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

  // TODO: Idle animation (auto-scroll) - disabled for now

  const onRandomButtonClick = () => {
    onRandomButtonClickWithAnimation();
  }

  // Configure carousel for fast transitions during spin animation
  React.useEffect(() => {
    if (!emblaApi) return;

    emblaApi.reInit({
      loop: true,
      duration: 20,
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

      <div className="carousel-controls mb-6 flex justify-center gap-4">
        <Button
          onPress={onPrevButtonClick}
          variant="bordered"
          startContent={<span>◀</span>}
        >
          Previous
        </Button>
        <Button
          onPress={onRandomButtonClick}
          color="primary"
          size="lg"
          className="px-8"
        >
          Random
        </Button>
        <Button
          onPress={onNextButtonClick}
          variant="bordered"
          endContent={<span>▶</span>}
        >
          Next
        </Button>
      </div>
    </section>
  )
}

export default EmblaCarousel
