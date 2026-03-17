import Message from '../models/Message.js';
import Match from '../models/Match.js';

/**
 * GET /api/chat/:matchId
 * Returns chat history for a match. Only participants can access.
 */
export const getChatHistory = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const isParticipant =
      match.fromUser.toString() === userId.toString() ||
      match.toUser.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch both directions of this match so each user sees a single unified thread
    const pairMatches = await Match.find({
      $or: [
        { fromUser: match.fromUser, toUser: match.toUser },
        { fromUser: match.toUser, toUser: match.fromUser }
      ]
    }).select('_id');

    const matchIds = pairMatches.length ? pairMatches.map((m) => m._id) : [match._id];

    const messages = await Message.find({ matchId: { $in: matchIds } })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture');

    await Message.updateMany(
      { matchId: { $in: matchIds }, receiver: userId, read: false },
      { read: true }
    );

    const io = req.app.get('io');
    if (io && messages.length > 0) {
      const senderIds = [...new Set(
        messages
          .filter(m => m.receiver._id.toString() === userId.toString())
          .map(m => m.sender._id.toString())
      )];

      senderIds.forEach(senderId => {
        io.to(`user:${senderId}`).emit('messages_read', { matchId });
      });
    }

    res.json({ messages });
  } catch (err) {
    console.error('getChatHistory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/chat/unread-count
 * Returns total unread message count for the logged-in user.
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Message.countDocuments({ receiver: userId, read: false });
    res.json({ count });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

