import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Edit2, Camera, X, Save, Plus, Image as ImageIcon } from 'lucide-react';
import { userService } from '../services/userService';
import type { User, Post, ProfileUpdateData, PostData } from '../types';
import PostCard from '../components/PostCard';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Form states
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Post form states
  const [postImage, setPostImage] = useState('');
  const [postCaption, setPostCaption] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  // Get current user from localStorage (you might want to get this from auth context)
  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        const userId = userData._id || userData.id;
        if (!userId) {
          console.warn('User ID not found in localStorage. User needs to log in again.');
          toast.error('Please log out and log back in to access your profile');
        }
        return userId;
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        return null;
      }
    }
    return null;
  };

  // Load user profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      toast.error('Please login to view profile');
      setLoading(false);
      // Redirect to login if no user ID
      setTimeout(() => {
        navigate('/');
      }, 2000);
      return;
    }

    try {
      setLoading(true);
      const response = await userService.getUserProfile(userId);
      if (response.success && response.user) {
        setUser(response.user);
        setUsername(response.user.username || '');
        setBio(response.user.bio || '');
        setProfilePicture(response.user.profilePicture || '');
        setCoverImage(response.user.coverImage || '');
      } else {
        toast.error(response.error || 'Failed to load profile');
      }
    } catch (error: any) {
      console.error('Profile load error:', error);
      toast.error(error.message || 'Failed to load profile');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const updateData: ProfileUpdateData = {
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        profilePicture: profilePicture.trim() || undefined,
        coverImage: coverImage.trim() || undefined,
      };

      const response = await userService.updateProfile(userId, updateData);
      if (response.success && response.user) {
        setUser(response.user);
        setIsEditingProfile(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleAddPost = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    if (!postImage.trim()) {
      toast.error('Please provide an image URL');
      return;
    }

    try {
      const postData: PostData = {
        image: postImage.trim(),
        caption: postCaption.trim() || '',
      };

      const response = await userService.addPost(userId, postData);
      if (response.success) {
        toast.success('Post added successfully!');
        setIsAddingPost(false);
        setPostImage('');
        setPostCaption('');
        loadProfile(); // Reload to get new post
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add post');
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const postData: Partial<PostData> = {
        image: postImage.trim() || editingPost.image,
        caption: postCaption.trim() || editingPost.caption,
      };

      const response = await userService.updatePost(userId, editingPost._id, postData);
      if (response.success) {
        toast.success('Post updated successfully!');
        setEditingPost(null);
        setPostImage('');
        setPostCaption('');
        loadProfile();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const response = await userService.deletePost(userId, postId);
      if (response.success) {
        toast.success('Post deleted successfully!');
        loadProfile();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete post');
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setPostImage(post.image);
    setPostCaption(post.caption);
    setIsAddingPost(false);
  };

  const handleToggleLike = (postId: string) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) {
      newLiked.delete(postId);
    } else {
      newLiked.add(postId);
    }
    setLikedPosts(newLiked);
  };

  const openEditProfile = () => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setProfilePicture(user.profilePicture || '');
      setCoverImage(user.coverImage || '');
    }
    setIsEditingProfile(true);
  };

  const cancelEdit = () => {
    setIsEditingProfile(false);
    setIsAddingPost(false);
    setEditingPost(null);
    setPostImage('');
    setPostCaption('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
        </div>
      </div>
    );
  }

  const defaultAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop';
  const defaultCover = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=600&fit=crop';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Toaster position="top-center" />
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Capella
            </h1>
            <div className="flex items-center gap-4">
              <a href="/home" className="px-4 py-2 text-gray-600 hover:text-pink-600 transition-colors">
                Home
              </a>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 cursor-pointer"></div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="relative">
            {/* Cover Image */}
            <div className="relative h-64 bg-gradient-to-r from-pink-500 to-purple-600">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-pink-500 to-purple-600"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              {/* Edit Cover Button */}
              {isEditingProfile && (
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              )}
              <input
                ref={coverInputRef}
                type="text"
                className="hidden"
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Cover image URL"
              />

              {/* Profile Picture and Info */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-end gap-4">
                  <div className="relative">
                    <img
                      src={profilePicture || defaultAvatar}
                      alt={user.username || user.email}
                      className="w-24 h-24 rounded-full border-4 border-white object-cover"
                    />
                    {isEditingProfile && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-pink-600 hover:bg-pink-700 rounded-full p-2 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="text"
                      className="hidden"
                      onChange={(e) => setProfilePicture(e.target.value)}
                      placeholder="Profile picture URL"
                    />
                  </div>
                  <div className="flex-1 text-white">
                    <h2 className="font-bold text-2xl">
                      {user.username || user.email.split('@')[0]}
                    </h2>
                    <p className="text-sm opacity-90">
                      {user.email}
                    </p>
                    {user.bio && (
                      <p className="text-sm mt-2 opacity-90">{user.bio}</p>
                    )}
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={openEditProfile}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Me preview section (always visible on profile page) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-800">About Me</h3>
            <button
              onClick={() => navigate('/about')}
              className="text-sm text-pink-600 hover:text-purple-600 underline flex items-center gap-1"
            >
              {user.about ? 'Read more' : 'Add About'} →
            </button>
          </div>
          <p className="text-gray-700 text-sm line-clamp-3">
            {user.about || "Tell your story, share your passions, what you're looking for..."}
          </p>
        </div>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {isEditingProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={cancelEdit}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Edit Profile</h3>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/*//space increased from y 4-6*/}
                <div className="space-y-6">  

                  {/*user name field*/}
                  <Input
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                  />

                  {/*short description for bio*/}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">{bio.length}/500</p>
                  </div>

                  {/*profile pircture url*/}
                  <Input
                    label="Profile Picture URL"
                    value={profilePicture}
                    onChange={(e) => setProfilePicture(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />

                  {/*cover pircture url*/}
                  <Input
                    label="Cover Image URL"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                  />

              {/* About page Preview */}
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
             <h4 className="font-semibold text-white">About Me</h4>
             <button
              onClick={() => navigate('/about')} // or '/profile/about'//
              className="text-sm text-white/90 hover:text-white underline flex items-center gap-1"
    >
              {user.about ? 'View more' : 'Add About'} →
             </button>
             </div>
  
             <p className="text-white/90 text-sm line-clamp-3">
              {user.about || "Tell your story, share your passions, what you're looking for..."}
             </p>
            </div>
            </div>
            

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateProfile}
                    fullWidth
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Post Modal */}
        <AnimatePresence>
          {(isAddingPost || editingPost) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={cancelEdit}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">
                    {editingPost ? 'Edit Post' : 'Add New Post'}
                  </h3>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Image URL"
                    value={postImage}
                    onChange={(e) => setPostImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    icon={<ImageIcon className="w-4 h-4" />}
                  />
                  {postImage && (
                    <img
                      src={postImage}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Caption
                    </label>
                    <textarea
                      value={postCaption}
                      onChange={(e) => setPostCaption(e.target.value)}
                      placeholder="What's on your mind?"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingPost ? handleUpdatePost : handleAddPost}
                    fullWidth
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPost ? 'Update Post' : 'Add Post'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts Section */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-800">My Posts</h3>
          <Button
            onClick={() => {
              setIsAddingPost(true);
              setEditingPost(null);
              setPostImage('');
              setPostCaption('');
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Post
          </Button>
        </div>

        {user.posts && user.posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user.posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                username={user.username || user.email.split('@')[0]}
                profilePicture={user.profilePicture}
                onLike={handleToggleLike}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                isOwnPost={true}
                liked={likedPosts.has(post._id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h4>
            <p className="text-gray-500 mb-6">Start sharing your moments with the world!</p>
            <Button
              onClick={() => {
                setIsAddingPost(true);
                setEditingPost(null);
                setPostImage('');
                setPostCaption('');
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Post
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;


