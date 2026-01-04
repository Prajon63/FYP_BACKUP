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

// require('dotenv').config();  //commonjs structure
dotenv.config();  //es module style ma environment var load gareko

const app = express();
app.use(cors());
app.use(json());

// connect to MongoDB
connectDB();

// routes
app.use('/api/auth', authRoute);
app.use('/api/profile', profileRoute);
// app.use('/api/auth', require('./routes/auth'));


const PORT = 5000;
app.listen(PORT, () => console.log(`Backend → http://localhost:${PORT}`));