import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
  username?: string;
  profilePicture?: string;
  onLike?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  isOwnPost?: boolean;
  liked?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  username,
  profilePicture,
  onLike,
  onEdit,
  onDelete,
  isOwnPost = false,
  liked = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
    >
      {/* Post Image */}
      <div className="relative">
        <img
          src={post.image}
          alt="Post"
          className="w-full h-64 object-cover"
        />
        {isOwnPost && (
          <div className="absolute top-4 right-4">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-white" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl z-10 border border-gray-200">
                  <button
                    onClick={() => {
                      onEdit?.(post);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.(post._id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike?.(post._id)}
              className={`flex items-center gap-2 transition-colors ${
                liked
                  ? 'text-pink-600'
                  : 'text-gray-600 hover:text-pink-600'
              }`}
            >
              <Heart
                className={`w-6 h-6 ${
                  liked ? 'fill-pink-600' : ''
                }`}
              />
              <span className="text-sm font-medium">
                {formatNumber(post.likes + (liked ? 1 : 0))}
              </span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors">
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm font-medium">
                {formatNumber(post.comments)}
              </span>
            </button>
            <button className="text-gray-600 hover:text-blue-600 transition-colors">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Post Caption */}
        <div>
          {username && (
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold">{username}</span>{' '}
              {post.caption}
            </p>
          )}
          {!username && post.caption && (
            <p className="text-sm text-gray-700 leading-relaxed">{post.caption}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">{formatDate(post.createdAt)}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;


