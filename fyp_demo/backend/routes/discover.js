import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getDiscoverUsers,
  handleInteraction,
  getMatches,
  getLikes,
  updateMatchPreferences,
  updateDiscoverySettings,
  getDiscoveryStats,
  unmatch
} from '../controllers/discoverController.js';

const router = express.Router();

/**
 * Discovery Routes
 * All routes require authentication
 */

// GET /api/discover/:userId - Get potential matches for discovery
// Query params: limit, offset, minScore, sortBy
router.get('/:userId', protect, getDiscoverUsers);

// POST /api/discover/:userId/interact - Handle user interaction (like/pass/super_like)
// Body: { targetUserId, action }
router.post('/:userId/interact', protect, handleInteraction);

// GET /api/discover/:userId/matches - Get user's matches
// Query params: limit
router.get('/:userId/matches', protect, getMatches);

// GET /api/discover/:userId/likes - Get users who liked me
router.get('/:userId/likes', protect, getLikes);

// PUT /api/discover/:userId/preferences - Update match preferences
// Body: { ageRange: {min, max}, distanceRange, genderPreference, dealBreakers, mustHaves }
router.put('/:userId/preferences', protect, updateMatchPreferences);

// PUT /api/discover/:userId/settings - Update discovery settings
// Body: { isActive, ageRangeVisible, distanceVisible, lastActiveVisible }
router.put('/:userId/settings', protect, updateDiscoverySettings);

// GET /api/discover/:userId/stats - Get discovery statistics
router.get('/:userId/stats', protect, getDiscoveryStats);

// POST /api/discover/:userId/unmatch - Unmatch with a user
// Body: { targetUserId }
router.post('/:userId/unmatch', protect, unmatch);

export default router;