import Match from '../models/Match.js';
import Message from '../models/Message.js';
import { getBlockContext, chatBlockMessage } from './privacyAccess.js';

/**
 * Validates match participation and messaging permissions.
 */
export async function assertCanSendChatMessage(matchId, senderId, receiverId) {
  const match = await Match.findById(matchId);
  if (!match) {
    const err = new Error('Match not found');
    err.status = 404;
    throw err;
  }

  const sid = String(senderId);
  const isParticipant =
    match.fromUser.toString() === sid || match.toUser.toString() === sid;

  if (!isParticipant) {
    const err = new Error('Not authorized for this match');
    err.status = 403;
    throw err;
  }

  const rid = String(receiverId);
  const isValidReceiver =
    match.fromUser.toString() === rid || match.toUser.toString() === rid;

  if (!isValidReceiver) {
    const err = new Error('Invalid receiver for this match');
    err.status = 400;
    throw err;
  }

  const blockCtx = await getBlockContext(senderId, rid);
  if (!blockCtx.canMessage) {
    const err = new Error(chatBlockMessage(blockCtx) || 'Messaging is unavailable.');
    err.status = 403;
    err.code = blockCtx.blockedMe ? 'BLOCKED_BY_USER' : 'BLOCKED_BY_YOU';
    throw err;
  }

  const pairMatches = await Match.find({
    $or: [
      { fromUser: match.fromUser, toUser: match.toUser },
      { fromUser: match.toUser, toUser: match.fromUser },
    ],
  }).select('_id');

  return { match, pairMatches };
}

/**
 * Persists a message, updates match metadata, populates, and broadcasts via Socket.IO.
 */
export async function dispatchChatMessage({
  io,
  matchId,
  senderId,
  receiverId,
  content = '',
  messageType = 'text',
  imageUrl,
  notify = true,
  notificationPreview,
}) {
  const { match, pairMatches } = await assertCanSendChatMessage(
    matchId,
    senderId,
    receiverId
  );

  const payload = {
    matchId: match._id,
    sender: senderId,
    receiver: String(receiverId),
    content: (content || '').trim(),
    messageType,
  };

  if (messageType === 'image') {
    if (!imageUrl) {
      const err = new Error('Image URL is required');
      err.status = 400;
      throw err;
    }
    payload.imageUrl = imageUrl;
    if (!payload.content) payload.content = '';
  } else if (!payload.content) {
    const err = new Error('Message content is required');
    err.status = 400;
    throw err;
  }

  if (payload.content.length > 1000) {
    const err = new Error('Message too long (max 1000 chars)');
    err.status = 400;
    throw err;
  }

  const message = await Message.create(payload);

  const now = new Date();
  const pairIds = pairMatches.length
    ? pairMatches.map((m) => m._id)
    : [match._id];

  await Match.updateMany(
    { _id: { $in: pairIds } },
    {
      $set: {
        lastMessageAt: now,
        conversationStarted: true,
        updatedAt: now,
      },
    }
  );

  const populated = await message.populate([
    { path: 'sender', select: 'username profilePicture' },
    { path: 'receiver', select: 'username profilePicture' },
  ]);

  if (io) {
    const matchIdsToNotify = pairMatches.length
      ? pairMatches.map((m) => m._id.toString())
      : [String(matchId)];

    matchIdsToNotify.forEach((id) => {
      io.to(`chat:${id}`).emit('receive_message', populated);
    });

    if (notify) {
      const preview =
        notificationPreview ??
        (messageType === 'image'
          ? '📷 Photo'
          : payload.content.slice(0, 60));

      io.to(`user:${String(receiverId)}`).emit('new_message_notification', {
        matchId: String(matchId),
        senderId: String(senderId),
        preview,
        senderUsername: populated.sender?.username,
      });
    }
  }

  return populated;
}

export function messagePreview(message) {
  if (message?.messageType === 'image') return '📷 Photo';
  return (message?.content || '').slice(0, 60);
}
