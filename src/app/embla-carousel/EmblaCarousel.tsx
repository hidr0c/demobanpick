import React from 'react';
import { Button } from '@heroui/react';
// import {Song} from '../interface';
import { EmblaOptionsType } from 'embla-carousel';
import {
  PrevButton,
  NextButton,
  usePrevNextButtons
} from './ArrowButtons';
import useEmblaCarousel from 'embla-carousel-react';

type PropType = {
  slides: number[];
  options?: EmblaOptionsType;
}


const EmblaCarousel: React.FC<PropType> = (props) => {
    const {slides, options} = props;
    const [emblaRef, emblaApi] = useEmblaCarousel(options);

    const {
        onPrevButtonClick,
        getRandomIndex,
        onNextButtonClick
    } = usePrevNextButtons(emblaApi);

    const onRandomButtonClick = () => {
        const index = Math.floor(Math.random() * (slides.length - 1));
        getRandomIndex(index);
    }

    // Changing some options for the carousel
    emblaApi?.reInit({
      loop: true,
      duration: 200
    });
    return (
    <section className="embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((index) => (
            <div className="embla__slide" key={index}>
              <div className="embla__slide__number">{index + 1}</div>
            </div>
          ))}
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
