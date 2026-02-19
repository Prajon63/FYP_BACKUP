import api from './api';
import type {
  DiscoverUsersResponse,
  InteractionResponse,
  MatchesResponse,
  LikesResponse,
  StatsResponse,
  UnmatchResponse,
  MatchPreferences,
  DiscoveryFilters,
  User
} from '../types';

/**
 * Discovery Service
 * Handles all matchmaking and discovery API calls
 */
export const discoverService = {
  /**
   * Get potential matches for discovery
   * @param userId - Current user ID
   * @param filters - Optional filters (minScore, sortBy, limit, offset)
   */
  async getDiscoverUsers(
    userId: string,
    filters?: DiscoveryFilters
  ): Promise<DiscoverUsersResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.minScore) params.append('minScore', filters.minScore.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const queryString = params.toString();
      const url = `/discover/${userId}${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<DiscoverUsersResponse>(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch discover users');
    }
  },

  /**
   * Handle user interaction (like, pass, super_like, block)
   * @param userId - Current user ID
   * @param targetUserId - Target user ID
   * @param action - Action type
   */
  async handleInteraction(
    userId: string,
    targetUserId: string,
    action: 'like' | 'pass' | 'super_like' | 'block'
  ): Promise<InteractionResponse> {
    try {
      const response = await api.post<InteractionResponse>(
        `/discover/${userId}/interact`,
        { targetUserId, action }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to process interaction');
    }
  },

  /**
   * Get user's matches
   * @param userId - User ID
   * @param limit - Number of matches to fetch
   */
  async getMatches(userId: string, limit: number = 50): Promise<MatchesResponse> {
    try {
      const response = await api.get<MatchesResponse>(
        `/discover/${userId}/matches?limit=${limit}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch matches');
    }
  },

  /**
   * Get users who liked the current user
   * @param userId - User ID
   */
  async getLikes(userId: string): Promise<LikesResponse> {
    try {
      const response = await api.get<LikesResponse>(`/discover/${userId}/likes`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch likes');
    }
  },

  /**
   * Update match preferences
   * @param userId - User ID
   * @param preferences - Match preferences
   */
  async updateMatchPreferences(
    userId: string,
    preferences: MatchPreferences
  ): Promise<{ success: boolean; preferences: MatchPreferences; error?: string }> {
    try {
      const response = await api.put(`/discover/${userId}/preferences`, preferences);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update preferences');
    }
  },

  /**
   * Update discovery settings
   * @param userId - User ID
   * @param settings - Discovery settings
   */
  async updateDiscoverySettings(
    userId: string,
    settings: User['discoverySettings']
  ): Promise<{ success: boolean; settings: User['discoverySettings']; error?: string }> {
    try {
      const response = await api.put(`/discover/${userId}/settings`, settings);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update settings');
    }
  },

  /**
   * Get discovery statistics
   * @param userId - User ID
   */
  async getStats(userId: string): Promise<StatsResponse> {
    try {
      const response = await api.get<StatsResponse>(`/discover/${userId}/stats`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch statistics');
    }
  },

  /**
   * Unmatch with a user
   * @param userId - Current user ID
   * @param targetUserId - User to unmatch with
   */
  async unmatch(userId: string, targetUserId: string): Promise<UnmatchResponse> {
    try {
      const response = await api.post<UnmatchResponse>(
        `/discover/${userId}/unmatch`,
        { targetUserId }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to unmatch');
    }
  },
};

export default discoverService;