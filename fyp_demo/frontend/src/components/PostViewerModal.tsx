import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
} from 'lucide-react';
import type { Post } from '../types';

interface PostViewerModalProps {
  post: Post | null;
  username?: string;
  profilePicture?: string;
  onClose: () => void;
  onLike?: (postId: string) => void;
  liked?: boolean;
}

const formatNumber = (num: number) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const PostViewerModal: React.FC<PostViewerModalProps> = ({
  post,
  username,
  profilePicture,
  onClose,
  onLike,
  liked = false,
}) => {
  const [imageIndex, setImageIndex] = useState(0);

  const images = post?.images?.length ? post.images : [];

  useEffect(() => {
    setImageIndex(0);
  }, [post?._id]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!post) return;
      if (e.key === 'Escape') onClose();
      if (images.length > 1) {
        if (e.key === 'ArrowLeft') {
          setImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
        }
        if (e.key === 'ArrowRight') {
          setImageIndex((i) => (i === images.length - 1 ? 0 : i + 1));
        }
      }
    },
    [post, images.length, onClose]
  );

  useEffect(() => {
    if (!post) return;
    document.addEventListener('keydown', handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [post, handleKeyDown]);

  return (
    <AnimatePresence>
      {post && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Post preview"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {profilePicture ? (
                  <img
                    src={profilePicture}
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
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {username}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">{formatDate(post.createdAt)}</p>
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

            {/* Image — standard focused viewport */}
            <div className="relative bg-slate-900 flex items-center justify-center min-h-[200px] max-h-[min(65vh,520px)]">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[imageIndex]}
                    alt={post.caption ? `Post: ${post.caption.slice(0, 40)}` : 'Post image'}
                    className="max-w-full max-h-[min(65vh,520px)] w-auto h-auto object-contain"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              idx === imageIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                            }`}
                            aria-label={`Image ${idx + 1}`}
                          />
                        ))}
                      </div>
                      <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                        {imageIndex + 1} / {images.length}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <p className="text-slate-400 text-sm py-16">No image</p>
              )}
            </div>

            {/* Caption & actions */}
            <div className="px-4 sm:px-5 py-4 space-y-3 overflow-y-auto shrink-0 border-t border-slate-100">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => onLike?.(post._id)}
                  className={`flex items-center gap-2 transition-colors ${
                    liked ? 'text-pink-600' : 'text-slate-600 hover:text-pink-600'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${liked ? 'fill-pink-600' : ''}`} />
                  <span className="text-sm font-medium">
                    {formatNumber(post.likes + (liked ? 1 : 0))}
                  </span>
                </button>
                <span className="flex items-center gap-2 text-slate-500">
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-sm font-medium">{formatNumber(post.comments)}</span>
                </span>
                <button
                  type="button"
                  className="text-slate-500 hover:text-blue-600 transition-colors"
                  aria-label="Share"
                >
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
              {post.caption && (
                <p className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {username && (
                    <span className="font-semibold mr-1.5">{username}</span>
                  )}
                  {post.caption}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostViewerModal;
