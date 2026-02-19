import User from '../models/User.js';
import Match from '../models/Match.js';
import {
  calculateCompatibilityScore,
  passesBasicFilters,
  calculateDistance
} from '../Utils/matchingAlgorithm.js';

/**
 * Get potential matches for discovery
 * Returns users sorted by compatibility score
 */
export const getDiscoverUsers = async (req, res) => {
  try {
    const userId = req.params.userId;
    const {
      limit = 20,
      offset = 0,
      minScore = 30, // Minimum compatibility score
      sortBy = 'score' // 'score', 'distance', 'recent', 'active'
    } = req.query;

    // Get current user with preferences
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get all users that current user has already interacted with
    const interactedUsers = await Match.find({
      fromUser: userId
    }).distinct('toUser');

    // Build query for potential matches
    const query = {
      _id: { $ne: userId, $nin: interactedUsers }, // Exclude self and interacted users
      'discoverySettings.isActive': true,
    };

    // Apply gender preference filter
    if (currentUser.matchPreferences?.genderPreference?.length > 0) {
      query.gender = { $in: currentUser.matchPreferences.genderPreference };
    }

    // Apply age range filter
    if (currentUser.matchPreferences?.ageRange) {
      const { min, max } = currentUser.matchPreferences.ageRange;
      query.age = { $gte: min, $lte: max };
    }

    // Get potential users
    let potentialMatches = await User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires')
      .limit(parseInt(limit) + 50) // Get extra to filter and sort
      .lean();

    // Calculate compatibility scores and filter
    let scoredMatches = potentialMatches
      .filter(user => passesBasicFilters(currentUser, user))
      .map(user => {
        const score = calculateCompatibilityScore(currentUser, user);
        
        // Calculate distance if both have location
        let distance = null;
        if (currentUser.location?.coordinates && user.location?.coordinates) {
          const [lon1, lat1] = currentUser.location.coordinates;
          const [lon2, lat2] = user.location.coordinates;
          distance = calculateDistance(lat1, lon1, lat2, lon2);
        }

        return {
          ...user,
          compatibilityScore: score,
          distance
        };
      })
      .filter(user => user.compatibilityScore >= parseInt(minScore));

    // Apply distance filter if specified
    if (currentUser.matchPreferences?.distanceRange) {
      scoredMatches = scoredMatches.filter(user => 
        !user.distance || user.distance <= currentUser.matchPreferences.distanceRange
      );
    }

    // Sort based on preference
    switch (sortBy) {
      case 'distance':
        scoredMatches.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        break;
      case 'recent':
        scoredMatches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'active':
        scoredMatches.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
        break;
      case 'score':
      default:
        scoredMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    }

    // Apply pagination
    const paginatedMatches = scoredMatches.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    // Remove sensitive fields and format response
    const formattedMatches = paginatedMatches.map(user => {
      // Only show fields based on visibility settings
      const publicProfile = {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        photos: user.photos || [],
        bio: user.bio,
        age: user.age,
        compatibilityScore: user.compatibilityScore,
        distance: user.distance ? Math.round(user.distance) : null,
        interests: user.interests || [],
        relationshipGoals: user.relationshipGoals,
        profileCompleteness: user.profileCompleteness,
        isVerified: user.isVerified,
      };

      // Add conditional fields based on visibility
      if (user.genderVisibility === 'public') {
        publicProfile.gender = user.gender;
      }
      if (user.pronounsVisibility === 'public') {
        publicProfile.pronouns = user.pronouns;
      }
      if (user.workVisibility === 'public') {
        publicProfile.workTitle = user.workTitle;
        publicProfile.workCompany = user.workCompany;
      }
      if (user.educationVisibility === 'public') {
        publicProfile.educationSchool = user.educationSchool;
        publicProfile.educationDegree = user.educationDegree;
      }
      if (user.locationVisibility === 'public' && user.location) {
        publicProfile.location = user.location.displayLocation || user.location.city;
      }
      if (user.discoverySettings?.lastActiveVisible) {
        publicProfile.lastActive = user.lastActive;
      }

      return publicProfile;
    });

    return res.status(200).json({
      success: true,
      users: formattedMatches,
      total: scoredMatches.length,
      hasMore: scoredMatches.length > (parseInt(offset) + parseInt(limit))
    });

  } catch (error) {
    console.error('getDiscoverUsers error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch discovery users',
      detail: error.message
    });
  }
};

/**
 * Handle user interaction (like, pass, super like)
 */
