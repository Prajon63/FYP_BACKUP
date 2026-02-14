
// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useNavigate } from 'react-router-dom';
// import { Edit2, X, Save, Plus, Image as ImageIcon, Settings, LogOut } from 'lucide-react';
// import toast, { Toaster } from 'react-hot-toast';
// import { userService } from '../services/userService';
// import api from '../services/api';
// import type { User, Post, ProfileUpdateData, PostData } from '../types';
// import PostCard from '../components/PostCard';
// import Button from '../components/Button';
// import Input from '../components/Input';
// import ProfileCompletion from '../components/ProfileCompletion';
// import ImageUpload from '../components/ImageUpload';
// import { ProfileSkeleton, PostSkeleton } from '../components/SkeletonLoader';
// import PhotoCarousel from '../components/PhotoCarousel';

// const Profile: React.FC = () => {
//   const navigate = useNavigate();
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [isEditingProfile, setIsEditingProfile] = useState(false);
//   const [isAddingPost, setIsAddingPost] = useState(false);
//   const [editingPost, setEditingPost] = useState<Post | null>(null);
//   const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
//   const [showSettings, setShowSettings] = useState(false);
//   const [isUploadingProfile, setIsUploadingProfile] = useState(false);
//   const [isUploadingCover, setIsUploadingCover] = useState(false);
//   const [isUploadingPost, setIsUploadingPost] = useState(false);
//   const [galleryPhotoFiles, setGalleryPhotoFiles] = useState<File[]>([]);  //a new state for carousel

//   // Form states
//   const [username, setUsername] = useState('');
//   const [bio, setBio] = useState('');

//   // File states for uploads
//   const [profilePictureFiles, setProfilePictureFiles] = useState<File[]>([]);
//   const [coverImageFiles, setCoverImageFiles] = useState<File[]>([]);
//   const [postImageFiles, setPostImageFiles] = useState<File[]>([]);

//   // Post form states
//   const [postCaption, setPostCaption] = useState('');

//   const getCurrentUserId = () => {
//     const userStr = localStorage.getItem('user');
//     if (userStr) {
//       try {
//         const userData = JSON.parse(userStr);
//         return userData._id || userData.id;
//       } catch (error) {
//         return null;
//       }
//     }
//     return null;
//   };

//   useEffect(() => {
//     loadProfile();
//   }, []);

//   const loadProfile = async () => {
//     const userId = getCurrentUserId();
//     if (!userId) {
//       toast.error('Please login to view profile');
//       setLoading(false);
//       setTimeout(() => navigate('/'), 2000);
//       return;
//     }

//     try {
//       setLoading(true);
//       const response = await userService.getUserProfile(userId);
//       if (response.success && response.user) {
//         setUser(response.user);
//         setUsername(response.user.username || '');
//         setBio(response.user.bio || '');
//       } else {
//         toast.error(response.error || 'Failed to load profile');
//       }
//     } catch (error: any) {
//       toast.error(error.message || 'Failed to load profile');
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Upload profile picture to Cloudinary
//   const uploadProfilePicture = async (file: File): Promise<string | null> => {
//     const userId = getCurrentUserId();
//     if (!userId) return null;

//     const formData = new FormData();
//     formData.append('image', file);

//     try {
//       setIsUploadingProfile(true);
//       const response = await api.post(`/profile/${userId}/profile-picture`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       if (response.data.success) {
//         return response.data.profilePicture;
//       }
//       return null;
//     } catch (error: any) {
//       toast.error('Failed to upload profile picture');
//       return null;
//     } finally {
//       setIsUploadingProfile(false);
//     }
//   };

//   // Upload cover image to Cloudinary
//   const uploadCoverImage = async (file: File): Promise<string | null> => {
//     const userId = getCurrentUserId();
//     if (!userId) return null;

//     const formData = new FormData();
//     formData.append('image', file);

//     try {
//       setIsUploadingCover(true);
//       const response = await api.post(`/profile/${userId}/cover-image`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       if (response.data.success) {
//         return response.data.coverImage;
//       }
//       return null;
//     } catch (error: any) {
//       toast.error('Failed to upload cover image');
//       return null;
//     } finally {
//       setIsUploadingCover(false);
//     }
//   };

