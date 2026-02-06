import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface PhotoCarouselProps {
  photos: string[];
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ photos }) => {
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
            <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default PhotoCarousel;