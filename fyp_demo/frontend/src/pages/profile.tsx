import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Edit2, X, Save, Plus, Image as ImageIcon, Settings, LogOut } from 'lucide-react';
import { userService } from '../services/userService';
import type { User, Post, ProfileUpdateData, PostData } from '../types';
import PostCard from '../components/PostCard';
import Button from '../components/Button';
import Input from '../components/Input';
import ProfileCompletion from '../components/ProfileCompletion';
import ImageUpload from '../components/ImageUpload';
import { ProfileSkeleton, PostSkeleton } from '../components/SkeletonLoader';
import toast, { Toaster } from 'react-hot-toast';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Post form states
  const [postImage, setPostImage] = useState('');
  const [postCaption, setPostCaption] = useState('');

  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        return userData._id || userData.id;
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      toast.error('Please login to view profile');
      setLoading(false);
      setTimeout(() => navigate('/'), 2000);
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
        toast.success('✨ Profile updated successfully!', {
          icon: '🎉',
          duration: 3000,
        });
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
        toast.success('📸 Post added successfully!');
        setIsAddingPost(false);
        setPostImage('');
        setPostCaption('');
        loadProfile();
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
        toast.success('🗑️ Post deleted successfully!');
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('👋 Logged out successfully!');
    navigate('/');
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="h-8 bg-gray-200 rounded-lg w-32"></div>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <ProfileSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Toaster position="top-center" />
      
      {/* Enhanced Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-50 backdrop-blur-lg bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Capella
            </h1>
            <div className="flex items-center gap-4">
              <a href="/home" className="px-4 py-2 text-gray-600 hover:text-pink-600 transition-colors font-medium">
                Home
              </a>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:text-pink-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 cursor-pointer ring-2 ring-pink-200 hover:ring-4 transition-all"></div>
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-[200px] z-50"
          >
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Header with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="relative">
            {/* Enhanced Cover Image */}
            <div className="relative h-72 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600">
              {coverImage && (
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              
              {/* Profile Info Overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-end gap-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative"
                  >
                    <img
                      src={profilePicture || defaultAvatar}
                      alt={user.username || user.email}
                      className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-2xl"
                    />
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white"></div>
                  </motion.div>
                  
                  <div className="flex-1 text-white pb-2">
                    <h2 className="font-bold text-3xl mb-1">
                      {user.username || user.email.split('@')[0]}
                    </h2>
                    <p className="text-sm opacity-90 mb-2">{user.email}</p>
                    {user.bio && (
                      <p className="text-sm opacity-95 max-w-2xl">{user.bio}</p>
                    )}
                  </div>
                  
                  {!isEditingProfile && (
                    <Button onClick={openEditProfile} className="mb-2">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Completion Card */}
        <ProfileCompletion 
          user={user} 
          onNavigateToAbout={() => navigate('/about')}
        />

        {/* About Me Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-gray-800">About Me</h3>
            <button
              onClick={() => navigate('/about')}
              className="text-sm text-pink-600 hover:text-purple-600 font-semibold flex items-center gap-1"
            >
              {user.about ? 'View Full Profile' : 'Complete About'} →
            </button>
          </div>
          <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
            {user.about || "Tell your story, share your passions, what you're looking for..."}
          </p>
        </motion.div>

        {/* Edit Profile Modal with Enhanced Image Upload */}
        <AnimatePresence>
          {isEditingProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={cancelEdit}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      Edit Profile
                    </h3>
                    <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <Input
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                  />

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Bio</label>
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

                  <ImageUpload
                    label="Profile Picture"
                    value={profilePicture}
                    onChange={setProfilePicture}
                    aspectRatio="square"
                  />

                  <ImageUpload
                    label="Cover Image"
                    value={coverImage}
                    onChange={setCoverImage}
                    aspectRatio="cover"
                  />

                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <p className="text-sm text-purple-700">
                      💡 <strong>Complete your About Me</strong> section for better matches!{' '}
                      <button
                        onClick={() => navigate('/about')}
                        className="text-purple-600 hover:text-purple-800 font-semibold underline"
                      >
                        Go to About →
                      </button>
                    </p>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-3xl flex gap-4">
                  <Button onClick={cancelEdit} variant="outline" fullWidth>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateProfile} fullWidth>
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={cancelEdit}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">
                      {editingPost ? 'Edit Post' : 'Create Post'}
                    </h3>
                    <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <ImageUpload
                    label="Post Image"
                    value={postImage}
                    onChange={setPostImage}
                    aspectRatio="square"
                  />
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Caption</label>
                    <textarea
                      value={postCaption}
                      onChange={(e) => setPostCaption(e.target.value)}
                      placeholder="What's on your mind?"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-3xl flex gap-4 border-t border-gray-200">
                  <Button onClick={cancelEdit} variant="outline" fullWidth>
                    Cancel
                  </Button>
                  <Button onClick={editingPost ? handleUpdatePost : handleAddPost} fullWidth>
                    <Save className="w-4 h-4 mr-2" />
                    {editingPost ? 'Update Post' : 'Publish'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
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
              New Post
            </Button>
          </div>

          {user.posts && user.posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.posts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PostCard
                    post={post}
                    username={user.username || user.email.split('@')[0]}
                    profilePicture={user.profilePicture}
                    onLike={handleToggleLike}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                    isOwnPost={true}
                    liked={likedPosts.has(post._id)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl shadow-lg p-12 text-center border-2 border-dashed border-pink-200"
            >
              <ImageIcon className="w-20 h-20 text-pink-400 mx-auto mb-4" />
              <h4 className="text-2xl font-bold text-gray-800 mb-2">No posts yet</h4>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start sharing your moments with the world and connect with others!
              </p>
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
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;