export const handleInteraction = async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetUserId, action } = req.body; // action: 'like', 'pass', 'super_like'

    if (!targetUserId || !action) {
      return res.status(400).json({
        success: false,
        error: 'targetUserId and action are required'
      });
    }

    const validActions = ['like', 'pass', 'super_like', 'block'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be like, pass, super_like, or block'
      });
    }

    // Check if users exist
    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if interaction already exists
    const existingInteraction = await Match.findOne({
      fromUser: userId,
      toUser: targetUserId
    });

    if (existingInteraction) {
      return res.status(409).json({
        success: false,
        error: 'Already interacted with this user',
        interaction: existingInteraction
      });
    }

    // Calculate compatibility score
    const compatibilityScore = calculateCompatibilityScore(currentUser, targetUser);

    // Map action to status
    const statusMap = {
      'like': 'liked',
      'pass': 'passed',
      'super_like': 'super_liked',
      'block': 'blocked'
    };

    // Create new interaction
    const newInteraction = await Match.create({
      fromUser: userId,
      toUser: targetUserId,
      status: statusMap[action],
      matchScore: compatibilityScore
    });

    // Check for mutual match (only for likes and super likes)
    let isMutualMatch = false;
    if (action === 'like' || action === 'super_like') {
      const reverseInteraction = await Match.findOne({
        fromUser: targetUserId,
        toUser: userId,
        status: { $in: ['liked', 'super_liked'] }
      });

      if (reverseInteraction) {
        // It's a match!
        isMutualMatch = true;
        
        // Update both interactions to matched
        await Match.createMutualMatch(userId, targetUserId, compatibilityScore);
      }
    }

    const response = {
      success: true,
      interaction: newInteraction,
      isMatch: isMutualMatch
    };

    // If it's a match, include match details
    if (isMutualMatch) {
      response.match = {
        user: {
          _id: targetUser._id,
          username: targetUser.username,
          profilePicture: targetUser.profilePicture,
          bio: targetUser.bio,
          age: targetUser.age
        },
        compatibilityScore
      };
    }

    return res.status(201).json(response);

  } catch (error) {
    console.error('handleInteraction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process interaction',
      detail: error.message
    });
  }
};

/**
 * Get user's matches
 */
export const getMatches = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const matches = await Match.getUserMatches(userId, parseInt(limit));

    // Format matches to show the other user
    const formattedMatches = matches.map(match => {
      const otherUser = match.fromUser._id.toString() === userId 
        ? match.toUser 
        : match.fromUser;

      return {
        matchId: match._id,
        user: {
          _id: otherUser._id,
          username: otherUser.username,
          profilePicture: otherUser.profilePicture,
          bio: otherUser.bio,
          age: otherUser.age,
          location: otherUser.location?.displayLocation
        },
        compatibilityScore: match.matchScore,
        matchedAt: match.createdAt,
        conversationStarted: match.conversationStarted,
        lastMessageAt: match.lastMessageAt
      };
    });

    return res.status(200).json({
      success: true,
      matches: formattedMatches,
      total: formattedMatches.length
    });

  } catch (error) {
    console.error('getMatches error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch matches',
      detail: error.message
    });
  }
};

/**
 * Get users who liked me
 */
export const getLikes = async (req, res) => {
  try {
    const { userId } = req.params;

    const likes = await Match.getUsersWhoLikedMe(userId);

    const formattedLikes = likes.map(like => ({
      likeId: like._id,
      user: {
        _id: like.fromUser._id,
        username: like.fromUser.username,
        profilePicture: like.fromUser.profilePicture,
        bio: like.fromUser.bio,
        age: like.fromUser.age,
        location: like.fromUser.location?.displayLocation,
        interests: like.fromUser.interests
      },
      isSuperLike: like.status === 'super_liked',
      likedAt: like.createdAt
    }));

    return res.status(200).json({
      success: true,
      likes: formattedLikes,
      total: formattedLikes.length
    });

  } catch (error) {
    console.error('getLikes error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch likes',
      detail: error.message
    });
  }
};

/**
 * Update match preferences
 */
export const updateMatchPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { matchPreferences: preferences },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.matchPreferences
    });

  } catch (error) {
    console.error('updateMatchPreferences error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      detail: error.message
    });
  }
};

/**
 * Toggle discovery settings
 */
export const updateDiscoverySettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { discoverySettings: settings },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Discovery settings updated',
      settings: user.discoverySettings
    });

  } catch (error) {
    console.error('updateDiscoverySettings error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update discovery settings',
      detail: error.message
    });
  }
};

/**
 * Get discovery statistics
 */
export const getDiscoveryStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const [likesReceived, likesSent, matches, passes] = await Promise.all([
      Match.countDocuments({
        toUser: userId,
        status: { $in: ['liked', 'super_liked'] },
        isMutual: false
      }),
      Match.countDocuments({
        fromUser: userId,
        status: { $in: ['liked', 'super_liked'] }
      }),
      Match.countDocuments({
        $or: [{ fromUser: userId }, { toUser: userId }],
        isMutual: true
      }),
      Match.countDocuments({
        fromUser: userId,
        status: 'passed'
      })
    ]);

    // Get recent activity
    const recentMatches = await Match.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
      isMutual: true
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('fromUser toUser', 'username profilePicture');

    return res.status(200).json({
      success: true,
      stats: {
        likesReceived,
        likesSent,
        totalMatches: matches,
        passes,
        recentMatches: recentMatches.length
      }
    });

  } catch (error) {
    console.error('getDiscoveryStats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      detail: error.message
    });
  }
};

/**
 * Unmatch with a user
 */
export const unmatch = async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'targetUserId is required'
      });
    }

    // Delete both interaction records
    await Match.deleteMany({
      $or: [
        { fromUser: userId, toUser: targetUserId },
        { fromUser: targetUserId, toUser: userId }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Unmatched successfully'
    });

  } catch (error) {
    console.error('unmatch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to unmatch',
      detail: error.message
    });
  }
};

export default {
  getDiscoverUsers,
  handleInteraction,
  getMatches,
  getLikes,
  updateMatchPreferences,
  updateDiscoverySettings,
  getDiscoveryStats,
  unmatch
};