import Match from '../models/Match.js';
import Message from '../models/Message.js';
import cloudinary from '../config/cloudinary.js';
import { messagePreview } from './dispatchChatMessage.js';

async function getPairMatchIds(match) {
  const pairMatches = await Match.find({
    $or: [
      { fromUser: match.fromUser, toUser: match.toUser },
      { fromUser: match.toUser, toUser: match.fromUser },
    ],
  }).select('_id');

  return pairMatches.length ? pairMatches.map((m) => m._id) : [match._id];
}

function cloudinaryPublicIdFromUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const afterUpload = url.split('/upload/')[1];
    if (!afterUpload) return null;
    const path = afterUpload.replace(/^v\d+\//, '');
    const withoutExt = path.split('.')[0];
    return withoutExt || null;
  } catch {
    return null;
  }
}

async function removeChatImageFromCloudinary(imageUrl) {
  const publicId = cloudinaryPublicIdFromUrl(imageUrl);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('Failed to delete chat image from Cloudinary:', err.message);
  }
}

async function refreshMatchLastMessage(matchIds) {
  const latest = await Message.findOne({ matchId: { $in: matchIds } })
    .sort({ createdAt: -1 })
    .select('createdAt');

  const now = new Date();
  await Match.updateMany(
    { _id: { $in: matchIds } },
    {
      $set: {
        lastMessageAt: latest?.createdAt ?? null,
        conversationStarted: !!latest,
        updatedAt: now,
      },
    }
  );
}

/**
 * Deletes a chat message (sender only). Broadcasts to both users in the thread.
 */
export async function deleteChatMessage({ io, matchId, messageId, userId }) {
  const message = await Message.findById(messageId);
  if (!message) {
    const err = new Error('Message not found');
    err.status = 404;
    throw err;
  }

  if (message.sender.toString() !== String(userId)) {
    const err = new Error('You can only unsend your own messages');
    err.status = 403;
    throw err;
  }

  const match = await Match.findById(matchId);
  if (!match) {
    const err = new Error('Match not found');
    err.status = 404;
    throw err;
  }

  const uid = String(userId);
  const isParticipant =
    match.fromUser.toString() === uid || match.toUser.toString() === uid;

  if (!isParticipant) {
    const err = new Error('Not authorized for this match');
    err.status = 403;
    throw err;
  }

  const matchIds = await getPairMatchIds(match);
  const messageInThread = matchIds.some(
    (id) => id.toString() === message.matchId.toString()
  );

  if (!messageInThread) {
    const err = new Error('Message does not belong to this conversation');
    err.status = 400;
    throw err;
  }

  if (message.messageType === 'image' && message.imageUrl) {
    await removeChatImageFromCloudinary(message.imageUrl);
  }

  await Message.findByIdAndDelete(messageId);
  await refreshMatchLastMessage(matchIds);

  if (io) {
    const roomMatchIds = matchIds.map((id) => id.toString());
    roomMatchIds.forEach((id) => {
      io.to(`chat:${id}`).emit('message_deleted', {
        messageId: String(messageId),
        matchId: String(matchId),
      });
    });
  }

  return { messageId: String(messageId), matchId: String(matchId) };
}

export { messagePreview };
