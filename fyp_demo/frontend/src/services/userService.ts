import api from './api';

// This service will handle user-related API calls
// For now, we'll add methods as needed

export const userService = {
  /**
   * Get user profile
   * @param userId - User ID
   */
  async getUserProfile(userId: string) {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user profile');
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

  // Add more user-related methods as needed
};


