import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getDiscoverUsers,
  handleInteraction,
  getMatches,
  getLikes,
  getLikedByMe,
  getPassed,
  removeInteraction,
  updateMatchPreferences,
  updateDiscoverySettings,
  getDiscoveryStats,
  unmatch
} from '../controllers/discoverController.js';

const router = express.Router();

/**
 * Discovery Routes
 * All routes require authentication
 *
 * IMPORTANT: More-specific routes (/:userId/something) MUST be declared
 * BEFORE the generic /:userId route, otherwise Express will match
 * e.g. GET /:userId/stats with userId = "<id>/stats", causing a 500.
 */

// POST /api/discover/:userId/interact - Handle user interaction (like/pass/super_like)
router.post('/:userId/interact', protect, handleInteraction);

// GET /api/discover/:userId/matches - Get user's matches
router.get('/:userId/matches', protect, getMatches);

// GET /api/discover/:userId/likes - Get users who liked me (pending respond)
router.get('/:userId/likes', protect, getLikes);

// GET /api/discover/:userId/liked-by-me - People I liked (not matched yet)
router.get('/:userId/liked-by-me', protect, getLikedByMe);

// GET /api/discover/:userId/passed - People I passed on
router.get('/:userId/passed', protect, getPassed);

// POST /api/discover/:userId/remove-interaction - Remove my like/pass (undo)
router.post('/:userId/remove-interaction', protect, removeInteraction);

// PUT /api/discover/:userId/preferences - Update match preferences
router.put('/:userId/preferences', protect, updateMatchPreferences);

// PUT /api/discover/:userId/settings - Update discovery settings
router.put('/:userId/settings', protect, updateDiscoverySettings);

// GET /api/discover/:userId/stats - Get discovery statistics
router.get('/:userId/stats', protect, getDiscoveryStats);

// POST /api/discover/:userId/unmatch - Unmatch with a user
router.post('/:userId/unmatch', protect, unmatch);

// GET /api/discover/:userId - Get potential matches for discovery
// Query params: limit, offset, minScore, sortBy
// NOTE: This MUST remain last so it doesn't swallow the sub-routes above.
router.get('/:userId', protect, getDiscoverUsers);

export default router;
