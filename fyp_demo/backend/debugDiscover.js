/**
 * Debug script - run with: node debugDiscover.js
 * Shows exactly what the discover query returns and where filtering drops users
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { passesBasicFilters, calculateCompatibilityScore } from './Utils/matchingAlgorithm.js';

dotenv.config();

async function debug() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    // Find emma
    const emma = await User.findOne({ email: 'emma@test.com' });
    if (!emma) { console.log('❌ Emma not found!'); process.exit(1); }

    console.log('=== EMMA (current user) ===');
    console.log('id:', emma._id.toString());
    console.log('gender:', emma.gender);
    console.log('age:', emma.age);
    console.log('matchPreferences:', JSON.stringify(emma.matchPreferences, null, 2));
    console.log('discoverySettings:', JSON.stringify(emma.discoverySettings, null, 2));
    console.log('location coords:', emma.location?.coordinates);
    console.log();

    // Count all users
    const allUsers = await User.find({});
    console.log('=== ALL USERS IN DB ===', allUsers.length);
    allUsers.forEach(u => console.log(' -', u.username, '| gender:', u.gender, '| age:', u.age, '| isActive:', u.discoverySettings?.isActive));
    console.log();

    // Build exact query the controller uses
    const query = {
        _id: { $ne: emma._id },
        'discoverySettings.isActive': true,
    };

    if (emma.matchPreferences?.genderPreference?.length > 0) {
        query.gender = { $in: emma.matchPreferences.genderPreference };
        console.log('Gender filter applied:', emma.matchPreferences.genderPreference);
    }
    if (emma.matchPreferences?.ageRange) {
        const { min, max } = emma.matchPreferences.ageRange;
        query.age = { $gte: min, $lte: max };
        console.log('Age filter applied: min=' + min + ' max=' + max);
    }

    console.log('\n=== DB QUERY ===');
    console.log(JSON.stringify(query, null, 2));

    const potential = await User.find(query).lean();
    console.log('\n=== POTENTIAL MATCHES FROM DB ===', potential.length);
    potential.forEach(u => console.log(' -', u.username, '| gender:', u.gender, '| age:', u.age));

    console.log('\n=== PASSES BASIC FILTERS ===');
    potential.forEach(u => {
        const passes = passesBasicFilters(emma, u);
        const score = passes ? calculateCompatibilityScore(emma, u) : 'N/A';
        console.log(' -', u.username, '→ passes:', passes, '| score:', score);
    });

    process.exit(0);
}

debug().catch(e => { console.error(e); process.exit(1); });
