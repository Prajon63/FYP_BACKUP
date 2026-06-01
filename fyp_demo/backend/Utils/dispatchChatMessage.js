import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getBlockContext, chatBlockMessage } from './privacyAccess.js';

/**
 * Both users must have an active mutual match record.
 */
export async function assertUsersMutuallyMatched(userIdA, userIdB) {
  const a = String(userIdA);
  const b = String(userIdB);
  const doc = await Match.findOne({
    isMutual: true,
    $or: [
      { fromUser: a, toUser: b },
      { fromUser: b, toUser: a },
    ],
  }).select('_id');

  if (!doc) {
    const err = new Error(
      'Profile sharing is only available between mutual matches'
    );
    err.status = 403;
    throw err;
  }
  return doc;
}

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
  } else if (messageType === 'profile') {
    const err = new Error('Use dispatchProfileShare for profile messages');
    err.status = 400;
    throw err;
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

/**
 * Share any user's profile in an existing mutual-match chat thread.
 * The shared profile does not need to be a match of the sender.
 */
export async function dispatchProfileShare({
  io,
  matchId,
  senderId,
  receiverId,
  sharedUserId,
}) {
  const { match, pairMatches } = await assertCanSendChatMessage(
    matchId,
    senderId,
    receiverId
  );

  await assertUsersMutuallyMatched(senderId, receiverId);

  const sharedId = String(sharedUserId);
  if (sharedId === String(senderId)) {
    const err = new Error('You cannot share your own profile');
    err.status = 400;
    throw err;
  }

  const sharedUser = await User.findById(sharedId).select(
    'username profilePicture'
  );
  if (!sharedUser) {
    const err = new Error('Profile not found');
    err.status = 404;
    throw err;
  }

  const username = sharedUser.username || 'User';
  const message = await Message.create({
    matchId: match._id,
    sender: senderId,
    receiver: String(receiverId),
    messageType: 'profile',
    content: '',
    sharedProfile: {
      userId: sharedUser._id,
      username,
      profilePicture: sharedUser.profilePicture || '',
    },
  });

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

  const preview = `👤 ${username}'s profile`;

  if (io) {
    const matchIdsToNotify = pairMatches.length
      ? pairMatches.map((m) => m._id.toString())
      : [String(matchId)];

    matchIdsToNotify.forEach((id) => {
      io.to(`chat:${id}`).emit('receive_message', populated);
    });

    io.to(`user:${String(receiverId)}`).emit('new_message_notification', {
      matchId: String(matchId),
      senderId: String(senderId),
      preview,
      senderUsername: populated.sender?.username,
    });
  }

  return populated;
}

export function messagePreview(message) {
  if (message?.messageType === 'image') return '📷 Photo';
  if (message?.messageType === 'profile') {
    const name = message?.sharedProfile?.username || 'Profile';
    return `👤 ${name}'s profile`;
  }
  return (message?.content || '').slice(0, 60);
}
