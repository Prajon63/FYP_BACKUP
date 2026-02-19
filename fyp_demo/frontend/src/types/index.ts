// Post types
export interface Post {
  _id: string;
  images: string[];
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
  profilePicture?: string;
  coverImage?: string;
  posts?: Post[];
  createdAt?: string;
  updatedAt?: string;
  bio?: string;
  about?: string;
  pronouns?: string;
  pronounsVisibility?: 'public' | 'private';
  gender?: string;
  genderVisibility?: 'public' | 'private';
  interestedIn?: string[];
  interestedInVisibility?: 'public' | 'private';
  workTitle?: string;
  workCompany?: string;
  workVisibility?: 'public' | 'private';
  educationSchool?: string;
  educationDegree?: string;
  educationVisibility?: 'public' | 'private';
  photos?: string[];
  
  // Enhanced fields for matchmaking
  dateOfBirth?: Date;
  age?: number;
  height?: number;
  heightVisibility?: 'public' | 'private';
  
  // Location
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
    city?: string;
    state?: string;
    country?: string;
    displayLocation?: string;
  };
  locationVisibility?: 'public' | 'private';
  
  // Lifestyle
  lifestyle?: {
    smoking?: 'Never' | 'Socially' | 'Regularly' | 'Prefer not to say' | '';
    drinking?: 'Never' | 'Socially' | 'Regularly' | 'Prefer not to say' | '';
    exercise?: 'Never' | 'Sometimes' | 'Regularly' | 'Very active' | '';
    diet?: 'Anything' | 'Vegetarian' | 'Vegan' | 'Halal' | 'Kosher' | 'Other' | '';
  };
  
  // Interests
  interests?: string[];
  
  // Relationship goals
  relationshipGoals?: 'Casual dating' | 'Long-term relationship' | 'Marriage' | 'Friendship' | 'Not sure yet' | '';
  
  // Match preferences
  matchPreferences?: MatchPreferences;
  
  // Discovery settings
  discoverySettings?: {
    isActive: boolean;
    ageRangeVisible: boolean;
    distanceVisible: boolean;
    lastActiveVisible: boolean;
  };
  
  // Activity
  profileCompleteness?: number;
  lastActive?: string;
  isOnline?: boolean;
  isVerified?: boolean;
}

// Discovery User (what you see in discovery)
export interface DiscoveryUser {
  _id: string;
  username?: string;
  profilePicture?: string;
  photos?: string[];
  bio?: string;
  age?: number;
  compatibilityScore: number;
  distance?: number | null;
  interests?: string[];
  relationshipGoals?: string;
  profileCompleteness?: number;
  isVerified?: boolean;
  gender?: string;
  pronouns?: string;
  workTitle?: string;
  workCompany?: string;
  educationSchool?: string;
  educationDegree?: string;
  location?: string;
  lastActive?: string;
}

// Match preferences
export interface MatchPreferences {
  ageRange: {
    min: number;
    max: number;
  };
  distanceRange: number; // in km
  genderPreference: string[];
  dealBreakers?: string[];
  mustHaves?: string[];
}

// Match interaction
export interface MatchInteraction {
  _id: string;
  fromUser: string;
  toUser: string;
  status: 'liked' | 'passed' | 'matched' | 'super_liked' | 'blocked';
  isMutual: boolean;
  matchScore: number;
  conversationStarted?: boolean;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Match result
export interface Match {
  matchId: string;
  user: {
    _id: string;
    username?: string;
    profilePicture?: string;
    bio?: string;
    age?: number;
    location?: string;
  };
  compatibilityScore: number;
  matchedAt: string;
  conversationStarted: boolean;
  lastMessageAt?: string;
}

// Like received
export interface Like {
  likeId: string;
  user: {
    _id: string;
    username?: string;
    profilePicture?: string;
    bio?: string;
    age?: number;
    location?: string;
    interests?: string[];
  };
  isSuperLike: boolean;
  likedAt: string;
}

// Discovery stats
export interface DiscoveryStats {
  likesReceived: number;
  likesSent: number;
  totalMatches: number;
  passes: number;
  recentMatches: number;
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
  token?: string;
}

// Preference types (legacy - keeping for backward compatibility)
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
  pronouns?: string;
  pronounsVisibility?: 'public' | 'private';
  gender?: string;
  genderVisibility?: 'public' | 'private';
  interestedIn?: string[];
  interestedInVisibility?: 'public' | 'private';
  workTitle?: string;
  workCompany?: string;
  workVisibility?: 'public' | 'private';
  educationSchool?: string;
  educationDegree?: string;
  educationVisibility?: 'public' | 'private';
  dateOfBirth?: Date;
  height?: number;
  heightVisibility?: 'public' | 'private';
  location?: User['location'];
  locationVisibility?: 'public' | 'private';
  lifestyle?: User['lifestyle'];
  interests?: string[];
  relationshipGoals?: User['relationshipGoals'];
  matchPreferences?: MatchPreferences;
  discoverySettings?: User['discoverySettings'];
}

export interface ProfileResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
}

export interface PostData {
  images: string[];
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

// Discovery API responses
export interface DiscoverUsersResponse {
  success: boolean;
  users: DiscoveryUser[];
  total: number;
  hasMore: boolean;
  error?: string;
}

export interface InteractionResponse {
  success: boolean;
  interaction: MatchInteraction;
  isMatch: boolean;
  match?: {
    user: {
      _id: string;
      username?: string;
      profilePicture?: string;
      bio?: string;
      age?: number;
    };
    compatibilityScore: number;
  };
  error?: string;
}

export interface MatchesResponse {
  success: boolean;
  matches: Match[];
  total: number;
  error?: string;
}

export interface LikesResponse {
  success: boolean;
  likes: Like[];
  total: number;
  error?: string;
}

export interface StatsResponse {
  success: boolean;
  stats: DiscoveryStats;
  error?: string;
}

export interface UnmatchResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Discovery filter options
export interface DiscoveryFilters {
  minScore?: number;
  sortBy?: 'score' | 'distance' | 'recent' | 'active';
  limit?: number;
  offset?: number;
}