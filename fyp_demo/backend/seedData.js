/**
 * Seed Data Script for Matchmaking Testing
 * Run this file to create test users with complete profiles
 * 
 * Usage: node seedData.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const testUsers = [
  {
    email: 'emma@test.com',
    password: 'password123',
    username: 'emma_watson',
    bio: 'Actor & activist. Book lover 📚 Living life to the fullest ✨',
    gender: 'Female',
    age: 28,
    interestedIn: ['Men'],
    relationshipGoals: 'Long-term relationship',
    location: {
      type: 'Point',
      coordinates: [-74.006, 40.7128], // New York
      city: 'New York',
      state: 'NY',
      country: 'USA',
      displayLocation: 'New York, USA'
    },
    interests: ['Reading', 'Acting', 'Activism', 'Travel', 'Yoga'],
    lifestyle: {
      smoking: 'Never',
      drinking: 'Socially',
      exercise: 'Regularly',
      diet: 'Vegetarian'
    },
    matchPreferences: {
      ageRange: { min: 25, max: 35 },
      distanceRange: 50,
      genderPreference: ['Men']
    },
    discoverySettings: {
      isActive: true,
      ageRangeVisible: true,
      distanceVisible: true,
      lastActiveVisible: true
    },
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
  },
  {
    email: 'alex@test.com',
    password: 'password123',
    username: 'alex_chen',
    bio: 'Photographer 📸 Travel enthusiast 🌍 Coffee addict ☕',
    gender: 'Male',
    age: 26,
    interestedIn: ['Women'],
    relationshipGoals: 'Long-term relationship',
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749], // San Francisco
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      displayLocation: 'San Francisco, USA'
    },
    interests: ['Photography', 'Travel', 'Coffee', 'Hiking', 'Music'],
    lifestyle: {
      smoking: 'Never',
      drinking: 'Socially',
      exercise: 'Very active',
      diet: 'Anything'
    },
    matchPreferences: {
      ageRange: { min: 22, max: 32 },
      distanceRange: 50,
      genderPreference: ['Women']
    },
    discoverySettings: {
      isActive: true,
      ageRangeVisible: true,
      distanceVisible: true,
      lastActiveVisible: true
    },
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  },
  {
    email: 'sophia@test.com',
    password: 'password123',
    username: 'sophia_m',
    bio: 'Yoga instructor 🧘‍♀️ Wellness advocate 🌿 Spreading positive energy ✨',
    gender: 'Female',
    age: 24,
    interestedIn: ['Men', 'Everyone'],
    relationshipGoals: 'Casual dating',
    location: {
      type: 'Point',
      coordinates: [-118.2437, 34.0522], // Los Angeles
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      displayLocation: 'Los Angeles, USA'
    },
    interests: ['Yoga', 'Meditation', 'Wellness', 'Cooking', 'Nature'],
    lifestyle: {
      smoking: 'Never',
      drinking: 'Never',
      exercise: 'Very active',
      diet: 'Vegan'
    },
    matchPreferences: {
      ageRange: { min: 22, max: 30 },
      distanceRange: 30,
      genderPreference: ['Men', 'Everyone']
    },
    discoverySettings: {
      isActive: true,
      ageRangeVisible: true,
      distanceVisible: true,
      lastActiveVisible: true
    },
    profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
  },
  {
    email: 'james@test.com',
    password: 'password123',
    username: 'james_wilson',
    bio: 'Software Engineer 💻 Music producer 🎵 Always learning something new',
    gender: 'Male',
    age: 30,
    interestedIn: ['Women'],
    relationshipGoals: 'Marriage',
    location: {
      type: 'Point',
      coordinates: [-0.1278, 51.5074], // London
      city: 'London',
      country: 'UK',
      displayLocation: 'London, UK'
    },
    interests: ['Coding', 'Music', 'Hiking', 'Gaming', 'Cooking'],
    lifestyle: {
      smoking: 'Never',
      drinking: 'Socially',
      exercise: 'Regularly',
      diet: 'Anything'
    },
    matchPreferences: {
      ageRange: { min: 25, max: 35 },
      distanceRange: 50,
      genderPreference: ['Women']
    },
    discoverySettings: {
      isActive: true,
      ageRangeVisible: true,
      distanceVisible: true,
      lastActiveVisible: true
    },
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
  },
  {
    email: 'olivia@test.com',
    password: 'password123',
    username: 'olivia_brown',
    bio: 'Fashion designer 👗 Art lover 🎨 Exploring the world one city at a time 🌍',
    gender: 'Female',
    age: 27,
    interestedIn: ['Men'],
    relationshipGoals: 'Long-term relationship',
    location: {
      type: 'Point',
      coordinates: [2.3522, 48.8566], // Paris
      city: 'Paris',
      country: 'France',
      displayLocation: 'Paris, France'
    },
    interests: ['Fashion', 'Art', 'Travel', 'Photography', 'Wine'],
    lifestyle: {
      smoking: 'Socially',
      drinking: 'Socially',
      exercise: 'Sometimes',
      diet: 'Anything'
    },
    matchPreferences: {
      ageRange: { min: 26, max: 35 },
      distanceRange: 50,
      genderPreference: ['Men']
    },
    discoverySettings: {
      isActive: true,
      ageRangeVisible: true,
      distanceVisible: true,
      lastActiveVisible: true
    },
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop'
  },
  {
    email: 'michael@test.com',
    password: 'password123',
    username: 'michael_t',
    bio: 'Surfer 🏄‍♂️ Environmentalist 🌊 Living the beach life',
    gender: 'Male',
    age: 29,
    interestedIn: ['Women'],
    relationshipGoals: 'Not sure yet',
    location: {
      type: 'Point',
      coordinates: [151.2093, -33.8688], // Sydney
      city: 'Sydney',
      country: 'Australia',
      displayLocation: 'Sydney, Australia'
    },
    interests: ['Surfing', 'Environment', 'Beach', 'Fitness', 'Travel'],
    lifestyle: {
      smoking: 'Never',
      drinking: 'Regularly',
      exercise: 'Very active',
      diet: 'Anything'
    },
    matchPreferences: {
      ageRange: { min: 23, max: 32 },
      distanceRange: 50,
      genderPreference: ['Women']
    },
    discoverySettings: {
      isActive: true,
      ageRangeVisible: true,
      distanceVisible: true,
      lastActiveVisible: true
    },
    profilePicture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing test users (optional)
    const testEmails = testUsers.map(u => u.email);
    await User.deleteMany({ email: { $in: testEmails } });
    console.log('🗑️  Cleared existing test users');

    // Create users
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });

      console.log(`✅ Created user: ${user.username} (${user.email})`);
    }

    console.log('\n🎉 Database seeding complete!');
    console.log(`\n📊 Created ${testUsers.length} test users:`);
    console.log('Email: emma@test.com - Password: password123');
    console.log('Email: alex@test.com - Password: password123');
    console.log('Email: sophia@test.com - Password: password123');
    console.log('Email: james@test.com - Password: password123');
    console.log('Email: olivia@test.com - Password: password123');
    console.log('Email: michael@test.com - Password: password123');
    console.log('\n💡 You can now login with any of these accounts!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();