//   //for photo carousel
//   // Upload gallery photos
//   const uploadGalleryPhotos = async (files: File[]): Promise<string[] | null> => {
//     const userId = getCurrentUserId();
//     if (!userId) return null;

//     const formData = new FormData();
//     files.forEach(file => {
//       formData.append('photos', file);
//     });

//     try {
//       const response = await api.post(`/profile/${userId}/photos`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       if (response.data.success) {
//         return response.data.photos;
//       }
//       return null;
//     } catch (error: any) {
//       toast.error('Failed to upload gallery photos');
//       return null;
//     }
//   };


//   const handleUpdateProfile = async () => {
//     const userId = getCurrentUserId();
//     if (!userId) return;

//     try {
//       let profilePictureUrl = user?.profilePicture;
//       let coverImageUrl = user?.coverImage;

//       // Upload profile picture if new file selected
//       if (profilePictureFiles.length > 0) {
//         const url = await uploadProfilePicture(profilePictureFiles[0]);
//         if (url) profilePictureUrl = url;
//       }

//       // Upload cover image if new file selected
//       if (coverImageFiles.length > 0) {
//         const url = await uploadCoverImage(coverImageFiles[0]);
//         if (url) coverImageUrl = url;
//       }

//       // Upload gallery photos if new files selected
//       if (galleryPhotoFiles.length > 0) {
//         const urls = await uploadGalleryPhotos(galleryPhotoFiles);
//         if (urls) {
//           // Photos will be saved by the backend endpoint
//           setGalleryPhotoFiles([]);
//         }
//       }

//       const updateData: ProfileUpdateData = {
//         username: username.trim() || undefined,
//         bio: bio.trim() || undefined,
//         profilePicture: profilePictureUrl,
//         coverImage: coverImageUrl,
//       };

//       const response = await userService.updateProfile(userId, updateData);
//       if (response.success && response.user) {
//         setUser(response.user);
//         setIsEditingProfile(false);
//         setProfilePictureFiles([]);
//         setCoverImageFiles([]);
//         toast.success('✨ Profile updated successfully!', {
//           icon: '🎉',
//           duration: 3000,
//         });
//       }
//     } catch (error: any) {
//       toast.error(error.message || 'Failed to update profile');
//     }
//   };

//   const handleAddPost = async () => {
//     const userId = getCurrentUserId();
//     if (!userId) return;

//     if (postImageFiles.length === 0) {
//       toast.error('Please select an image');
//       return;
//     }

//     try {


//       setIsUploadingPost(true);

//       const formData = new FormData();

//       postImageFiles.forEach((file) => {
//         formData.append('images', file);
//       });
//       formData.append('caption', postCaption.trim() || '');        // send caption in same request


//       const token = localStorage.getItem('token'); // Add this 
//       const res = await api.post(`/profile/${userId}/posts`, formData, {
//         headers: {
//           Authorization: `Bearer ${token}`, //  Add this
//         },
//       });

//       if (res.data?.success) {
//         toast.success('📸 Post added successfully!');
//         setIsAddingPost(false);
//         setPostImageFiles([]);
//         setPostCaption('');
//         loadProfile();
//       } else {
//         toast.error(res.data?.error || 'Failed to add post');
//       }
//     } catch (error: any) {
//       console.error('Add post error:', error); //  Add detailed logging
//       toast.error(error?.response?.data?.error || error.message || 'Failed to add post');
//     } finally {
//       setIsUploadingPost(false);
//     }

//   };

//   const handleUpdatePost = async () => {
//     if (!editingPost) return;
//     const userId = getCurrentUserId();
//     if (!userId) return;

//     try {
//       setIsUploadingPost(true);

//       const formData = new FormData();

//       // Add new images if selected
//       if (postImageFiles.length > 0) {
//         postImageFiles.forEach(file => {
//           formData.append('images', file);
//         });
//       }

//       formData.append('caption', postCaption.trim() || editingPost.caption);

//       const response = await api.put(`/profile/${userId}/posts/${editingPost._id}`, formData);

//       if (response.data.success) {
//         toast.success('🎉 Post updated successfully!');
//         setEditingPost(null);
//         setPostImageFiles([]);
//         setPostCaption('');
//         loadProfile();
//       }
//     } catch (error: any) {
//       toast.error(error.message || 'Failed to update post');
//     } finally {
//       setIsUploadingPost(false);
//     }
//   };


