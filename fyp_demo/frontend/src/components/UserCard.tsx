import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
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
  Info
} from 'lucide-react';
import type { DiscoveryUser } from '../types';

interface UserCardProps {
  user: DiscoveryUser;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
  onCardClick?: () => void;
  style?: React.CSSProperties;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onLike,
  onPass,
  onSuperLike,
  onCardClick,
  style
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  // Get all available photos
  const photos = user.photos && user.photos.length > 0 
    ? user.photos 
    : user.profilePicture 
    ? [user.profilePicture] 
    : [];

  // Motion values for drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (Math.abs(offset) > 100 || Math.abs(velocity) > 500) {
      if (offset > 0) {
        // Swiped right - like
        onLike();
      } else {
        // Swiped left - pass
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
      <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Photo Section */}
        <div className="relative h-3/5">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[currentPhotoIndex]}
                alt={user.username || 'User'}
                className="w-full h-full object-cover"
              />
              
              {/* Photo Navigation */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Photo Indicators */}
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

              {/* Verified Badge */}
              {user.isVerified && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                  <Sparkles className="w-3 h-3" />
                  Verified
                </div>
              )}

              {/* Compatibility Score */}
              <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                {user.compatibilityScore}% Match
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-400 text-lg">No photo</span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="relative h-2/5 p-6 overflow-y-auto">
          {/* Name and Age */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user.username || 'Anonymous'}
                {user.age && <span className="text-gray-600">, {user.age}</span>}
              </h2>
              {user.pronouns && (
                <p className="text-sm text-gray-500">{user.pronouns}</p>
              )}
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Info className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Quick Info */}
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

          {/* Bio */}
          {user.bio && (
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {user.bio}
            </p>
          )}

          {/* Relationship Goals */}
          {user.relationshipGoals && (
            <div className="mb-4">
              <div className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                {user.relationshipGoals}
              </div>
            </div>
          )}

          {/* Interests */}
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

        {/* Action Buttons */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6">
          {/* Pass Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPass();
            }}
            className="w-14 h-14 bg-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group hover:scale-110"
          >
            <X className="w-7 h-7 text-red-500 group-hover:scale-110 transition-transform" />
          </button>

          {/* Super Like Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSuperLike();
            }}
            className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group hover:scale-110"
          >
            <Star className="w-6 h-6 text-white fill-white group-hover:scale-110 transition-transform" />
          </button>

          {/* Like Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            className="w-14 h-14 bg-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group hover:scale-110"
          >
            <Heart className="w-7 h-7 text-pink-500 group-hover:scale-110 group-hover:fill-pink-500 transition-all" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default UserCard;