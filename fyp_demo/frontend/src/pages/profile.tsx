import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Edit2, X, Save, Plus, Image as ImageIcon,
  Settings, LogOut, Camera, MapPin, Heart,
  Grid3X3, BookOpen, ChevronRight, Loader2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { userService } from '../services/userService';
import api from '../services/api';
import type { User, Post, ProfileUpdateData } from '../types';
import PostCard from '../components/PostCard';
import Button from '../components/Button';
import Input from '../components/Input';
import ProfileCompletion from '../components/ProfileCompletion';
import ImageUpload from '../components/ImageUpload';
import { ProfileSkeleton, PostSkeleton } from '../components/SkeletonLoader';
import PhotoCarousel from '../components/PhotoCarousel';

// ─── Design tokens ───────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');`;

const Profile: React.FC = () => {
  const navigate = useNavigate();

  // ── State (unchanged from original) ──────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingGallery, setIsEditingGallery] = useState(false);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingPost, setIsUploadingPost] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryPhotoFiles, setGalleryPhotoFiles] = useState<File[]>([]);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profilePictureFiles, setProfilePictureFiles] = useState<File[]>([]);
  const [coverImageFiles, setCoverImageFiles] = useState<File[]>([]);
  const [postImageFiles, setPostImageFiles] = useState<File[]>([]);
  const [postCaption, setPostCaption] = useState('');

  // ── Auth helper (unchanged) ───────────────────────────────────────────────
  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        return userData._id || userData.id;
      } catch {
        return null;
      }
    }
    return null;
  };

  // ── Data fetching (unchanged) ─────────────────────────────────────────────
  useEffect(() => { loadProfile(); }, []);

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
        setExistingGalleryUrls(response.user.photos || []);
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

  // ── Upload helpers (all unchanged) ───────────────────────────────────────
  const uploadProfilePicture = async (file: File): Promise<string | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    const formData = new FormData();
    formData.append('image', file);
    try {
      setIsUploadingProfile(true);
      const response = await api.post(`/profile/${userId}/profile-picture`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) return response.data.profilePicture;
      return null;
    } catch {
      toast.error('Failed to upload profile picture');
      return null;
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    const formData = new FormData();
    formData.append('image', file);
    try {
      setIsUploadingCover(true);
      const response = await api.post(`/profile/${userId}/cover-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) return response.data.coverImage;
      return null;
    } catch {
      toast.error('Failed to upload cover image');
      return null;
    } finally {
      setIsUploadingCover(false);
    }
  };

  const uploadGalleryPhotos = async (files: File[]): Promise<string[] | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));
    try {
      const response = await api.post(`/profile/${userId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) return response.data.photos;
      return null;
    } catch {
      toast.error('Failed to upload gallery photos');
      return null;
    }
  };

  const deleteCarouselPhoto = async (photoUrl: string) => {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      const response = await api.delete(`/profile/${userId}/photos`, { data: { photoUrl } });
      if (response.data.success) {
        setExistingGalleryUrls(response.data.photos);
        toast.success('Photo removed successfully');
      }
    } catch {
      toast.error('Failed to delete photo');
    }
  };

  // ── Business logic handlers (all unchanged) ───────────────────────────────
  const handleUpdateProfile = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      let profilePictureUrl = user?.profilePicture;
      let coverImageUrl = user?.coverImage;
      if (profilePictureFiles.length > 0) {
        const url = await uploadProfilePicture(profilePictureFiles[0]);
        if (url) profilePictureUrl = url;
      }
      if (coverImageFiles.length > 0) {
        const url = await uploadCoverImage(coverImageFiles[0]);
        if (url) coverImageUrl = url;
      }
      const updateData: ProfileUpdateData = {
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        profilePicture: profilePictureUrl,
        coverImage: coverImageUrl,
      };
      const response = await userService.updateProfile(userId, updateData);
      if (response.success && response.user) {
        setUser(response.user);
        setIsEditingProfile(false);
        setProfilePictureFiles([]);
        setCoverImageFiles([]);
        toast.success('✨ Profile updated successfully!', { icon: '🎉', duration: 3000 });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleUpdateGallery = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      setIsUploadingGallery(true);
      if (galleryPhotoFiles.length > 0) {
        const urls = await uploadGalleryPhotos(galleryPhotoFiles);
        if (urls) {
          setExistingGalleryUrls(urls);
          setGalleryPhotoFiles([]);
          toast.success('📸 Gallery updated successfully!');
          await loadProfile();
        }
      }
      setIsEditingGallery(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update gallery');
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleAddPost = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    if (postImageFiles.length === 0) { toast.error('Please select an image'); return; }
    try {
      setIsUploadingPost(true);
      const formData = new FormData();
      postImageFiles.forEach(file => formData.append('images', file));
      formData.append('caption', postCaption.trim() || '');
      const token = localStorage.getItem('token');
      const res = await api.post(`/profile/${userId}/posts`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        toast.success('📸 Post added successfully!');
        setIsAddingPost(false);
        setPostImageFiles([]);
        setPostCaption('');
        loadProfile();
      } else {
        toast.error(res.data?.error || 'Failed to add post');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error.message || 'Failed to add post');
    } finally {
      setIsUploadingPost(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      setIsUploadingPost(true);
      const formData = new FormData();
      if (postImageFiles.length > 0) {
        postImageFiles.forEach(file => formData.append('images', file));
      }
      formData.append('caption', postCaption.trim() || editingPost.caption);
      const response = await api.put(`/profile/${userId}/posts/${editingPost._id}`, formData);
      if (response.data.success) {
        toast.success('🎉 Post updated successfully!');
        setEditingPost(null);
        setPostImageFiles([]);
        setPostCaption('');
        loadProfile();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update post');
    } finally {
      setIsUploadingPost(false);
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
    setPostCaption(post.caption);
    setPostImageFiles([]);
    setIsAddingPost(false);
  };

  const handleToggleLike = (postId: string) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) { newLiked.delete(postId); } else { newLiked.add(postId); }
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
      setProfilePictureFiles([]);
      setCoverImageFiles([]);
    }
    setIsEditingProfile(true);
  };

  const openEditGallery = () => {
    if (user) {
      setExistingGalleryUrls(user.photos || []);
      setGalleryPhotoFiles([]);
    }
    setIsEditingGallery(true);
  };

  const cancelEdit = () => {
    setIsEditingProfile(false);
    setIsEditingGallery(false);
    setIsAddingPost(false);
    setEditingPost(null);
    setPostImageFiles([]);
    setPostCaption('');
    setProfilePictureFiles([]);
    setCoverImageFiles([]);
    setGalleryPhotoFiles([]);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <style>{FONTS}</style>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-slate-500 text-sm font-medium" style={{ fontFamily: "'DM Sans', system-ui" }}>
            Loading your profile…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <style>{FONTS}</style>
        <div className="text-center">
          <p className="text-slate-500" style={{ fontFamily: "'DM Sans', system-ui" }}>User not found</p>
        </div>
      </div>
    );
  }

  const displayName = user.username || user.email.split('@')[0];
  const avatarFallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;

  // ── Shared modal wrapper styles ───────────────────────────────────────────
  const modalBackdrop = "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4";
  const modalPanel = "bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden";

  return (
    <div
      className="min-h-screen bg-[#faf9f7]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{FONTS}</style>
      <Toaster position="top-center" />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1
            className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Capella
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="text-sm font-medium text-slate-500 hover:text-rose-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-rose-50"
            >
              Home
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 min-w-[180px] z-50"
                  >
                    <button
                      onClick={() => { setShowSettings(false); navigate('/settings'); }}
                      className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar dot */}
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-rose-200">
              <img
                src={user.profilePicture || avatarFallback}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Hero Card ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Cover */}
          <div className="relative h-56 sm:h-72 bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500">
            {user.coverImage && (
              <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Edit Profile button — top-right on cover */}
            <button
              onClick={openEditProfile}
              className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 backdrop-blur-md text-white text-sm font-semibold px-4 py-2 rounded-2xl border border-white/30 hover:bg-white/30 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          </div>

          {/* Avatar + name row */}
          <div className="px-6 pb-6 relative">
            {/* Avatar overlaps cover */}
            <div className="flex items-end justify-between -mt-12 mb-4">
              <motion.div whileHover={{ scale: 1.03 }} className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl">
                  <img
                    src={user.profilePicture || avatarFallback}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>

              {/* Stats row */}
              <div className="flex gap-4 text-center pb-1">
                <div>
                  <p className="text-xl font-bold text-slate-900 leading-none">{user.posts?.length ?? 0}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Posts</p>
                </div>
                <div className="w-px bg-slate-100" />
                <div>
                  <p className="text-xl font-bold text-slate-900 leading-none">{user.photos?.length ?? 0}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Photos</p>
                </div>
              </div>
            </div>

            {/* Name / bio */}
            <h2
              className="text-2xl font-bold text-slate-900 mb-0.5"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {displayName}
            </h2>
            <p className="text-xs text-slate-400 mb-3">{user.email}</p>

            {user.bio ? (
              <p className="text-sm text-slate-600 leading-relaxed max-w-xl">{user.bio}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">No bio yet — tap Edit Profile to add one</p>
            )}
          </div>
        </motion.div>

        {/* ── Profile Completion ──────────────────────────────────────────── */}
        <ProfileCompletion
          user={user}
          onNavigateToAbout={() => navigate('/about')}
        />

        {/* ── About Me preview ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800">About Me</h3>
            </div>
            <button
              onClick={() => navigate('/about')}
              className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-pink-600 transition-colors"
            >
              {user.about ? 'View Full' : 'Complete'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
            {user.about || "Tell your story, share your passions, what you're looking for…"}
          </p>
        </motion.div>

        {/* ── Photo Gallery Carousel ─────────────────────────────────────── */}
        {(user.photos && user.photos.length > 0) || isEditingGallery ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Grid3X3 className="w-4 h-4 text-purple-500" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Photo Gallery</h3>
              </div>
              {!isEditingGallery && (
                <button
                  onClick={openEditGallery}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Manage
                </button>
              )}
            </div>
            {user.photos && user.photos.length > 0 && (
              <PhotoCarousel photos={user.photos} />
            )}
          </motion.div>
        ) : (
          /* Teaser card when no gallery yet */
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            onClick={openEditGallery}
            className="w-full bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 p-6 flex flex-col items-center gap-3 hover:border-purple-300 hover:bg-purple-50/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Camera className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Add Photo Gallery</p>
              <p className="text-xs text-slate-400 mt-0.5">Share up to 10 photos in a carousel</p>
            </div>
          </motion.button>
        )}

        {/* ── Posts Section ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
                <Heart className="w-4 h-4 text-pink-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800">My Posts</h3>
            </div>
            <button
              onClick={() => {
                setIsAddingPost(true);
                setEditingPost(null);
                setPostImageFiles([]);
                setPostCaption('');
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-rose-300/40 hover:from-rose-600 hover:to-pink-600 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Post
            </button>
          </div>

          {user.posts && user.posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {user.posts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <PostCard
                    post={post}
                    username={displayName}
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
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center hover:border-rose-200 hover:bg-rose-50/30 transition-all cursor-pointer group"
              onClick={() => {
                setIsAddingPost(true);
                setEditingPost(null);
                setPostImageFiles([]);
                setPostCaption('');
              }}
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-100 transition-colors">
                <ImageIcon className="w-8 h-8 text-rose-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">No posts yet</h4>
              <p className="text-sm text-slate-400 mb-5">Share your moments with your matches</p>
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-rose-300/40">
                <Plus className="w-4 h-4" />
                Create Your First Post
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODALS — logic and props identical to original, styling upgraded    */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={modalBackdrop}
            onClick={cancelEdit}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 24 }}
              onClick={(e) => e.stopPropagation()}
              className={modalPanel}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
                <h3
                  className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Edit Profile
                </h3>
                <button onClick={cancelEdit} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <Input
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share something about yourself…"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none transition-all resize-none text-sm text-slate-700"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/500</p>
                </div>

                <ImageUpload
                  label="Profile Picture"
                  files={profilePictureFiles}
                  onFilesChange={setProfilePictureFiles}
                  multiple={false}
                  maxFiles={1}
                  aspectRatio="square"
                  helperText="Upload your profile picture"
                />

                <ImageUpload
                  label="Cover Image"
                  files={coverImageFiles}
                  onFilesChange={setCoverImageFiles}
                  multiple={false}
                  maxFiles={1}
                  aspectRatio="cover"
                  helperText="Upload your cover image"
                />

                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                  <p className="text-sm text-rose-700">
                    💡 <strong>Complete your About Me</strong> section for better matches!{' '}
                    <button
                      onClick={() => navigate('/about')}
                      className="text-rose-600 font-semibold underline hover:text-rose-800"
                    >
                      Go to About
                    </button>
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <p className="text-sm text-purple-700">
                    📸 <strong>Manage your photo gallery</strong> separately using the Manage button in the gallery section
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-3xl">
                <Button onClick={cancelEdit} variant="outline" fullWidth>Cancel</Button>
                <Button onClick={handleUpdateProfile} fullWidth isLoading={isUploadingProfile || isUploadingCover}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Gallery Modal */}
      <AnimatePresence>
        {isEditingGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={modalBackdrop}
            onClick={cancelEdit}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
                <h3
                  className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Manage Gallery
                </h3>
                <button onClick={cancelEdit} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <ImageUpload
                  label="Gallery Photos"
                  files={galleryPhotoFiles}
                  onFilesChange={setGalleryPhotoFiles}
                  existingUrls={existingGalleryUrls}
                  onUrlRemove={deleteCarouselPhoto}
                  multiple={true}
                  maxFiles={10}
                  aspectRatio="square"
                  helperText="Your carousel gallery (Max 10 photos)"
                />
              </div>

              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-3xl">
                <Button onClick={cancelEdit} variant="outline" fullWidth>Cancel</Button>
                <Button
                  onClick={handleUpdateGallery}
                  fullWidth
                  isLoading={isUploadingGallery}
                  disabled={galleryPhotoFiles.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Gallery
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Post Modal */}
      <AnimatePresence>
        {(isAddingPost || editingPost) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={modalBackdrop}
            onClick={cancelEdit}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 24 }}
              onClick={(e) => e.stopPropagation()}
              className={modalPanel}
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
                <h3
                  className="text-xl font-bold text-slate-900"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {editingPost ? 'Edit Post' : 'New Post'}
                </h3>
                <button onClick={cancelEdit} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {editingPost && editingPost.images && editingPost.images.length > 0 && postImageFiles.length === 0 && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Current Images</label>
                    <div className="grid grid-cols-2 gap-2">
                      {editingPost.images.map((img, idx) => (
                        <img key={idx} src={img} alt={`Post ${idx + 1}`} className="w-full h-32 object-cover rounded-xl" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Upload new images to replace these</p>
                  </div>
                )}

                <ImageUpload
                  label={editingPost ? 'Replace Post Images (optional)' : 'Post Images'}
                  files={postImageFiles}
                  onFilesChange={setPostImageFiles}
                  multiple={true}
                  maxFiles={5}
                  aspectRatio="square"
                  helperText="Select pictures for your post (Max 5)"
                />

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Caption</label>
                  <textarea
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none transition-all resize-none text-sm text-slate-700"
                    rows={3}
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-3xl">
                <Button onClick={cancelEdit} variant="outline" fullWidth>Cancel</Button>
                <Button
                  onClick={editingPost ? handleUpdatePost : handleAddPost}
                  fullWidth
                  isLoading={isUploadingPost}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingPost ? 'Update Post' : 'Post'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
