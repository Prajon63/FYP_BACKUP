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
  onSaveProfile?: () => void;
  isSaved?: boolean;
  onCardClick?: () => void;
  style?: React.CSSProperties;
  isSuperLikedByThem?: boolean;
  superLikesRemaining?: number;
  superLikeLimit?: number;
  currentUserId?: string;
}

/** Map common relationship goal strings to a soft colour pair */
const goalStyle = (goal: string): { bg: string; text: string } => {
  const g = goal.toLowerCase();
  if (g.includes('casual'))      return { bg: 'bg-orange-100', text: 'text-orange-700' };
  if (g.includes('long'))        return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
  if (g.includes('marriage'))    return { bg: 'bg-rose-100',    text: 'text-rose-700' };
  if (g.includes('friend'))      return { bg: 'bg-sky-100',     text: 'text-sky-700' };
  if (g.includes('open'))        return { bg: 'bg-violet-100',  text: 'text-violet-700' };
  return                                { bg: 'bg-purple-100',  text: 'text-purple-700' };
};

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

  const photos =
    user.photos && user.photos.length > 0
      ? user.photos
      : user.profilePicture
      ? [user.profilePicture]
      : [];

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
      info.offset.x > 0 ? onLike() : onPass();
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length > 1) setCurrentPhotoIndex((p) => (p + 1) % photos.length);
  };
  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length > 1) setCurrentPhotoIndex((p) => (p - 1 + photos.length) % photos.length);
  };

  const formatDistance = (distance?: number | null) => {
    if (distance == null || !Number.isFinite(distance)) return null;
    return distance < 1 ? '< 1 km away' : `${distance} km away`;
  };

  const gs = user.relationshipGoals ? goalStyle(user.relationshipGoals) : null;

  return (
    <motion.div
      style={{ x, rotate, opacity, ...style }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragDirectionLock
      onDragEnd={handleDragEnd}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
    >
      {/*
        ─── Card shell ───────────────────────────────────────────────────────────
        Mobile  : narrow single-column (max-w-sm), flex-col — image on top, info below
        Desktop : wide two-column (md:max-w-3xl), flex-row — photo left, details right
      */}
      <div
        className={`
          relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden
          flex flex-col
          max-w-sm
          md:flex-row md:max-w-3xl
          ${isSuperLikedByThem ? 'ring-2 ring-amber-400 ring-offset-2' : ''}
        `}
        onClick={onCardClick}
      >
        {/* ── Super-liked banner ── */}
        {isSuperLikedByThem && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-amber-400 via-blue-500 to-amber-400 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 whitespace-nowrap">
            <Star className="w-4 h-4 fill-white" />
            Super Liked you
            <Star className="w-4 h-4 fill-white" />
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────
            IMAGE PANEL
            Mobile  : fixed h-80 (320 px), full width, flex-shrink-0
            Desktop : full card height, 45% width — portrait photo fills nicely
        ───────────────────────────────────────────────────────────────────── */}
        <div className="relative h-80 flex-shrink-0 bg-gray-100 md:h-full md:w-[45%] md:flex-shrink-0">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[currentPhotoIndex]}
                alt={user.username || 'User'}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 20%' }}
              />

              {/* Photo progress dots */}
              {photos.length > 1 && (
                <>
                  <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 px-4 z-10">
                    {photos.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          idx === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
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
                </>
              )}

              {/* Match % badge */}
              <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1.5 rounded-full font-bold text-xs shadow-lg z-10">
                {user.compatibilityScore}% Match
              </div>

              {/* Verified badge */}
              {user.isVerified && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg z-10">
                  <Sparkles className="w-3 h-3" />
                  Verified
                </div>
              )}

              {/* Save / bookmark — bottom-right of image */}
              {onSaveProfile && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); onSaveProfile(); }}
                  className={`
                    absolute bottom-3 right-3 z-10
                    w-9 h-9 rounded-full flex items-center justify-center
                    shadow-lg backdrop-blur-sm transition-colors
                    ${isSaved ? 'bg-rose-500 text-white' : 'bg-black/40 hover:bg-black/60 text-white'}
                  `}
                  title={isSaved ? 'Saved' : 'Save profile'}
                  aria-label="Save profile"
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
                </motion.button>
              )}

              {/* View profile — bottom-left of image */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={goProfile}
                className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-xs font-bold text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 shadow-lg"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View profile
              </motion.button>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center">
              <span className="text-gray-400 text-lg">No photo</span>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={goProfile}
                className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white/90 px-3 py-1.5 rounded-full shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View profile
              </motion.button>
            </div>
          )}
        </div>

        {/* ──────────────────────────────────────────────────────────────────────
            INFO PANEL
            Mobile  : stacks below image, scrollable, action buttons pinned bottom
            Desktop : right column, all content visible at a glance, no scrolling needed
        ───────────────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 md:min-w-0">

          {/* Scrollable content area
              Mobile : overflow-y-auto so user can scroll to see more
              Desktop: content fits without scrolling; overflow-y-auto is harmless fallback
              onPointerDownCapture: only stop propagation for touch events so mobile
              vertical scroll works, while mouse-driven drag on desktop still fires. */}
          <div
            className="flex-1 overflow-y-auto px-5 pt-5 pb-2 md:px-7 md:pt-7"
            style={{ touchAction: 'pan-y' }}
            onPointerDownCapture={(e) => { if (e.pointerType === 'touch') e.stopPropagation(); }}
          >
            {/* ── Name row ── */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={goProfile}
                  className="text-left"
                >
                  <h2
                    className="text-xl font-bold text-gray-900 leading-tight md:text-2xl"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {user.username || 'Anonymous'}
                    {user.age && (
                      <span className="text-gray-500 font-medium">, {user.age}</span>
                    )}
                  </h2>
                </motion.button>
                {user.pronouns && (
                  <p className="text-xs text-gray-400 mt-0.5">{user.pronouns}</p>
                )}
              </div>

              {/* Info toggle — desktop: hidden (everything is already visible) */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors ml-2 flex-shrink-0 md:hidden"
                aria-label="More info"
              >
                <Info className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* ── Relationship goal tag ── */}
            {user.relationshipGoals && gs && (
              <div className="mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${gs.bg} ${gs.text} border-current/20`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  {user.relationshipGoals}
                </span>
              </div>
            )}

            {/* ── Meta: location, work, education ── */}
            <div className="space-y-1.5 mb-3">
              {(user.location || (user.distance != null && Number.isFinite(user.distance))) && (
                <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-pink-400" />
                  <span className="truncate">
                    {[user.location, formatDistance(user.distance)].filter(Boolean).join(' • ')}
                  </span>
                </div>
              )}
              {user.workTitle && (
                <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm">
                  <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {user.workTitle}
                    {user.workCompany && ` at ${user.workCompany}`}
                  </span>
                </div>
              )}
              {user.educationSchool && (
                <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm">
                  <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {user.educationDegree && `${user.educationDegree} • `}
                    {user.educationSchool}
                  </span>
                </div>
              )}
            </div>

            {/* ── Bio ──
                Mobile  : clamped to 2 lines (expand via info toggle)
                Desktop : show full bio */}
            {user.bio && (
              <p className="text-gray-600 text-xs leading-relaxed mb-4 line-clamp-2 md:line-clamp-none md:text-sm">
                {user.bio}
              </p>
            )}

            {/* ── Interests ──
                Mobile  : show 4 + "+N" badge (expand via info toggle)
                Desktop : show all */}
            {user.interests && user.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {/* Mobile: respect showInfo toggle; Desktop: always show all */}
                {user.interests.map((interest, idx) => {
                  const hiddenOnMobile = !showInfo && idx >= 4;
                  return (
                    <span
                      key={idx}
                      className={`bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-xs font-medium border border-rose-100 ${hiddenOnMobile ? 'hidden md:inline-flex' : ''}`}
                    >
                      {interest}
                    </span>
                  );
                })}
                {/* "+N more" badge — mobile only when collapsed */}
                {!showInfo && user.interests.length > 4 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
                    className="md:hidden bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-xs font-medium border border-rose-100"
                  >
                    +{user.interests.length - 4} more
                  </button>
                )}
              </div>
            )}

            {/* Extra breathing room at bottom of scroll area on desktop */}
            <div className="h-3 md:h-4" />
          </div>

          {/* ── Action buttons — pinned at bottom of info panel ── */}
          <div
            className="flex-shrink-0 px-5 py-3 bg-white border-t border-gray-100 md:px-7 md:py-5"
            onPointerDownCapture={(e) => { if (e.pointerType === 'touch') e.stopPropagation(); }}
          >
            <div className="flex justify-center items-center gap-5 md:gap-8">

              {/* Pass */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={(e) => { e.stopPropagation(); onPass(); }}
                className="w-14 h-14 bg-white rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center border border-gray-200 hover:border-red-200 hover:scale-110 md:w-16 md:h-16"
                aria-label="Pass"
              >
                <X className="w-6 h-6 text-red-400 md:w-7 md:h-7" />
              </motion.button>

              {/* Super Like */}
              <div className="flex flex-col items-center gap-0.5">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={(e) => { e.stopPropagation(); if (canSuperLike) onSuperLike(); }}
                  disabled={!canSuperLike}
                  title={
                    canSuperLike
                      ? `${superLikesRemaining} super like${superLikesRemaining !== 1 ? 's' : ''} left`
                      : 'No super likes left today'
                  }
                  className={`
                    w-12 h-12 rounded-full shadow-md transition-all flex items-center justify-center
                    md:w-14 md:h-14
                    ${canSuperLike
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600 hover:shadow-lg hover:scale-110 cursor-pointer'
                      : 'bg-gray-200 cursor-not-allowed opacity-60'}
                  `}
                  aria-label="Super like"
                >
                  <Star
                    className={`w-5 h-5 md:w-6 md:h-6 ${canSuperLike ? 'text-white fill-white' : 'text-gray-400'}`}
                  />
                </motion.button>
                <span className="text-[9px] text-gray-400 font-medium tracking-tight">
                  {canSuperLike ? `${superLikesRemaining}/${superLikeLimit}` : '0 left'}
                </span>
              </div>

              {/* Like */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={(e) => { e.stopPropagation(); onLike(); }}
                className="w-14 h-14 bg-white rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center border border-gray-200 hover:border-pink-200 hover:scale-110 md:w-16 md:h-16"
                aria-label="Like"
              >
                <Heart className="w-6 h-6 text-pink-500 hover:fill-pink-500 transition-all md:w-7 md:h-7" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserCard;
