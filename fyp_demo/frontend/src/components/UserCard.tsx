import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  X,
  Star,
  MapPin,
  Briefcase,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  ExternalLink,
  Bookmark,
} from 'lucide-react';
import type { DiscoveryUser } from '../types';

interface UserCardProps {
  user: DiscoveryUser;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
  /** Optional: save profile (bookmark) without swiping */
  onSaveProfile?: () => void;
  isSaved?: boolean;
  onCardClick?: () => void;
  style?: React.CSSProperties;
  isSuperLikedByThem?: boolean;
  superLikesRemaining?: number;
  superLikeLimit?: number;
  /** Current logged-in user — used to route /profile vs /profile/:id */
  currentUserId?: string;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onLike,
  onPass,
  onSuperLike,
  onSaveProfile,
  isSaved = false,
  onCardClick,
  style,
  isSuperLikedByThem = false,
  superLikesRemaining = 1,
  superLikeLimit = 1,
  currentUserId = '',
}) => {
  const navigate = useNavigate();
  const canSuperLike = superLikesRemaining > 0;
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  const goProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user._id) return;
    if (user._id === currentUserId) navigate('/profile');
    else navigate(`/profile/${user._id}`);
  };

  const photos = user.photos && user.photos.length > 0
    ? user.photos
    : user.profilePicture
      ? [user.profilePicture]
      : [];

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (Math.abs(offset) > 100 || Math.abs(velocity) > 500) {
      if (offset > 0) {
        onLike();
      } else {
        onPass();
      }
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  const formatDistance = (distance?: number | null) => {
    if (!distance) return null;
    if (distance < 1) return '< 1 km away';
    return `${distance} km away`;
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        ...style
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <div
        className={`relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden ${isSuperLikedByThem ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
        onClick={onCardClick}
      >
        {isSuperLikedByThem && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-amber-400 via-blue-500 to-amber-400 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
            <Star className="w-4 h-4 fill-white" />
            Super Liked you
            <Star className="w-4 h-4 fill-white" />
          </div>
        )}

        <div className="relative h-3/5">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[currentPhotoIndex]}
                alt={user.username || 'User'}
                className="w-full h-full object-cover"
              />

              <div className="hidden md:flex absolute top-3 right-3 z-20">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={goProfile}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-black/40 hover:bg-black/55 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20 shadow-lg"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View profile
                </motion.button>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={goProfile}
                className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 text-xs font-bold text-white bg-black/45 hover:bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/25 shadow-lg"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View profile
              </motion.button>

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all backdrop-blur-sm z-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all backdrop-blur-sm z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-4">
                    {photos.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          idx === currentPhotoIndex
                            ? 'bg-white'
                            : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {user.isVerified && (
                <div className="absolute top-4 right-4 md:right-[9.5rem] bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg z-10">
                  <Sparkles className="w-3 h-3" />
                  Verified
                </div>
              )}

              <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full font-bold shadow-lg z-10">
                {user.compatibilityScore}% Match
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center relative">
              <span className="text-gray-400 text-lg">No photo</span>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={goProfile}
                className="mt-3 md:hidden flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white/90 px-3 py-1.5 rounded-full shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View profile
              </motion.button>
              <div className="hidden md:flex absolute top-3 right-3 z-20">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={goProfile}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white/90 px-3 py-2 rounded-full shadow-lg"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View profile
                </motion.button>
              </div>
            </div>
          )}
        </div>

        <div className="relative h-2/5 p-6 overflow-y-auto z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={goProfile}
                className="text-left"
              >
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {user.username || 'Anonymous'}
                  {user.age && <span className="text-gray-600">, {user.age}</span>}
                </h2>
              </motion.button>
              {user.pronouns && (
                <p className="text-sm text-gray-500">{user.pronouns}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {onSaveProfile && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveProfile();
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    isSaved ? 'bg-rose-50 text-rose-600' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title={isSaved ? 'Saved' : 'Save profile'}
                  aria-label="Save profile"
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                </motion.button>
              )}
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="More info"
              >
                <Info className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {user.location && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {user.location}
                  {user.distance && ` • ${formatDistance(user.distance)}`}
                </span>
              </div>
            )}

            {user.workTitle && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Briefcase className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {user.workTitle}
                  {user.workCompany && ` at ${user.workCompany}`}
                </span>
              </div>
            )}

            {user.educationSchool && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <GraduationCap className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {user.educationDegree && `${user.educationDegree} • `}
                  {user.educationSchool}
                </span>
              </div>
            )}
          </div>

          {user.bio && (
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {user.bio}
            </p>
          )}

          {user.relationshipGoals && (
            <div className="mb-4">
              <div className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                {user.relationshipGoals}
              </div>
            </div>
          )}

          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {user.interests.slice(0, showInfo ? undefined : 5).map((interest, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium"
                >
                  {interest}
                </span>
              ))}
              {!showInfo && user.interests.length > 5 && (
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                  +{user.interests.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onPass();
            }}
            className="w-14 h-14 bg-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group hover:scale-110"
          >
            <X className="w-7 h-7 text-red-500 group-hover:scale-110 transition-transform" />
          </motion.button>

          <div className="flex flex-col items-center gap-0.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                if (canSuperLike) onSuperLike();
              }}
              disabled={!canSuperLike}
              title={canSuperLike ? `${superLikesRemaining} Super like${superLikesRemaining !== 1 ? 's' : ''} left today` : 'No Super likes left today'}
              className={`w-12 h-12 rounded-full shadow-lg transition-all flex items-center justify-center group ${
                canSuperLike
                  ? 'bg-gradient-to-r from-blue-400 to-blue-600 hover:shadow-xl hover:scale-110 cursor-pointer'
                  : 'bg-gray-300 cursor-not-allowed opacity-80'
              }`}
            >
              <Star className={`w-6 h-6 ${canSuperLike ? 'text-white fill-white' : 'text-gray-500'} group-hover:scale-110 transition-transform`} />
            </motion.button>
            <span className="text-[10px] text-gray-500 font-medium">
              {canSuperLike ? `${superLikesRemaining}/${superLikeLimit}` : '0 left'}
            </span>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            className="w-14 h-14 bg-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group hover:scale-110"
          >
            <Heart className="w-7 h-7 text-pink-500 group-hover:scale-110 group-hover:fill-pink-500 transition-all" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default UserCard;