//   const handleDeletePost = async (postId: string) => {
//     if (!confirm('Are you sure you want to delete this post?')) return;

//     const userId = getCurrentUserId();
//     if (!userId) return;

//     try {
//       const response = await userService.deletePost(userId, postId);
//       if (response.success) {
//         toast.success('🗑️ Post deleted successfully!');
//         loadProfile();
//       }
//     } catch (error: any) {
//       toast.error(error.message || 'Failed to delete post');
//     }
//   };

//   const handleEditPost = (post: Post) => {
//     setEditingPost(post);
//     setPostCaption(post.caption);
//     setPostImageFiles([]);
//     setIsAddingPost(false);
//   };

//   const handleToggleLike = (postId: string) => {
//     const newLiked = new Set(likedPosts);
//     if (newLiked.has(postId)) {
//       newLiked.delete(postId);
//     } else {
//       newLiked.add(postId);
//     }
//     setLikedPosts(newLiked);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('user');
//     localStorage.removeItem('token');
//     toast.success('👋 Logged out successfully!');
//     navigate('/');
//   };

//   const openEditProfile = () => {
//     if (user) {
//       setUsername(user.username || '');
//       setBio(user.bio || '');
//       setProfilePictureFiles([]);
//       setCoverImageFiles([]);
//     }
//     setIsEditingProfile(true);
//   };

//   const cancelEdit = () => {
//     setIsEditingProfile(false);
//     setIsAddingPost(false);
//     setEditingPost(null);
//     setPostImageFiles([]);
//     setPostCaption('');
//     setProfilePictureFiles([]);
//     setCoverImageFiles([]);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
//         <nav className="bg-white shadow-md sticky top-0 z-50">
//           <div className="max-w-6xl mx-auto px-4 py-4">
//             <div className="h-8 bg-gray-200 rounded-lg w-32"></div>
//           </div>
//         </nav>
//         <div className="max-w-6xl mx-auto px-4 py-8">
//           <ProfileSkeleton />
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
//             <PostSkeleton />
//             <PostSkeleton />
//             <PostSkeleton />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
//         <div className="text-center">
//           <p className="text-gray-600">User not found</p>
//         </div>
//       </div>
//     );
//   }

//   const defaultAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop';

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
//       <Toaster position="top-center" />

//       {/* Enhanced Navigation Bar */}
//       <nav className="bg-white shadow-md sticky top-0 z-50 backdrop-blur-lg bg-white/95">
//         <div className="max-w-6xl mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
//               Capella
//             </h1>
//             <div className="flex items-center gap-4">
//               <a href="/home" className="px-4 py-2 text-gray-600 hover:text-pink-600 transition-colors font-medium">
//                 Home
//               </a>
//               <button
//                 onClick={() => setShowSettings(!showSettings)}
//                 className="p-2 text-gray-600 hover:text-pink-600 transition-colors"
//               >
//                 <Settings className="w-5 h-5" />
//               </button>
//               <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 cursor-pointer ring-2 ring-pink-200 hover:ring-4 transition-all"></div>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Settings Dropdown */}
//       <AnimatePresence>
//         {showSettings && (
//           <motion.div
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//             className="fixed top-20 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-[200px] z-50"
//           >
//             <button
//               onClick={handleLogout}
//               className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors"
//             >
//               <LogOut className="w-4 h-4" />
//               Logout
//             </button>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
//         {/* Profile Header */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="bg-white rounded-3xl shadow-xl overflow-hidden"
//         >
//           <div className="relative">
//             <div className="relative h-72 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600">
//               {user.coverImage && (
//                 <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
//               )}
//               <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

//               <div className="absolute bottom-6 left-6 right-6">
//                 <div className="flex items-end gap-6">
//                   <motion.div
//                     whileHover={{ scale: 1.05 }}
//                     className="relative"
//                   >
//                     <img
//                       src={user.profilePicture || defaultAvatar}
//                       alt={user.username || user.email}
//                       className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-2xl"
//                     />
//                     <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white"></div>
//                   </motion.div>

