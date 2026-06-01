// server.js
// we import dependencies in here and is ES style followed
import express, { json } from 'express';
import { connect } from 'mongoose';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db_connection.js';
import dotenv from 'dotenv';
import authRoute from './routes/auth.js';
import profileRoute from './routes/profile.js';
import discoverRoute from './routes/discover.js';
import geocodeRoute from './routes/geocode.js';
import chatRoutes from './routes/chat.js';
import { registerChatSocket } from './sockets/chatSocket.js';
import cloudinary from './config/cloudinary.js';  //  import to initialize config for cloudinary

// require('dotenv').config();  //commonjs structure
dotenv.config();  //es module style ma environment var load gareko

const app = express();

const isDev = (process.env.NODE_ENV || 'development') !== 'production';

/** Comma-separated CLIENT_URL / FRONTEND_URL, no trailing slashes */
function getAllowedOrigins() {
  const raw =
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173';
  return [
    ...new Set(
      raw
        .split(',')
        .map((o) => o.trim().replace(/\/$/, ''))
        .filter(Boolean)
    ),
  ];
}

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (isDev) return callback(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }
    console.warn(
      `[CORS] Blocked origin: ${origin} | Allowed: ${allowedOrigins.join(', ')}`
    );
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(json());

// connect to MongoDB — must complete before routes handle traffic
await connectDB();

// routes
app.use('/api/auth', authRoute);
app.use('/api/profile', profileRoute);
app.use('/api/discover', discoverRoute);
app.use('/api/geocode', geocodeRoute);
app.use('/api/chat', chatRoutes);
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

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: isDev ? true : allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

registerChatSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Backend server running → http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (!isDev) {
    console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  }
});