// commomjs method use nagarera ES module use gareko
// const mongoose = require('mongoose');
// ('dotenv').config();

// ES module ma package/dependency lai directly import garna milxa 
import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();
const connectDB = async () => { //async await use garnu parxa
  try {
    await mongoose.connect(process.env.MONGO_URI);   //from .env file
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1); // Stop server if DB fails
  }
};

// module.exports = connectDB;
export default connectDB;