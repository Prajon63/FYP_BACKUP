import mongoose from 'mongoose';

/**
 * Match/Interaction Model
 * Tracks all user interactions for matchmaking:
 * - Likes (swipe right)
 * - Passes (swipe left)
 * - Mutual matches
 * - Super likes
 * - Blocks
 */

const matchSchema = new mongoose.Schema({
  // User who initiated the action
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // User who received the action
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Type of interaction
  status: {
    type: String,
    enum: ['liked', 'passed', 'matched', 'super_liked', 'blocked'],
    required: true,
    index: true
  },
  
  // For mutual matches
  isMutual: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Match score (calculated by algorithm)
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Conversation started
  conversationStarted: {
    type: Boolean,
    default: false
  },
  
  // Last message timestamp (for match activity)
  lastMessageAt: {
    type: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient queries
matchSchema.index({ fromUser: 1, toUser: 1 }, { unique: true }); // Prevent duplicate interactions
matchSchema.index({ fromUser: 1, status: 1 });
matchSchema.index({ toUser: 1, status: 1 });
matchSchema.index({ fromUser: 1, toUser: 1, status: 1 });
matchSchema.index({ isMutual: 1, createdAt: -1 }); // For fetching matches
matchSchema.index({ fromUser: 1, isMutual: 1 }); // User's matches

// Pre-save middleware
matchSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method: Check if two users have matched
matchSchema.statics.checkMutualMatch = async function(userId1, userId2) {
  const match1 = await this.findOne({
    fromUser: userId1,
    toUser: userId2,
    status: { $in: ['liked', 'super_liked'] }
  });
  
  const match2 = await this.findOne({
    fromUser: userId2,
    toUser: userId1,
    status: { $in: ['liked', 'super_liked'] }
  });
  
  return match1 && match2;
};

// Static method: Create or update mutual match
matchSchema.statics.createMutualMatch = async function(userId1, userId2, score = 0) {
  await this.updateMany(
    {
      $or: [
        { fromUser: userId1, toUser: userId2 },
        { fromUser: userId2, toUser: userId1 }
      ]
    },
    {
      $set: {
        status: 'matched',
        isMutual: true,
        matchScore: score,
        updatedAt: new Date()
      }
    }
  );
};

// Static method: Get user's matches
matchSchema.statics.getUserMatches = async function(userId, limit = 50) {
  return this.find({
    $or: [
      { fromUser: userId, isMutual: true },
      { toUser: userId, isMutual: true }
    ]
  })
  .populate('fromUser', 'username profilePicture bio age location')
  .populate('toUser', 'username profilePicture bio age location')
  .sort({ updatedAt: -1 })
  .limit(limit);
};

// Static method: Get users that liked me
matchSchema.statics.getUsersWhoLikedMe = async function(userId) {
  return this.find({
    toUser: userId,
    status: { $in: ['liked', 'super_liked'] },
    isMutual: false
  })
  .populate('fromUser', 'username profilePicture bio age location interests')
  .sort({ createdAt: -1 });
};

// Static method: Check if user already interacted with someone
matchSchema.statics.hasInteracted = async function(fromUserId, toUserId) {
  const interaction = await this.findOne({
    fromUser: fromUserId,
    toUser: toUserId
  });
  return !!interaction;
};

// Static method: Get interaction between two users
matchSchema.statics.getInteraction = async function(userId1, userId2) {
  return this.findOne({
    $or: [
      { fromUser: userId1, toUser: userId2 },
      { fromUser: userId2, toUser: userId1 }
    ]
  });
};

const Match = mongoose.model('Match', matchSchema);

export default Match;