//                   <div className="flex-1 text-white pb-2">
//                     <h2 className="font-bold text-3xl mb-1">
//                       {user.username || user.email.split('@')[0]}
//                     </h2>
//                     <p className="text-sm opacity-90 mb-2">{user.email}</p>
//                     {user.bio && (
//                       <p className="text-sm opacity-95 max-w-2xl">{user.bio}</p>
//                     )}
//                   </div>

//                   {!isEditingProfile && (
//                     <Button onClick={openEditProfile} className="mb-2">
//                       <Edit2 className="w-4 h-4 mr-2" />
//                       Edit Profile
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </motion.div>

//         {/* Profile Completion Card */}
//         <ProfileCompletion
//           user={user}
//           onNavigateToAbout={() => navigate('/about')}
//         />

//         {/* About Me Preview */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//           className="bg-white rounded-2xl shadow-lg p-6"
//         >
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="text-xl font-semibold text-gray-800">About Me</h3>
//             <button
//               onClick={() => navigate('/about')}
//               className="text-sm text-pink-600 hover:text-purple-600 font-semibold flex items-center gap-1"
//             >
//               {user.about ? 'View Full Profile' : 'Complete About'}...
//             </button>
//           </div>
//           <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
//             {user.about || "Tell your story, share your passions, what you're looking for..."}
//           </p>
//         </motion.div>

//         {/* Photo Gallery Carousel/gallery concept */}
//         {user.photos && user.photos.length > 0 && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//             className="bg-white rounded-2xl shadow-lg p-6"
//           >
//             <PhotoCarousel photos={user.photos} />
//           </motion.div>
//         )}

//         {/* Edit Profile Modal */}
//         <AnimatePresence>
//           {isEditingProfile && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
//               onClick={cancelEdit}
//             >
//               <motion.div
//                 initial={{ scale: 0.9, opacity: 0, y: 20 }}
//                 animate={{ scale: 1, opacity: 1, y: 0 }}
//                 exit={{ scale: 0.9, opacity: 0, y: 20 }}
//                 onClick={(e) => e.stopPropagation()}
//                 className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
//               >
//                 <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl z-10">
//                   <div className="flex items-center justify-between">
//                     <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
//                       Edit Profile
//                     </h3>
//                     <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">
//                       <X className="w-6 h-6" />
//                     </button>
//                   </div>
//                 </div>

//                 <div className="p-6 space-y-6">
//                   <Input
//                     label="Username"
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value)}
//                     placeholder="Enter username"
//                   />

//                   <div>
//                     <label className="text-sm font-medium text-gray-700 mb-2 block">Bio</label>
//                     <textarea
//                       value={bio}
//                       onChange={(e) => setBio(e.target.value)}
//                       placeholder="Share something about yourself..."
//                       className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
//                       rows={4}
//                       maxLength={500}
//                     />
//                     <p className="text-xs text-gray-500 mt-1">{bio.length}/500</p>
//                   </div>

//                   <ImageUpload
//                     label="Profile Picture"
//                     files={profilePictureFiles}     //newly added
//                     onFilesChange={setProfilePictureFiles}
//                     maxFiles={1}
//                     aspectRatio="square"
//                     helperText="Upload your profile picture"
//                   />

//                   <ImageUpload
//                     label="Cover Image"
//                     files={coverImageFiles}
//                     onFilesChange={setCoverImageFiles}
//                     maxFiles={1}
//                     aspectRatio="cover"
//                     helperText="Upload your cover image"
//                   />

//                   {/* a new concept for carousel */}
//                   <ImageUpload
//                     label="Gallery Photos"
//                     files={galleryPhotoFiles}
//                     onFilesChange={setGalleryPhotoFiles}
//                     multiple={true}
//                     maxFiles={10}
//                     aspectRatio="square"
//                     helperText="Upload photos for your gallery carousel (up to 10)"
//                   />

//                   <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
//                     <p className="text-sm text-purple-700">
//                       💡 <strong>Complete your About Me</strong> section for better matches!{' '}
//                       <button
//                         onClick={() => navigate('/about')}
//                         className="text-purple-600 hover:text-purple-800 font-semibold underline"
//                       >
//                         Go to About...’
//                       </button>
//                     </p>
//                   </div>
//                 </div>

