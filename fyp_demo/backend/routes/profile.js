// Profile routes
import express from 'express';
import {
  getProfile,
  updateProfile,
  addPost,
  updatePost,
  deletePost,
  getUserPosts
} from '../controllers/profileController.js';

const router = express.Router();

// Get user profile
router.get('/:userId', getProfile);

// Update user profile (bio, username, profile picture)
router.put('/:userId', updateProfile);

// Get all posts for a user
router.get('/:userId/posts', getUserPosts);

// Add a new post
router.post('/:userId/posts', addPost);

// Update a post
router.put('/:userId/posts/:postId', updatePost);

// Delete a post
router.delete('/:userId/posts/:postId', deletePost);

export default router;


