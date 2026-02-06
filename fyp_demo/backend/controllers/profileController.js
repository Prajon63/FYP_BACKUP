/*
Profile Controller - handles all profile-related operations
CRUD operations for user profile: bio, username, profile picture, posts
*/

import { findById, findByIdAndUpdate, findByIdAndDelete } from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

// Get user profile
export async function getProfile(req, res) {   //function to retrieve user data 
  try {
    const { userId } = req.params;
    const user = await findById(userId);  //used to locate user by userId

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });  //if id not present in db
    }

    // Return user data without password for security
    const { password, ...userData } = user.toObject();
    return res.status(200).json({ success: true, user: userData }); //return user data if success 
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
    const { username, bio, profilePicture, coverImage, about, pronouns, gender,
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
// export async function addPost(req, res) {
//   try {
//     const { userId } = req.params;
//     // const { image, caption } = req.body;

//     // if (!image) {
//     //   return res.status(400).json({ 
//     //     success: false, 
//     //     error: 'Post image is required' 
//     //   });
//     // }

//     const user = await findById(userId);

//     if (!user) {
//       return res.status(404).json({ success: false, error: 'User not found' });
//     }

//     // Add new post to user's posts array
//     // const newPost = {
//     //   image,
//     //   caption: caption || '',
//     //   likes: 0,
//     //   comments: 0,
//     //   createdAt: new Date()
//     // };

//     user.posts.push(newPost);
//     user.updatedAt = new Date();
//     await user.save();

//     return res.status(201).json({ 
//       success: true, 
//       message: 'Post added successfully',
//       post: newPost 
//     });
//   } catch (err) {
//     console.error("Add post error:", err);
//     return res.status(500).json({ 
//       success: false, 
//       error: 'Failed to add post',
//       detail: err.message 
//     });
//   }
// }

//updated add post

export async function addPost(req, res) {
  try {
    const { userId } = req.params;
    const { caption } = req.body || {};

    const user = await findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 🔑 Unified strategy: req.files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one image is required',
      });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {     //for parallel uploads; used in addpost,updatepost,uploadmultiplepost
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'capella_posts', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    const newPost = {
      images: uploadedImages,   // 👈 ALWAYS array
      caption: caption || '',
      likes: 0,
      comments: 0,
      createdAt: new Date(),
    };

    user.posts.push(newPost);
    user.updatedAt = new Date();
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Post added successfully',
      post: newPost,
    });
  } catch (err) {
    console.error('Add post error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to add post',
      detail: err.message,
    });
  }
}


// Update a post
// export async function updatePost(req, res) {
//   try {
//     const { userId, postId } = req.params;
//     //const { image, caption } = req.body;

//     const user = await findById(userId);

//     if (!user) {
//       return res.status(404).json({ success: false, error: 'User not found' });
//     }

//     const post = user.posts.id(postId);
//     if (!post) {
//       return res.status(404).json({ success: false, error: 'Post not found' });
//     }

//    // if (image !== undefined) post.image = image;
//     if (caption !== undefined) post.caption = caption;

//     user.updatedAt = new Date();
//     await user.save();

//     return res.status(200).json({ 
//       success: true, 
//       message: 'Post updated successfully',
//       post: post 
//     });
//   } catch (err) {
//     console.error("Update post error:", err);
//     return res.status(500).json({ 
//       success: false, 
//       error: 'Failed to update post',
//       detail: err.message 
//     });
//   }
// }

//updated updatePost
export async function updatePost(req, res) {
  try {
    const { userId, postId } = req.params;
    const { caption } = req.body || {};

    const user = await findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const post = user.posts.id(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Update caption
    if (caption !== undefined) {
      post.caption = caption;
    }

    // Replace images ONLY if new ones uploaded
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'capella_posts', resource_type: 'image' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.end(file.buffer);
        });
      });

      const newImages = await Promise.all(uploadPromises);
      post.images = newImages;
    }

    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post,
    });
  } catch (err) {
    console.error('Update post error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to update post',
      detail: err.message,
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

//removed for photo carousel
export async function uploadMultiplePhotos(req, res) {
  try {
    const { userId } = req.params;
    const user = await findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!req.files?.length) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'capella_profiles', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      });
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    user.photos = user.photos ? [...user.photos, ...uploadedUrls] : uploadedUrls;
    user.updatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      photos: user.photos,
      message: 'Photos uploaded successfully',
    });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ success: false, error: 'Failed to upload photos' });
  }
}

// Upload single profile picture (file-based, Cloudinary)
export async function uploadProfilePicture(req, res) {
  try {
    const { userId } = req.params;
    const user = await findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'capella_profiles', resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    user.profilePicture = uploadResult.secure_url;
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      profilePicture: user.profilePicture,
      message: 'Profile picture updated successfully',
    });
  } catch (err) {
    console.error('Profile picture upload error:', err);
    return res.status(500).json({ success: false, error: 'Failed to upload profile picture' });
  }
}

// Upload single cover image (file-based, Cloudinary)
export async function uploadCoverImage(req, res) {
  try {
    const { userId } = req.params;
    const user = await findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'capella_covers', resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    user.coverImage = uploadResult.secure_url;
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      coverImage: user.coverImage,
      message: 'Cover image updated successfully',
    });
  } catch (err) {
    console.error('Cover image upload error:', err);
    return res.status(500).json({ success: false, error: 'Failed to upload cover image' });
  }
}

//removed
// Add a new post with file-based image upload
// export async function addPostWithImage(req, res) {
//   try {
//     const { userId } = req.params;
//     const { caption } = req.body || {};

//     const user = await findById(userId);

//     if (!user) {
//       return res.status(404).json({ success: false, error: 'User not found' });
//     }

//     if (!req.file) {
//       return res.status(400).json({ success: false, error: 'Post image file is required' });
//     }

//     const uploadResult = await new Promise((resolve, reject) => {
//       const stream = cloudinary.uploader.upload_stream(
//         { folder: 'capella_posts', resource_type: 'image' },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         }
//       );
//       stream.end(req.file.buffer);
//     });

//     const newPost = {
//       image: uploadResult.secure_url,
//       caption: caption || '',
//       likes: 0,
//       comments: 0,
//       createdAt: new Date(),
//     };

//     user.posts.push(newPost);
//     user.updatedAt = new Date();
//     await user.save();

//     return res.status(201).json({
//       success: true,
//       message: 'Post added successfully',
//       post: newPost,
//     });
//   } catch (err) {
//     console.error('Add post with image error:', err);
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to add post',
//       detail: err.message,
//     });
//   }
// }