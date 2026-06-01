import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import SafeImage from './SafeImage';

interface PhotoCarouselProps {
  photos: string[];
  fallbackSeed?: string;
  onViewPhoto?: (index: number) => void;
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({
  photos,
  fallbackSeed = 'photos',
  onViewPhoto,
}) => {
  if (!photos?.length) return null;

  return (
    <div className="my-8">
      <h3 className="text-xl font-bold mb-4 text-center">My Photos</h3>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={10}
        slidesPerView={1.2}
        centeredSlides
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop
        breakpoints={{
          640: { slidesPerView: 2.2 },
          1024: { slidesPerView: 3.2 },
        }}
        className="photo-swiper"
      >
        {photos.map((url, idx) => (
          <SwiperSlide key={idx}>
            <button
              type="button"
              onClick={() => onViewPhoto?.(idx)}
              className={`aspect-square rounded-2xl overflow-hidden shadow-lg w-full block ${
                onViewPhoto ? 'cursor-pointer' : ''
              }`}
            >
              <SafeImage
                src={url}
                fallbackSeed={`${fallbackSeed}-${idx}`}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default PhotoCarousel;