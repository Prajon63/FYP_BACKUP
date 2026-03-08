/**
 * Migration: Set discoverySettings.isActive = true for all existing users
 * who don't have the field set.
 *
 * Run once with: node scripts/migrateDiscoverySettings.js
 *
 * This fixes the root cause of "already logged in sees nobody" — existing users
 * in the DB don't have discoverySettings populated, so the old isActive:true
 * filter silently excluded them all.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/your_db');
  console.log('Connected to MongoDB');

  const result = await mongoose.connection.collection('users').updateMany(
    {
      $or: [
        { 'discoverySettings.isActive': { $exists: false } },
        { discoverySettings: { $exists: false } }
      ]
    },
    {
      $set: {
        'discoverySettings.isActive': true,
        'discoverySettings.ageRangeVisible': true,
        'discoverySettings.distanceVisible': true,
        'discoverySettings.lastActiveVisible': false,
      }
    }
  );

  console.log(`✅ Updated ${result.modifiedCount} users with default discoverySettings`);
  await mongoose.disconnect();
};

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});