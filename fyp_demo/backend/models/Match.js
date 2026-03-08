import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['liked', 'passed', 'matched', 'super_liked', 'blocked'],
    required: true,
    index: true
  },
  isMutual: {
    type: Boolean,
    default: false,
    index: true
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  conversationStarted: {
    type: Boolean,
    default: false
  },
  lastMessageAt: {
    type: Date
  },
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

matchSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
matchSchema.index({ fromUser: 1, status: 1 });
matchSchema.index({ toUser: 1, status: 1 });
matchSchema.index({ fromUser: 1, toUser: 1, status: 1 });
matchSchema.index({ isMutual: 1, createdAt: -1 });
matchSchema.index({ fromUser: 1, isMutual: 1 });

matchSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

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

/**
 * FIX 8: getUserMatches deduplicates matches.
 * Because createMutualMatch sets BOTH records to isMutual:true, the old query
 * returned both the A->B and B->A records for the same match, doubling every
 * result. We now only return the record where the current user is fromUser,
 * falling back to toUser records only if no fromUser record exists (edge case).
 */
matchSchema.statics.getUserMatches = async function(userId, limit = 50) {
  // Get all mutual records involving this user
  const allMatches = await this.find({
    $or: [
      { fromUser: userId, isMutual: true },
      { toUser: userId, isMutual: true }
    ]
  })
    .populate('fromUser', 'username profilePicture bio age location')
    .populate('toUser', 'username profilePicture bio age location')
    .sort({ updatedAt: -1 });

  // Deduplicate: for each pair (A,B) only keep one record
  const seen = new Set();
  const deduplicated = [];
  for (const match of allMatches) {
    const fromId = match.fromUser?._id?.toString();
    const toId = match.toUser?._id?.toString();
    if (!fromId || !toId) continue;
    // Create a canonical key by sorting the two IDs
    const key = [fromId, toId].sort().join('-');
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(match);
    }
  }

  return deduplicated.slice(0, limit);
};

/**
 * Get users who liked me and I have not yet responded to (no like/pass from me to them).
 * Excludes anyone I've already liked, passed, or super_liked so they don't reappear after refresh.
 */
matchSchema.statics.getUsersWhoLikedMe = async function(userId) {
  const myInteractedUserIds = await this.find({ fromUser: userId }).distinct('toUser');
  return this.find({
    toUser: userId,
    status: { $in: ['liked', 'super_liked'] },
    isMutual: false,
    fromUser: { $nin: myInteractedUserIds }
  })
    .populate('fromUser', 'username profilePicture bio age location interests')
    .sort({ createdAt: -1 });
};

matchSchema.statics.hasInteracted = async function(fromUserId, toUserId) {
  const interaction = await this.findOne({ fromUser: fromUserId, toUser: toUserId });
  return !!interaction;
};

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