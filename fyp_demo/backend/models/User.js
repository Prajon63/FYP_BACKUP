// const mongoose = require('mongoose');
import mongoose from "mongoose";  //es module style

/*this is part of mvc, models
this part ensures how the data looks like, data lai kasari store hunxa etc and 
data kasari database ma store hunxa
*/
// Post schema for user posts
const postSchema = new mongoose.Schema({
  image: { type: String, required: true },
  caption: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({  //this is user schema 
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  username: { type: String, unique: true, sparse: true, trim: true },
  //setting up field for bio
  bio: { type: String, default: '', maxlength: 500 },
  about: {
  type: String,
  default: '',
  maxlength: 3000,  // enough of room for detailed bio
  trim: true
},

// setting up preferences and personal details, flat fields
  pronouns: { type: String, default: '' },
  pronounsVisibility: { type: String, enum: ['public', 'private'], default: 'public' },

  gender: { type: String, default: '' },
  genderVisibility: { type: String, enum: ['public', 'private'], default: 'public' },

  interestedIn: [{ type: String }],               // array of strings e.g. ["Men", "Women"]
  interestedInVisibility: { type: String, enum: ['public', 'private'], default: 'public' },

  workTitle: { type: String, default: '' },
  workCompany: { type: String, default: '' },
  workVisibility: { type: String, enum: ['public', 'private'], default: 'public' },

  educationSchool: { type: String, default: '' },
  educationDegree: { type: String, default: '' },
  educationVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
   //can add more like height,location,hobbies

  profilePicture: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  posts: [postSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
});

const userPreferences = new mongoose.Schema({
  
})

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