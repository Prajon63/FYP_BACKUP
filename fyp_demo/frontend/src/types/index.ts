// User types
export interface User {
  _id: string;
  email: string;
  createdAt?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Preference types
export interface UserPreferences {
  gender: string;
  interestedIn: string;
  minAge: number;
  maxAge: number;
  interests: string;
}

export interface PreferencesResponse {
  success: boolean;
  message?: string;
  error?: string;
}