//                 <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-3xl flex gap-4">
//                   <Button onClick={cancelEdit} variant="outline" fullWidth>
//                     Cancel
//                   </Button>
//                   <Button
//                     onClick={handleUpdateProfile}
//                     fullWidth
//                     isLoading={isUploadingProfile || isUploadingCover}
//                   >
//                     <Save className="w-4 h-4 mr-2" />
//                     Save Changes
//                   </Button>
//                 </div>
//               </motion.div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Add/Edit Post Modal */}
//         <AnimatePresence>
//           {(isAddingPost || editingPost) && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
//               onClick={cancelEdit}
//             >
//               <motion.div
//                 initial={{ scale: 0.9, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 exit={{ scale: 0.9, opacity: 0 }}
//                 onClick={(e) => e.stopPropagation()}
//                 className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
//               >
//                 <div className="px-6 py-4 border-b border-gray-200 rounded-t-3xl">
//                   <div className="flex items-center justify-between">
//                     <h3 className="text-2xl font-bold">
//                       {editingPost ? 'Edit Post' : 'Create Post'}
//                     </h3>
//                     <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">
//                       <X className="w-6 h-6" />
//                     </button>
//                   </div>
//                 </div>

//                 <div className="p-6 space-y-4 overflow-y-auto flex-1">
//                   {editingPost && editingPost.images && editingPost.images.length > 0 && postImageFiles.length === 0 && (
//                     <div className="mb-4">
//                       <label className="text-sm font-medium text-gray-700 mb-2 block">
//                         Current Images
//                       </label>
//                       <div className="grid grid-cols-2 gap-2">
//                         {editingPost.images.map((img, idx) => (
//                           <img
//                             key={idx}
//                             src={img}
//                             alt={`Current post ${idx + 1}`}
//                             className="w-full h-32 object-cover rounded-xl"
//                           />
//                         ))}
//                       </div>
//                       <p className="text-xs text-gray-500 mt-2">
//                         Upload new images to replace these
//                       </p>
//                     </div>
//                   )}

//                   <ImageUpload
//                     label={editingPost ? "Replace Post Image (optional)" : "Post Image"}
//                     files={postImageFiles}
//                     onFilesChange={setPostImageFiles}
//                     maxFiles={5}
//                     aspectRatio="square"
//                     helperText="Select pictures for your post"
//                   />

//                   <div>
//                     <label className="text-sm font-medium text-gray-700 mb-2 block">Caption</label>
//                     <textarea
//                       value={postCaption}
//                       onChange={(e) => setPostCaption(e.target.value)}
//                       placeholder="What's on your mind?"
//                       className="w-full px-4 py-3 border border-gray-250 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
//                       rows={3}
//                     />
//                   </div>
//                 </div>

//                 <div className="px-6 py-4 bg-gray-50 rounded-b-3xl flex gap-4 border-t border-gray-100">
//                   <Button onClick={cancelEdit} variant="outline" fullWidth>
//                     Cancel
//                   </Button>
//                   <Button
//                     onClick={editingPost ? handleUpdatePost : handleAddPost}
//                     fullWidth
//                     isLoading={isUploadingPost}
//                   >
//                     <Save className="w-3 h-3 mr-2" />
//                     {editingPost ? 'Update Post' : 'POST'}
//                   </Button>
//                 </div>
//               </motion.div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Posts Section */}
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h3 className="text-2xl font-bold text-gray-800">My Posts</h3>
//             <Button
//               onClick={() => {
//                 setIsAddingPost(true);
//                 setEditingPost(null);
//                 setPostImageFiles([]);
//                 setPostCaption('');
//               }}
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               New Post
//             </Button>
//           </div>

