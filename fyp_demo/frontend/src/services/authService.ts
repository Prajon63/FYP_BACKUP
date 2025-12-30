import api from './api';
import type { LoginCredentials, RegisterCredentials, AuthResponse, UserPreferences, PreferencesResponse } from '../types';

export const authService = {
  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  /**
   * Login existing user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  /**
   * Save user preferences
   */
  async savePreferences(preferences: UserPreferences, userId?: string): Promise<PreferencesResponse> {
    try {
      const response = await api.post<PreferencesResponse>('/auth/preference', {
        ...preferences,
        userId,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save preferences');
    }
  },

  /**
   * Logout user (clear token, etc.)
   */
  logout(): void {
    // Clear any stored auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};


