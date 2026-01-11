/*
Profile Controller - handles all profile-related operations
CRUD operations for user profile: bio, username, profile picture, posts
*/

import { findById, findByIdAndUpdate, findByIdAndDelete } from '../models/User.js';

// Get user profile
export async function getProfile(req, res) {
  try {
    const { userId } = req.params;
    const user = await findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Return user data without password
    const { password, ...userData } = user.toObject();
    return res.status(200).json({ success: true, user: userData });
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch profile',
      detail: err.message 
    });
  }
}

// Update user profile (bio, username, profile picture, about)
export async function updateProfile(req, res) {
  try {
    const { userId } = req.params;
    const { username, bio, profilePicture, coverImage, about,pronouns, gender, 
      interestedIn, work, education } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (about !== undefined) updateData.about = about;

    // New fields for users preference/interests and their visibilty updates
if (req.body.pronouns !== undefined) updateData.pronouns = req.body.pronouns;
if (req.body.pronounsVisibility !== undefined) updateData.pronounsVisibility = req.body.pronounsVisibility;

if (req.body.gender !== undefined) updateData.gender = req.body.gender;
if (req.body.genderVisibility !== undefined) updateData.genderVisibility = req.body.genderVisibility;

if (req.body.interestedIn !== undefined) updateData.interestedIn = req.body.interestedIn;

if (req.body.interestedInVisibility !== undefined) updateData.interestedInVisibility = req.body.interestedInVisibility;

if (req.body.workTitle !== undefined) updateData.workTitle = req.body.workTitle;
if (req.body.workCompany !== undefined) updateData.workCompany = req.body.workCompany;
if (req.body.workVisibility !== undefined) updateData.workVisibility = req.body.workVisibility;

if (req.body.educationSchool !== undefined) updateData.educationSchool = req.body.educationSchool;
if (req.body.educationDegree !== undefined) updateData.educationDegree = req.body.educationDegree;
if (req.body.educationVisibility !== undefined) updateData.educationVisibility = req.body.educationVisibility;


    const user = await findByIdAndUpdate(userId, updateData);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { password, ...userData } = user.toObject();
    return res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: userData 
    });
  } catch (err) {
    console.error("Update profile error:", err);
    
    // Handle duplicate username error
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        error: 'Username already taken' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update profile',
      detail: err.message 
    });
  }
}

// Add a new post
export async function addPost(req, res) {
  try {
    const { userId } = req.params;
    const { image, caption } = req.body;

    if (!image) {
      return res.status(400).json({ 
        success: false, 
        error: 'Post image is required' 
      });
    }

    const user = await findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Add new post to user's posts array
    const newPost = {
      image,
      caption: caption || '',
      likes: 0,
      comments: 0,
      createdAt: new Date()
    };

    user.posts.push(newPost);
    user.updatedAt = new Date();
    await user.save();

    return res.status(201).json({ 
      success: true, 
      message: 'Post added successfully',
      post: newPost 
    });
  } catch (err) {
    console.error("Add post error:", err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to add post',
      detail: err.message 
    });
  }
}

// Update a post
export async function updatePost(req, res) {
  try {
    const { userId, postId } = req.params;
    const { image, caption } = req.body;

    const user = await findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const post = user.posts.id(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (image !== undefined) post.image = image;
    if (caption !== undefined) post.caption = caption;
    
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Post updated successfully',
      post: post 
    });
  } catch (err) {
    console.error("Update post error:", err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update post',
      detail: err.message 
    });
  }
}

// Delete a post
export async function deletePost(req, res) {
  try {
    const { userId, postId } = req.params;

    const user = await findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const post = user.posts.id(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    user.posts.pull(postId);
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Post deleted successfully' 
    });
  } catch (err) {
    console.error("Delete post error:", err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete post',
      detail: err.message 
    });
  }
}

// Get all posts for a user
export async function getUserPosts(req, res) {
  try {
    const { userId } = req.params;
    const user = await findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({ 
      success: true, 
      posts: user.posts 
    });
  } catch (err) {
    console.error("Get posts error:", err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch posts',
      detail: err.message 
    });
  }
}

