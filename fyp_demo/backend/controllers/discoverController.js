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
      minScore = 0,
      sortBy = 'score'
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
    // FIX 1: Removed strict 'discoverySettings.isActive': true filter from DB query.
    // Many users won't have this field set (especially newly registered ones), so
    // this was silently hiding almost everyone. We now handle it more leniently in
    // passesBasicFilters instead.
    const query = {
      _id: { $ne: userId, $nin: interactedUsers },
      // Only hard-exclude users who have explicitly set isActive to false
      'discoverySettings.isActive': { $ne: false },
    };

    // Apply gender preference filter.
    // The genderPreference stores 'Men'/'Women' (preference labels), but user.gender
    // may be stored as 'Male'/'Female' (identity labels). Expand both so we match
    // all natural variations regardless of which convention was used when registering.
    if (currentUser.matchPreferences?.genderPreference?.length > 0) {
      const genderMap = {
        'Men': ['Men', 'Male'],
        'Women': ['Women', 'Female'],
        'Non-binary': ['Non-binary'],
        'Everyone': ['Male', 'Female', 'Men', 'Women', 'Non-binary', 'Other', ''],
      };
      const expandedGenders = [...new Set(
        currentUser.matchPreferences.genderPreference.flatMap(g => genderMap[g] || [g])
      )];
      // If 'Everyone' is in the preference, skip the gender filter entirely
      if (!currentUser.matchPreferences.genderPreference.includes('Everyone')) {
        query.gender = { $in: expandedGenders };
      }
    }

    // Apply age range filter.
    // Use $or so users who haven't stored an age yet (age: undefined/null)
    // still appear as candidates. The scoring algorithm handles undefined age gracefully.
    if (currentUser.matchPreferences?.ageRange) {
      const { min, max } = currentUser.matchPreferences.ageRange;
      if (min && max) {
        query.$or = [
          { age: { $gte: min, $lte: max } },
          { age: { $exists: false } },
          { age: null }
        ];
      }
    }

    // FIX 2: Fetch all candidates first (no DB-level offset), then sort/score,
    // then paginate. Using DB offset before scoring produces wrong results because
    // the DB order != the scored order. We fetch a generous pool instead.
    const poolSize = Math.max(200, parseInt(limit) * 10);
    let potentialMatches = await User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires')
      .limit(poolSize)
      .lean();

    console.log('🔍 DEBUG - userId:', userId);
    console.log('🔍 DEBUG - currentUser found:', !!currentUser, '| age:', currentUser.age, '| gender:', currentUser.gender);
    console.log('🔍 DEBUG - matchPreferences:', JSON.stringify(currentUser.matchPreferences));
    console.log('🔍 DEBUG - interactedUsers count:', interactedUsers.length);
    console.log('🔍 DEBUG - DB query:', JSON.stringify(query));
    console.log('🔍 DEBUG - potentialMatches from DB:', potentialMatches.length, potentialMatches.map(u => `${u.username}(active:${u.discoverySettings?.isActive})`));

    // Calculate compatibility scores
    let scoredMatches = potentialMatches
      .map(user => {
        const score = calculateCompatibilityScore(currentUser, user);

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

    console.log('🔍 DEBUG - after scoring, count:', scoredMatches.length, scoredMatches.map(u => `${u.username}(score:${u.compatibilityScore})`));

    // Apply distance filter only if current user has a real location (not default [0,0])
    const userCoords = currentUser.location?.coordinates;
    const hasRealLocation = userCoords && !(userCoords[0] === 0 && userCoords[1] === 0);
    console.log('🔍 DEBUG - hasRealLocation:', hasRealLocation, '| distanceRange:', currentUser.matchPreferences?.distanceRange);
    if (hasRealLocation && currentUser.matchPreferences?.distanceRange) {
      scoredMatches = scoredMatches.filter(user =>
        !user.distance || user.distance <= currentUser.matchPreferences.distanceRange
      );
    }

    console.log('🔍 DEBUG - after distance filter, final count:', scoredMatches.length);

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

    // FIX 3: Apply pagination AFTER scoring (offset now works correctly)
    const parsedOffset = parseInt(offset);
    const parsedLimit = parseInt(limit);
    const paginatedMatches = scoredMatches.slice(parsedOffset, parsedOffset + parsedLimit);

    // Format response - respect visibility settings
    const formattedMatches = paginatedMatches.map(user => {
      const publicProfile = {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        photos: user.photos || [],
        bio: user.bio,
        age: user.age,
        compatibilityScore: user.compatibilityScore,
        distance:
          user.discoverySettings?.distanceVisible === false
            ? null
            : user.distance != null && Number.isFinite(user.distance)
              ? Math.round(user.distance)
              : null,
        interests: user.interests || [],
        relationshipGoals: user.relationshipGoals,
        profileCompleteness: user.profileCompleteness,
        isVerified: user.isVerified,
      };

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
      hasMore: scoredMatches.length > parsedOffset + parsedLimit
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

const todayStr = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

/**
 * Get current super like availability for a user (resets count if new day).
 * Returns { remaining, limit, nextResetAt }.
 */
async function getSuperLikeAvailability(user) {
  const limit = Math.max(0, user.superLikeAllowancePerDay ?? 1);
  let count = user.superLikeDailyCount ?? 0;
  let day = user.superLikeDay || '';

  if (day !== todayStr()) {
    count = 0;
    day = todayStr();
    user.superLikeDailyCount = 0;
    user.superLikeDay = day;
    await user.save();
  }

  const remaining = Math.max(0, limit - count);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return {
    remaining,
    limit,
    nextResetAt: tomorrow.toISOString()
  };
}

/**
 * Consume one super like for the user (call only after checking remaining > 0).
 */
async function consumeSuperLike(user) {
  const day = todayStr();
  if ((user.superLikeDay || '') !== day) {
    user.superLikeDailyCount = 0;
    user.superLikeDay = day;
  }
  user.superLikeDailyCount = (user.superLikeDailyCount || 0) + 1;
  await user.save();
}

/**
 * Handle user interaction (like, pass, super like)
 */
export const handleInteraction = async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetUserId, action } = req.body;

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

    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Super like: check daily allowance before creating interaction
    if (action === 'super_like') {
      const availability = await getSuperLikeAvailability(currentUser);
      if (availability.remaining <= 0) {
        return res.status(403).json({
          success: false,
          error: 'No Super likes left today',
          code: 'SUPER_LIKE_LIMIT',
          superLikesRemaining: 0,
          superLikeLimit: availability.limit,
          nextResetAt: availability.nextResetAt
        });
      }
    }

    // FIX 4: Check for existing interaction and UPDATE rather than reject.
    const existingInteraction = await Match.findOne({
      fromUser: userId,
      toUser: targetUserId
    });

    if (existingInteraction) {
      const availability = action === 'super_like'
        ? await getSuperLikeAvailability(currentUser)
        : null;
      const payload = {
        success: true,
        interaction: existingInteraction,
        isMatch: existingInteraction.isMutual,
        alreadyInteracted: true
      };
      if (availability) {
        payload.superLikesRemaining = availability.remaining;
        payload.superLikeLimit = availability.limit;
        payload.nextResetAt = availability.nextResetAt;
      }
      return res.status(200).json(payload);
    }

    const compatibilityScore = calculateCompatibilityScore(currentUser, targetUser);

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

    // Consume super like from daily allowance
    if (action === 'super_like') {
      await consumeSuperLike(currentUser);
    }

    // Check for mutual match (only for likes and super likes)
    let isMutualMatch = false;

    if (action === 'like' || action === 'super_like') {
      const reverseInteraction = await Match.findOne({
        fromUser: targetUserId,
        toUser: userId,
        status: { $in: ['liked', 'super_liked'] }
      });

      if (reverseInteraction) {
        isMutualMatch = true;
        await Match.createMutualMatch(userId, targetUserId, compatibilityScore);
      }
    }

    const availability = action === 'super_like'
      ? await getSuperLikeAvailability(currentUser)
      : null;

    const response = {
      success: true,
      interaction: newInteraction,
      isMatch: isMutualMatch
    };
    if (availability) {
      response.superLikesRemaining = availability.remaining;
      response.superLikeLimit = availability.limit;
      response.nextResetAt = availability.nextResetAt;
    }

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

    // Real-time notification to the person who was liked (or super-liked)
    const io = req.app.get('io');
    if (io && (action === 'like' || action === 'super_like')) {
      const targetRoom = String(targetUserId);
      io.to(`user:${String(targetRoom)}`).emit('app_notification', {
        type: action === 'super_like' ? 'super_like' : 'like',
        fromUserId: String(userId),
        username: currentUser.username,
        profilePicture: currentUser.profilePicture || null,
        isMatch: isMutualMatch,
        createdAt: new Date().toISOString()
      });
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

    const formattedMatches = matches.map(match => {
      // FIX 6: Safe toString comparison - _id may be ObjectId or string
      const fromId = match.fromUser?._id?.toString();
      const otherUser = fromId === userId.toString()
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
          location: otherUser.location?.displayLocation || otherUser.location?.city
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
 * Get users I liked (not yet matched)
 */
export const getLikedByMe = async (req, res) => {
  try {
    const { userId } = req.params;

    const docs = await Match.find({
      fromUser: userId,
      status: { $in: ['liked', 'super_liked'] },
      isMutual: false
    })
      .populate('toUser', 'username profilePicture bio age location interests')
      .sort({ createdAt: -1 })
      .lean();

    const list = docs
      .filter(doc => doc.toUser)
      .map(doc => ({
      interactionId: doc._id,
      user: {
        _id: doc.toUser._id,
        username: doc.toUser.username,
        profilePicture: doc.toUser.profilePicture,
        bio: doc.toUser.bio,
        age: doc.toUser.age,
        location: doc.toUser.location?.displayLocation || doc.toUser.location?.city,
        interests: doc.toUser.interests
      },
      isSuperLike: doc.status === 'super_liked',
      likedAt: doc.createdAt
    }));

    return res.status(200).json({
      success: true,
      list,
      total: list.length
    });
  } catch (error) {
    console.error('getLikedByMe error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch liked list',
      detail: error.message
    });
  }
};

/**
 * Get users I passed on
 */
export const getPassed = async (req, res) => {
  try {
    const { userId } = req.params;

    const docs = await Match.find({
      fromUser: userId,
      status: 'passed'
    })
      .populate('toUser', 'username profilePicture bio age location interests')
      .sort({ createdAt: -1 })
      .lean();

    const list = docs
      .filter(doc => doc.toUser)
      .map(doc => ({
      interactionId: doc._id,
      user: {
        _id: doc.toUser._id,
        username: doc.toUser.username,
        profilePicture: doc.toUser.profilePicture,
        bio: doc.toUser.bio,
        age: doc.toUser.age,
        location: doc.toUser.location?.displayLocation || doc.toUser.location?.city,
        interests: doc.toUser.interests
      },
      passedAt: doc.createdAt
    }));

    return res.status(200).json({
      success: true,
      list,
      total: list.length
    });
  } catch (error) {
    console.error('getPassed error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch passed list',
      detail: error.message
    });
  }
};

/**
 * Get users I blocked
 */
export const getBlocked = async (req, res) => {
  try {
    const { userId } = req.params;

    const docs = await Match.find({
      fromUser: userId,
      status: 'blocked'
    })
      .populate('toUser', 'username profilePicture bio age location interests')
      .sort({ createdAt: -1 })
      .lean();

    const list = docs
      .filter(doc => doc.toUser)
      .map(doc => ({
        interactionId: doc._id,
        user: {
          _id: doc.toUser._id,
          username: doc.toUser.username,
          profilePicture: doc.toUser.profilePicture,
          bio: doc.toUser.bio,
          age: doc.toUser.age,
          location: doc.toUser.location?.displayLocation || doc.toUser.location?.city,
          interests: doc.toUser.interests
        },
        blockedAt: doc.createdAt
      }));

    return res.status(200).json({
      success: true,
      list,
      total: list.length
    });
  } catch (error) {
    console.error('getBlocked error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch blocked list',
      detail: error.message
    });
  }
};

/**
 * Remove my interaction (like or pass). They can show in Discover / Likes you again.
 * Not allowed for mutual matches.
 */
export const removeInteraction = async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, error: 'targetUserId is required' });
    }

    const myRecord = await Match.findOne({
      fromUser: userId,
      toUser: targetUserId
    });

    if (!myRecord) {
      return res.status(404).json({ success: false, error: 'No interaction found' });
    }
    if (myRecord.isMutual) {
      return res.status(400).json({ success: false, error: 'Cannot remove a match' });
    }

    await Match.deleteOne({ fromUser: userId, toUser: targetUserId });

    return res.status(200).json({
      success: true,
      message: 'Interaction removed'
    });
  } catch (error) {
    console.error('removeInteraction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove interaction',
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
      return res.status(404).json({ success: false, error: 'User not found' });
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
      return res.status(404).json({ success: false, error: 'User not found' });
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
 * totalMatches: deduplicated count (each mutual match has 2 Match docs, so we use getUserMatches length).
 * likesReceived: only users who liked me and I have not yet responded (so it matches "Likes you" list).
 */
export const getDiscoveryStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const myInteractedUserIds = await Match.find({ fromUser: userId }).distinct('toUser');

    const [likesReceivedCount, likesSent, likedByMePendingCount, passes, deduplicatedMatches] = await Promise.all([
      Match.countDocuments({
        toUser: userId,
        status: { $in: ['liked', 'super_liked'] },
        isMutual: false,
        fromUser: { $nin: myInteractedUserIds }
      }),
      Match.countDocuments({
        fromUser: userId,
        status: { $in: ['liked', 'super_liked'] }
      }),
      Match.countDocuments({
        fromUser: userId,
        status: { $in: ['liked', 'super_liked'] },
        isMutual: false
      }),
      Match.countDocuments({
        fromUser: userId,
        status: 'passed'
      }),
      Match.getUserMatches(userId, 1000)
    ]);

    const totalMatches = deduplicatedMatches.length;

    const [recentMatches, currentUser] = await Promise.all([
      Match.find({
        $or: [{ fromUser: userId }, { toUser: userId }],
        isMutual: true
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('fromUser toUser', 'username profilePicture'),
      User.findById(userId)
    ]);

    let superLikeStats = { superLikesRemaining: 0, superLikeLimit: 1, nextResetAt: null };
    if (currentUser) {
      superLikeStats = await getSuperLikeAvailability(currentUser);
    }

    return res.status(200).json({
      success: true,
      stats: {
        likesReceived: likesReceivedCount,
        likesSent,
        likedByMePending: likedByMePendingCount,
        totalMatches,
        passes,
        recentMatches: recentMatches.length,
        superLikesRemaining: superLikeStats.remaining,
        superLikeLimit: superLikeStats.limit,
        nextResetAt: superLikeStats.nextResetAt
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
      return res.status(400).json({ success: false, error: 'targetUserId is required' });
    }

    await Match.deleteMany({
      $or: [
        { fromUser: userId, toUser: targetUserId },
        { fromUser: targetUserId, toUser: userId }
      ]
    });

    return res.status(200).json({ success: true, message: 'Unmatched successfully' });

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
  getLikedByMe,
  getPassed,
  removeInteraction,
  updateMatchPreferences,
  updateDiscoverySettings,
  getDiscoveryStats,
  unmatch
};