//           {user.posts && user.posts.length > 0 ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {user.posts.map((post, index) => (
//                 <motion.div
//                   key={post._id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: index * 0.1 }}
//                 >
//                   <PostCard
//                     post={post}
//                     username={user.username || user.email.split('@')[0]}
//                     profilePicture={user.profilePicture}
//                     onLike={handleToggleLike}
//                     onEdit={handleEditPost}
//                     onDelete={handleDeletePost}
//                     isOwnPost={true}
//                     liked={likedPosts.has(post._id)}
//                   />
//                 </motion.div>
//               ))}
//             </div>
//           ) : (
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95 }}
//               animate={{ opacity: 1, scale: 1 }}
//               className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl shadow-lg p-12 text-center border-2 border-dashed border-pink-200"
//             >
//               <ImageIcon className="w-20 h-20 text-pink-400 mx-auto mb-4" />
//               <h4 className="text-2xl font-bold text-gray-800 mb-2">No posts yet</h4>
//               <p className="text-gray-600 mb-6 max-w-md mx-auto">
//                 Start sharing your moments with the world and connect with others!
//               </p>
//               <Button
//                 onClick={() => {
//                   setIsAddingPost(true);
//                   setEditingPost(null);
//                   setPostImageFiles([]);
//                   setPostCaption('');
//                 }}
//               >
//                 <Plus className="w-4 h-4 mr-2" />
//                 Create Your First Post
//               </Button>
//             </motion.div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Profile;



//enhanced
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Edit2, X, Save, Plus, Image as ImageIcon, Settings, LogOut, Camera } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { userService } from '../services/userService';
import api from '../services/api';
import type { User, Post, ProfileUpdateData, PostData } from '../types';
import PostCard from '../components/PostCard';
import Button from '../components/Button';
import Input from '../components/Input';
import ProfileCompletion from '../components/ProfileCompletion';
import ImageUpload from '../components/ImageUpload';
import { ProfileSkeleton, PostSkeleton } from '../components/SkeletonLoader';
import PhotoCarousel from '../components/PhotoCarousel';

