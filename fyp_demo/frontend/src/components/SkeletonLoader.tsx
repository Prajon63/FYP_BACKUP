import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'profile' | 'post' | 'card' | 'text' | 'circle' | 'rectangle';
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'rectangle',
  count = 1,
  className = '',
}) => {
  const Shimmer = () => (
    <motion.div
      animate={{
        x: ['-100%', '100%'],
      }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear',
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent will-change-transform"
    />
  );

  const ProfileSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Cover Image */}
      <div className="relative h-64 bg-gray-200 overflow-hidden">
        <Shimmer />
      </div>
      
      {/* Profile Content */}
      <div className="p-6 space-y-4">
        {/* Avatar & Name */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 relative overflow-hidden">
            <Shimmer />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded-lg w-32 relative overflow-hidden">
              <Shimmer />
            </div>
            <div className="h-3 bg-gray-200 rounded-lg w-24 relative overflow-hidden">
              <Shimmer />
            </div>
          </div>
        </div>

        {/* Bio Lines */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded-lg w-full relative overflow-hidden">
            <Shimmer />
          </div>
          <div className="h-3 bg-gray-200 rounded-lg w-5/6 relative overflow-hidden">
            <Shimmer />
          </div>
        </div>
      </div>
    </div>
  );

  const PostSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Post Image */}
      <div className="relative h-64 bg-gray-200 overflow-hidden">
        <Shimmer />
      </div>
      
      {/* Post Content */}
      <div className="p-4 space-y-3">
        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-16 bg-gray-200 rounded-lg relative overflow-hidden">
              <Shimmer />
            </div>
          ))}
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded-lg w-full relative overflow-hidden">
            <Shimmer />
          </div>
          <div className="h-3 bg-gray-200 rounded-lg w-3/4 relative overflow-hidden">
            <Shimmer />
          </div>
        </div>

        {/* Timestamp */}
        <div className="h-2 bg-gray-200 rounded-lg w-20 relative overflow-hidden">
          <Shimmer />
        </div>
      </div>
    </div>
  );

  const CardSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <div className="h-4 bg-gray-200 rounded-lg w-32 relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded-lg w-full relative overflow-hidden">
          <Shimmer />
        </div>
        <div className="h-3 bg-gray-200 rounded-lg w-5/6 relative overflow-hidden">
          <Shimmer />
        </div>
        <div className="h-3 bg-gray-200 rounded-lg w-4/6 relative overflow-hidden">
          <Shimmer />
        </div>
      </div>
    </div>
  );

  const TextSkeleton = () => (
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded-lg w-full relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="h-3 bg-gray-200 rounded-lg w-5/6 relative overflow-hidden">
        <Shimmer />
      </div>
    </div>
  );

  const CircleSkeleton = () => (
    <div className={`rounded-full bg-gray-200 relative overflow-hidden ${className}`}>
      <Shimmer />
    </div>
  );

  const RectangleSkeleton = () => (
    <div className={`bg-gray-200 rounded-lg relative overflow-hidden ${className}`}>
      <Shimmer />
    </div>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'profile':
        return <ProfileSkeleton />;
      case 'post':
        return <PostSkeleton />;
      case 'card':
        return <CardSkeleton />;
      case 'text':
        return <TextSkeleton />;
      case 'circle':
        return <CircleSkeleton />;
      case 'rectangle':
        return <RectangleSkeleton />;
      default:
        return <RectangleSkeleton />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

export default SkeletonLoader;

// Export individual skeleton components for convenience
export const ProfileSkeleton = () => <SkeletonLoader variant="profile" />;
export const PostSkeleton = () => <SkeletonLoader variant="post" />;
export const CardSkeleton = () => <SkeletonLoader variant="card" />;
export const TextSkeleton = () => <SkeletonLoader variant="text" />;