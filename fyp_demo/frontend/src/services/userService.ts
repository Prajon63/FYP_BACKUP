import api from './api';
import type { ProfileUpdateData, ProfileResponse, PostData, PostResponse, PostsResponse } from '../types';

// This service will handle user-related API calls
export const userService = {
  /**
   * Get user profile
   * @param userId - User ID
   */
  async getUserProfile(userId: string): Promise<ProfileResponse> {
    try {
      const response = await api.get<ProfileResponse>(`/profile/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user profile');
    }
  },

  /**
   * Update user profile (bio, username, profile picture, cover image)
   * @param userId - User ID
   * @param data - Profile update data
   */
  async updateProfile(userId: string, data: ProfileUpdateData): Promise<ProfileResponse> {
    try {
      const response = await api.put<ProfileResponse>(`/profile/${userId}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  /**
   * Get all posts for a user
   * @param userId - User ID
   */
  async getUserPosts(userId: string): Promise<PostsResponse> {
    try {
      const response = await api.get<PostsResponse>(`/profile/${userId}/posts`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch posts');
    }
  },

  /**
   * Add a new post
   * @param userId - User ID
   * @param postData - Post data (image, caption)
   */
  async addPost(userId: string, postData: PostData): Promise<PostResponse> {
    try {
      const response = await api.post<PostResponse>(`/profile/${userId}/posts`, postData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add post');
    }
  },

  /**
   * Update a post
   * @param userId - User ID
   * @param postId - Post ID
   * @param postData - Post data to update
   */
  async updatePost(userId: string, postId: string, postData: Partial<PostData>): Promise<PostResponse> {
    try {
      const response = await api.put<PostResponse>(`/profile/${userId}/posts/${postId}`, postData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update post');
    }
  },

  /**
   * Delete a post
   * @param userId - User ID
   * @param postId - Post ID
   */
  async deletePost(userId: string, postId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.delete(`/profile/${userId}/posts/${postId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete post');
    }
  },

  /**
   * Upload multiple photos for the user's carousel/gallery
   * Uses multipart/form-data and Cloudinary via backend
   */
  async uploadPhotos(
    userId: string,
    files: File[]
  ): Promise<{ success: boolean; photos?: string[]; message?: string; error?: string }> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('photos', file);
      });

      const response = await api.post(`/profile/${userId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload photos');
    }
  },

  /**
   * Upload profile picture (file-based)
   */
  async uploadProfilePicture(
    userId: string,
    file: File
  ): Promise<{ success: boolean; profilePicture?: string; message?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(`/profile/${userId}/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload profile picture');
    }
  },

  /**
   * Upload cover image (file-based)
   */
  async uploadCoverImage(
    userId: string,
    file: File
  ): Promise<{ success: boolean; coverImage?: string; message?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(`/profile/${userId}/cover-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload cover image');
    }
  },

  /**
   * Add a new post with image file (Cloudinary)
   */
  async addPostWithImage(
    userId: string,
    file: File,
    caption: string
  ): Promise<PostResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('caption', caption);

      const response = await api.post<PostResponse>(`/profile/${userId}/posts-with-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add post');
    }
  },

  /**
   * Get user feed/posts
   */
  async getUserFeed() {
    try {
      // This endpoint will be implemented later
      const response = await api.get('/users/feed');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch feed');
    }
  },
};



