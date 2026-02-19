// const mongoose = require('mongoose');
import mongoose from "mongoose";  //es module style

/*this is part of mvc, models
this part ensures how the data looks like, data lai kasari store hunxa etc and 
data kasari database ma store hunxa
*/
// Post schema for user posts
const postSchema = new mongoose.Schema({
  images: {
    type: [String],
    required: true,
    validate: v => v.length > 0 && v.length <= 10,
  },
  caption: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Location schema for geo-based matching
const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    default: [0, 0]
  },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  displayLocation: { type: String, default: '' } // e.g., "New York, USA"
});

// const userSchema = new mongoose.Schema({  //this is user schema 
//   email: { type: String, unique: true, required: true, lowercase: true, trim: true },
//   password: { type: String, required: true },
//   username: { type: String, unique: true, sparse: true, trim: true },
//   //setting up field for bio
//   bio: { type: String, default: '', maxlength: 500 },
//   about: {
//   type: String,
//   default: '',
//   maxlength: 3000,  // enough of room for detailed bio
//   trim: true
// },


// setting up preferences and personal details, flat fields
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  username: { type: String, unique: true, sparse: true, trim: true },
  
  // Basic Profile Info
  bio: { type: String, default: '', maxlength: 500 },
  about: { type: String, default: '', maxlength: 3000, trim: true },
  
  // Personal Details
  pronouns: { type: String, default: '' },
  pronounsVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
  
  gender: { type: String, default: '' },
  genderVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
  
  interestedIn: [{ type: String }], // ["Men", "Women", "Non-binary", "Everyone"]
  interestedInVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
  
  dateOfBirth: { type: Date },
  age: { type: Number }, // Calculated field
  
  workTitle: { type: String, default: '' },
  workCompany: { type: String, default: '' },
  workVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
  
  educationSchool: { type: String, default: '' },
  educationDegree: { type: String, default: '' },
  educationVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
  
  // Physical Attributes
  height: { type: Number }, // in cm
  heightVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
  
  // Location
  location: { type: locationSchema, default: () => ({}) },
  locationVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
  
  // Lifestyle & Preferences
  lifestyle: {
    smoking: { type: String, enum: ['Never', 'Socially', 'Regularly', 'Prefer not to say', ''], default: '' },
    drinking: { type: String, enum: ['Never', 'Socially', 'Regularly', 'Prefer not to say', ''], default: '' },
    exercise: { type: String, enum: ['Never', 'Sometimes', 'Regularly', 'Very active', ''], default: '' },
    diet: { type: String, enum: ['Anything', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Other', ''], default: '' },
  },
  
  // Interests & Hobbies (tags)
  interests: {
    type: [String],
    default: [],
    validate: v => v.length <= 20 // max 20 interests
  },
  
  // Relationship Goals
  relationshipGoals: {
    type: String,
    enum: ['Casual dating', 'Long-term relationship', 'Marriage', 'Friendship', 'Not sure yet', ''],
    default: ''
  },
  
  // Profile Media
  profilePicture: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  photos: {
    type: [String],
    default: [],
    validate: v => v.length <= 10 // max 10 photos
  },
  
  // Matching Preferences
  matchPreferences: {
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 100 }
    },
    distanceRange: { type: Number, default: 50 }, // in km
    genderPreference: [{ type: String }], // Same as interestedIn
    dealBreakers: {
      type: [String],
      default: []
    },
    mustHaves: {
      type: [String],
      default: []
    }
  },
  
  // Discovery Settings
  discoverySettings: {
    isActive: { type: Boolean, default: true }, // Show in discovery
    ageRangeVisible: { type: Boolean, default: true },
    distanceVisible: { type: Boolean, default: true },
    lastActiveVisible: { type: Boolean, default: true }
  },
  
  // Profile Completion
  profileCompleteness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Activity Tracking
  lastActive: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  
  // Verification
  isVerified: { type: Boolean, default: false },
  verificationPhoto: { type: String, default: '' },
  
  // Posts
  posts: [postSchema],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Password Reset
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
});

// Indexes for efficient querying
userSchema.index({ 'location.coordinates': '2dsphere' }); // Geo queries
userSchema.index({ age: 1 });
userSchema.index({ gender: 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ 'discoverySettings.isActive': 1 });

// Virtual for calculating age from dateOfBirth
userSchema.virtual('calculatedAge').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Method to calculate profile completeness
userSchema.methods.calculateProfileCompleteness = function() {
  let score = 0;
  const weights = {
    basicInfo: 20,    // email, username, password (always present)
    photos: 20,       // profile picture + additional photos
    bio: 15,          // bio or about
    personalInfo: 15, // gender, age, location
    lifestyle: 10,    // lifestyle choices
    interests: 10,    // at least 3 interests
    work: 5,          // work info
    education: 5      // education info
  };
  
  // Basic info (always 20 if registered)
  score += weights.basicInfo;
  
  // Photos
  if (this.profilePicture) score += 10;
  if (this.photos && this.photos.length >= 2) score += 10;
  
  // Bio
  if (this.bio || this.about) score += weights.bio;
  
  // Personal Info
  if (this.gender) score += 5;
  if (this.age || this.dateOfBirth) score += 5;
  if (this.location?.city) score += 5;
  
  // Lifestyle
  const lifestyleFields = Object.values(this.lifestyle || {}).filter(v => v && v !== '');
  if (lifestyleFields.length >= 2) score += weights.lifestyle;
  
  // Interests
  if (this.interests && this.interests.length >= 3) score += weights.interests;
  
  // Work
  if (this.workTitle || this.workCompany) score += weights.work;
  
  // Education
  if (this.educationSchool || this.educationDegree) score += weights.education;
  
  return Math.min(score, 100);
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Update age if dateOfBirth exists
  if (this.dateOfBirth) {
    this.age = this.calculatedAge;
  }
  
  // Update profile completeness
  this.profileCompleteness = this.calculateProfileCompleteness();
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

//yo mongoose model export is in old style
// module.exports = mongoose.model('User', userSchema);

//we use es moddule to export mongoose structure
const User = mongoose.model('User',userSchema);

export default User;

// yo named export hunai parxa for authController to use create() and findOne()
export const create = (data) => User.create(data);

export const findOne = (query) => User.findOne(query);

export const findById = (id) => User.findById(id);

export const findByIdAndUpdate = (id, data, options = {}) => {
  data.updatedAt = new Date();
  return User.findByIdAndUpdate(id, data, { new: true, ...options });
};

export const findByIdAndDelete = (id) => User.findByIdAndDelete(id);

//note es module ma
// use import 
//replace module.export with export default or any name given
// add .js extension while importing files