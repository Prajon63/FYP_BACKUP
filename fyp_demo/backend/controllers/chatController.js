import Message from '../models/Message.js';
import Match from '../models/Match.js';
import cloudinary from '../config/cloudinary.js';
import { getBlockContext, chatBlockMessage } from '../Utils/privacyAccess.js';
import {
  dispatchChatMessage,
  dispatchProfileShare,
  messagePreview,
} from '../Utils/dispatchChatMessage.js';
import { deleteChatMessage as removeChatMessage } from '../Utils/deleteChatMessage.js';

const uploadChatImageToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'capella_chat', resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });

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

    const otherUserId =
      match.fromUser.toString() === userId.toString()
        ? match.toUser
        : match.fromUser;
    const privacy = await getBlockContext(userId, otherUserId);
    if (privacy) {
      privacy.message = chatBlockMessage(privacy);
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

    res.json({ messages, privacy });
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

/**
 * GET /api/chat/unread-digest
 * Unread messages for the bell when the user was offline (socket missed them).
 * One row per match (latest unread in that thread).
 */
export const getUnreadDigest = async (req, res) => {
  try {
    const userId = req.user._id;

    const unread = await Message.find({ receiver: userId, read: false })
      .sort({ createdAt: -1 })
      .populate('sender', 'username')
      .limit(80);

    const byMatch = new Map();
    for (const m of unread) {
      const mid = m.matchId.toString();
      if (!byMatch.has(mid)) byMatch.set(mid, m);
    }

    const items = [...byMatch.values()].slice(0, 25).map((m) => ({
      matchId: m.matchId.toString(),
      senderId: m.sender?._id?.toString?.() || '',
      senderUsername: m.sender?.username || 'Someone',
      preview: messagePreview(m),
      createdAt: m.createdAt?.toISOString?.() || new Date().toISOString(),
      messageId: m._id.toString()
    }));

    res.json({ success: true, items });
  } catch (err) {
    console.error('getUnreadDigest error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const MAX_CHAT_IMAGES = 4;

/**
 * POST /api/chat/:matchId/image
 * Upload chat images (multipart field: images, max 4). Body: receiverId
 */
export const uploadChatImage = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId is required' });
    }

    const files = req.files;
    if (!files?.length) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    if (files.length > MAX_CHAT_IMAGES) {
      return res.status(400).json({
        message: `You can send up to ${MAX_CHAT_IMAGES} images at a time`,
      });
    }

    const imageUrls = await Promise.all(
      files.map((file) => uploadChatImageToCloudinary(file))
    );
    const io = req.app.get('io');

    const messages = [];
    const count = imageUrls.length;
    const batchPreview =
      count > 1 ? `📷 ${count} photos` : '📷 Photo';

    for (let i = 0; i < imageUrls.length; i++) {
      const message = await dispatchChatMessage({
        io,
        matchId,
        senderId: req.user._id,
        receiverId,
        messageType: 'image',
        imageUrl: imageUrls[i],
        content: '',
        notify: i === imageUrls.length - 1,
        notificationPreview: batchPreview,
      });
      messages.push(message);
    }

    res.status(201).json({ success: true, messages, message: messages[0] });
  } catch (err) {
    console.error('uploadChatImage error:', err);
    const status = err.status || 500;
    res.status(status).json({
      message: err.message || 'Failed to upload images',
      code: err.code,
    });
  }
};

/**
 * POST /api/chat/:matchId/profile-share
 * Share any profile in chat. Body: { receiverId, sharedUserId }
 */
export const shareProfileInChat = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { receiverId, sharedUserId } = req.body;

    if (!receiverId || !sharedUserId) {
      return res.status(400).json({
        message: 'receiverId and sharedUserId are required',
      });
    }

    const io = req.app.get('io');
    const message = await dispatchProfileShare({
      io,
      matchId,
      senderId: req.user._id,
      receiverId,
      sharedUserId,
    });

    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error('shareProfileInChat error:', err);
    const status = err.status || 500;
    res.status(status).json({
      message: err.message || 'Failed to share profile',
      code: err.code,
    });
  }
};

/**
 * DELETE /api/chat/:matchId/messages/:messageId
 * Unsend/delete a message (sender only). Text and image messages.
 */
export const deleteChatMessage = async (req, res) => {
  try {
    const { matchId, messageId } = req.params;
    const io = req.app.get('io');

    const result = await removeChatMessage({
      io,
      matchId,
      messageId,
      userId: req.user._id,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('deleteChatMessage error:', err);
    const status = err.status || 500;
    res.status(status).json({
      message: err.message || 'Failed to delete message',
    });
  }
};

