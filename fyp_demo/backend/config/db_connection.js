// commomjs method use nagarera ES module use gareko
// const mongoose = require('mongoose');
// ('dotenv').config();

// ES module ma package/dependency lai directly import garna milxa 
import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();
const connectDB = async () => {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) {
    console.error(
      'MongoDB Connection Error: MONGO_URI is not set. ' +
        'Add it in Render → Environment (or backend/.env locally).'
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message || err);
    process.exit(1);
  }
};

// module.exports = connectDB;
export default connectDB;