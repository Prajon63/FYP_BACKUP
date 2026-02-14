// // Profile routes
// import express from 'express';
// import multer from 'multer';
// import { protect } from '../middleware/auth.js';

// import {
//   getProfile,
//   updateProfile,
//   addPost,
//   updatePost,
//   deletePost,
//   uploadMultiplePhotos,
//   uploadProfilePicture,
//   uploadCoverImage,
//   addPostWithImage,
//   getUserPosts
// } from '../controllers/profileController.js';

// const router = express.Router();

// const upload = multer({ storage: multer.memoryStorage() });  // memory for Cloudinary

// // Get user profile
// router.get('/:userId', getProfile);

// // Update user profile (bio, username, profile picture)
// router.put('/:userId', updateProfile);

// // Upload profile picture (file-based)
// router.post('/:userId/profile-picture', protect, upload.single('image'), uploadProfilePicture);

// // Upload cover image (file-based)
// router.post('/:userId/cover-image', protect, upload.single('image'), uploadCoverImage);

// // Get all posts for a user
// router.get('/:userId/posts', getUserPosts);

// // Add a new post with image file (Cloudinary)
// //router.post('/:userId/posts-with-image', protect, upload.single('image'), addPostWithImage);  single post

// // Update a post
// router.put('/:userId/posts/:postId', updatePost);

// // Delete a post
// router.delete('/:userId/posts/:postId', deletePost);

// router.post('/:userId/photos', protect, upload.array('photos', 10), uploadMultiplePhotos);

// export default router;


// Profile routes
import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { deleteCarouselPhoto } from '../controllers/profileController.js';

import {
  getProfile,
  updateProfile,
  addPost,
  updatePost,
  deletePost,
  uploadProfilePicture,
  uploadCoverImage,
  getUserPosts,
  uploadMultiplePhotos  // for photo carousel

} from '../controllers/profileController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Profile
router.get('/:userId', getProfile);
router.put('/:userId', updateProfile);

// Single-image uploads
router.post('/:userId/profile-picture', protect, upload.single('image'), uploadProfilePicture);
router.post('/:userId/cover-image', protect, upload.single('image'), uploadCoverImage);

// Posts (single OR multiple images — ONE strategy)
router.get('/:userId/posts', getUserPosts);
router.post('/:userId/posts', protect, upload.array('images', 10), addPost);
router.put('/:userId/posts/:postId', protect, upload.array('images', 10), updatePost);
router.delete('/:userId/posts/:postId', deletePost);
router.post('/:userId/photos', protect, upload.array('photos', 10), uploadMultiplePhotos); //new photo carousel
// DELETE /profile/:userId/photos - Delete a single carousel photo
router.delete('/:userId/photos', deleteCarouselPhoto);



export default router;



