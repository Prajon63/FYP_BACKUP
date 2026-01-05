// Post types
export interface Post {
  _id: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  createdAt: string;
}

// User types
export interface User {
  _id: string;
  email: string;
  username?: string;
  bio?: string;
  about?: string;
  profilePicture?: string;
  coverImage?: string;
  posts?: Post[];
  createdAt?: string;
  updatedAt?: string;
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

// Profile types
export interface ProfileUpdateData {
  username?: string;
  bio?: string;
  profilePicture?: string;
  coverImage?: string;
  about?: string;
}

export interface ProfileResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
}

export interface PostData {
  image: string;
  caption?: string;
}

export interface PostResponse {
  success: boolean;
  post?: Post;
  message?: string;
  error?: string;
}

export interface PostsResponse {
  success: boolean;
  posts?: Post[];
  error?: string;
}


