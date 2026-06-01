import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import SafeImage from './SafeImage';

interface GalleryViewerModalProps {
  photos: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  profilePicture?: string;
  fallbackSeed?: string;
}

const GalleryViewerModal: React.FC<GalleryViewerModalProps> = ({
  photos,
  initialIndex = 0,
  isOpen,
  onClose,
  username,
  profilePicture,
  fallbackSeed = 'gallery',
}) => {
  const [imageIndex, setImageIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) setImageIndex(initialIndex);
  }, [isOpen, initialIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || !photos.length) return;
      if (e.key === 'Escape') onClose();
      if (photos.length > 1) {
        if (e.key === 'ArrowLeft') {
          setImageIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
        }
        if (e.key === 'ArrowRight') {
          setImageIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
        }
      }
    },
    [isOpen, photos.length, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [isOpen, handleKeyDown]);

  if (!photos.length) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery preview"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {profilePicture ? (
                  <SafeImage
                    src={profilePicture}
                    fallbackSeed={fallbackSeed}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-100"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                    {(username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  {username && (
                    <p className="text-sm font-semibold text-slate-900 truncate">{username}</p>
                  )}
                  <p className="text-xs text-slate-400">
                    Gallery · Photo {imageIndex + 1} of {photos.length}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-slate-900 w-full h-[min(70vh,560px)] shrink-0 overflow-hidden">
              <SafeImage
                src={photos[imageIndex]}
                fallbackSeed={`${fallbackSeed}-${imageIndex}`}
                alt={`Gallery photo ${imageIndex + 1}`}
                className="w-full h-full object-contain"
              />
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((i) => (i === 0 ? photos.length - 1 : i - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((i) => (i === photos.length - 1 ? 0 : i + 1))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === imageIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                        }`}
                        aria-label={`Photo ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GalleryViewerModal;