const Profile: React.FC = () => {
  const navigate = useNavigate();
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

  // Form states
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  // File states for uploads
  const [profilePictureFiles, setProfilePictureFiles] = useState<File[]>([]);
  const [coverImageFiles, setCoverImageFiles] = useState<File[]>([]);
  const [postImageFiles, setPostImageFiles] = useState<File[]>([]);

  // Post form states
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

  // Upload profile picture to Cloudinary
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

      if (response.data.success) {
        return response.data.profilePicture;
      }
      return null;
    } catch (error: any) {
      toast.error('Failed to upload profile picture');
      return null;
    } finally {
      setIsUploadingProfile(false);
    }
  };

  // Upload cover image to Cloudinary
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

      if (response.data.success) {
        return response.data.coverImage;
      }
      return null;
    } catch (error: any) {
      toast.error('Failed to upload cover image');
      return null;
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Upload gallery photos
  const uploadGalleryPhotos = async (files: File[]): Promise<string[] | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;

    const formData = new FormData();
    files.forEach(file => {
      formData.append('photos', file);
    });

    try {
      const response = await api.post(`/profile/${userId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        return response.data.photos;
      }
      return null;
    } catch (error: any) {
      toast.error('Failed to upload gallery photos');
      return null;
    }
  };

  // Delete a single carousel photo
  const deleteCarouselPhoto = async (photoUrl: string) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const response = await api.delete(`/profile/${userId}/photos`, {
        data: { photoUrl }
      });

      if (response.data.success) {
        setExistingGalleryUrls(response.data.photos);
        toast.success('Photo removed successfully');
      }
    } catch (error: any) {
      toast.error('Failed to delete photo');
    }
  };

  const handleUpdateProfile = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      let profilePictureUrl = user?.profilePicture;
      let coverImageUrl = user?.coverImage;

      // Upload profile picture if new file selected
      if (profilePictureFiles.length > 0) {
        const url = await uploadProfilePicture(profilePictureFiles[0]);
        if (url) profilePictureUrl = url;
      }

      // Upload cover image if new file selected
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
        toast.success('✨ Profile updated successfully!', {
          icon: '🎉',
          duration: 3000,
        });
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

      // Upload new photos if any
      if (galleryPhotoFiles.length > 0) {
        const urls = await uploadGalleryPhotos(galleryPhotoFiles);
        if (urls) {
          setExistingGalleryUrls(urls);
          setGalleryPhotoFiles([]);
          toast.success('📸 Gallery updated successfully!');
          await loadProfile(); // Reload to get fresh data
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

    if (postImageFiles.length === 0) {
      toast.error('Please select an image');
      return;
    }

    try {
      setIsUploadingPost(true);

      const formData = new FormData();
      postImageFiles.forEach((file) => {
        formData.append('images', file);
      });
      formData.append('caption', postCaption.trim() || '');

      const token = localStorage.getItem('token');
      const res = await api.post(`/profile/${userId}/posts`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      console.error('Add post error:', error);
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
        postImageFiles.forEach(file => {
          formData.append('images', file);
        });
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
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="relative">
            <div className="relative h-72 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600">
              {user.coverImage && (
                <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-end gap-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative"
                  >
                    <img
                      src={user.profilePicture || defaultAvatar}
                      alt={user.username || user.email}
                      className="w-32 h-32 rounded-2xl border-1 border-white object-cover shadow-2xl"
                    />
                    {/* <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white"></div> */}
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
              {user.about ? 'View Full Profile' : 'Complete About'}
            </button>
          </div>
          <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
            {user.about || "Tell your story, share your passions, what you're looking for..."}
          </p>
        </motion.div>

        {/* Photo Gallery Carousel with Edit Button */}
        {(user.photos && user.photos.length > 0) || isEditingGallery ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-center flex-1"></h3>
              {!isEditingGallery && (
                <Button onClick={openEditGallery} className="text-sm px-4 py-2">
                  <Camera className="w-4 h-4 mr-2" />
                  Add Carousel
                </Button>
              )}
            </div>
            {user.photos && user.photos.length > 0 && (
              <PhotoCarousel photos={user.photos} />
            )}
          </motion.div>
        ) : null}

        {/* Edit Profile Modal */}
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
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl z-10">
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
                      placeholder="Share something about yourself..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">{bio.length}/500</p>
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

                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <p className="text-sm text-purple-700">
                      💡 <strong>Complete your About Me</strong> section for better matches!{' '}
                      <button
                        onClick={() => navigate('/about')}
                        className="text-purple-600 hover:text-purple-800 font-semibold underline"
                      >
                        Go to About
                      </button>
                    </p>
                  </div>

                  <div className="bg-pink-50 border border-pink-100 rounded-xl p-4">
                    <p className="text-sm text-pink-700">
                      📸 <strong>Manage your photo gallery</strong> separately using the "Manage Photos" button above the carousel
                    </p>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-3xl flex gap-4">
                  <Button onClick={cancelEdit} variant="outline" fullWidth>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateProfile}
                    fullWidth
                    isLoading={isUploadingProfile || isUploadingCover}
                  >
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={cancelEdit}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      {/* Manage Photo Gallery Header Removed */}
                    </h3>
                    <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">


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

                <div className="sticky bottom-0 bg-gray-50 px-4 py-4 rounded-b-3xl flex gap-4 border-t border-gray-100">
                  <Button onClick={cancelEdit} variant="outline" fullWidth>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateGallery}
                    fullWidth
                    isLoading={isUploadingGallery}
                    disabled={galleryPhotoFiles.length === 0}
                  >
                    <Save className="w-2 h-2 mr-2" />
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
                <div className="px-6 py-4 border-b border-gray-200 rounded-t-3xl">
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
                  {editingPost && editingPost.images && editingPost.images.length > 0 && postImageFiles.length === 0 && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Current Images
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {editingPost.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Current post ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-xl"
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Upload new images to replace these
                      </p>
                    </div>
                  )}

                  <ImageUpload
                    label={editingPost ? "Replace Post Images (optional)" : "Post Images"}
                    files={postImageFiles}
                    onFilesChange={setPostImageFiles}
                    multiple={true}
                    maxFiles={5}
                    aspectRatio="square"
                    helperText="Select pictures for your post (Max 5)"
                  />

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Caption</label>
                    <textarea
                      value={postCaption}
                      onChange={(e) => setPostCaption(e.target.value)}
                      placeholder="What's on your mind?"
                      className="w-full px-4 py-3 border border-gray-250 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 rounded-b-3xl flex gap-4 border-t border-gray-100">
                  <Button onClick={cancelEdit} variant="outline" fullWidth>
                    Cancel
                  </Button>
                  <Button
                    onClick={editingPost ? handleUpdatePost : handleAddPost}
                    fullWidth
                    isLoading={isUploadingPost}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPost ? 'Update Post' : 'POST'}
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
                setPostImageFiles([]);
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
                  setPostImageFiles([]);
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