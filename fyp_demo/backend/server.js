// server.js
// we import dependencies in here and is ES style followed
import express, { json } from 'express';
import { connect } from 'mongoose';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import connectDB from './config/db_connection.js';
import dotenv from 'dotenv';
import authRoute from './routes/auth.js';
import profileRoute from './routes/profile.js';
import discoverRoute from './routes/discover.js';
import cloudinary from './config/cloudinary.js';  //  import to initialize config for cloudinary

// require('dotenv').config();  //commonjs structure
dotenv.config();  //es module style ma environment var load gareko

const app = express();

//middleware
app.use(cors());
app.use(json());

// connect to MongoDB
connectDB();

// routes
app.use('/api/auth', authRoute);
app.use('/api/profile', profileRoute);
app.use('/api/discover', discoverRoute);
// app.use('/api/auth', require('./routes/auth'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    detail: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});


// const PORT = 5000;
// app.listen(PORT, () => console.log(`Backend → http://localhost:${PORT}`));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running → http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});