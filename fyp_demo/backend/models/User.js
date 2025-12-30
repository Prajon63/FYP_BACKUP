// const mongoose = require('mongoose');
import mongoose from "mongoose";  //es module style

/*this is part of mvc, models
this part ensures how the data looks like, data lai kasari store hunxa etc and 
data kasari database ma store hunxa
*/
const userSchema = new mongoose.Schema({  //this is user schema 
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
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

//note es module ma
// use import 
//replace module.export with export default or any name given
// add .js extension while importing files