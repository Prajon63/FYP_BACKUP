import jwt from 'jsonwebtoken';
import Match from '../models/Match.js';
import Message from '../models/Message.js';

/**
 * Registers all socket.io chat logic on the given `io` instance.
 * Call this once from server.js after io is created.
 */
export const registerChatSocket = (io) => {
  // Auth middleware for all socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token missing'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const rawId = decoded.id ?? decoded._id ?? decoded.userId;
      socket.userId = rawId != null ? String(rawId) : null;

      if (!socket.userId) return next(new Error('Invalid token payload'));
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.userId}`);

    // Personal room for direct notifications
    socket.join(`user:${String(socket.userId)}`);  //room will use the same string

    // Join chat room for a specific match
    socket.on('join_chat', async ({ matchId }) => {
      try {
        if (!matchId) return socket.emit('error', { message: 'matchId required' });

        const match = await Match.findById(matchId);
        if (!match) return socket.emit('error', { message: 'Match not found' });

        const isParticipant =
          match.fromUser.toString() === socket.userId.toString() ||
          match.toUser.toString() === socket.userId.toString();

        if (!isParticipant) {
          return socket.emit('error', { message: 'You are not part of this match' });
        }

        socket.join(`chat:${matchId}`);
        socket.emit('joined_chat', { matchId });
        console.log(`[Socket] User ${socket.userId} joined chat:${matchId}`);
      } catch (err) {
        console.error('[Socket] join_chat error:', err);
        socket.emit('error', { message: 'Could not join chat' });
      }
    });

    // Send a message within a match
    socket.on('send_message', async ({ matchId, receiverId, content }) => {
      try {
        if (!matchId || !receiverId || !content?.trim()) {
          return socket.emit('error', {
            message: 'matchId, receiverId, and content are required'
          });
        }

        if (content.trim().length > 1000) {
          return socket.emit('error', { message: 'Message too long (max 1000 chars)' });
        }

        const match = await Match.findById(matchId);
        if (!match) return socket.emit('error', { message: 'Match not found' });

        const isParticipant =
          match.fromUser.toString() === socket.userId.toString() ||
          match.toUser.toString() === socket.userId.toString();

        if (!isParticipant) {
          return socket.emit('error', { message: 'Not authorized for this match' });
        }

        const rid = String(receiverId);
        const isValidReceiver =
          match.fromUser.toString() === rid ||
          match.toUser.toString() === rid;

        if (!isValidReceiver) {
          return socket.emit('error', { message: 'Invalid receiver for this match' });
        }

        // Find both directions of this match so both users,
        // regardless of which Match document their UI uses,
        // share a single real-time thread.
        const pairMatches = await Match.find({
          $or: [
            { fromUser: match.fromUser, toUser: match.toUser },
            { fromUser: match.toUser, toUser: match.fromUser }
          ]
        }).select('_id');

        const targetMatchId = match._id;

        const message = await Message.create({
          matchId: targetMatchId,
          sender: socket.userId,
          receiver: rid,
          content: content.trim()
        });

        const populated = await message.populate([
          { path: 'sender', select: 'username profilePicture' },
          { path: 'receiver', select: 'username profilePicture' }
        ]);

        // Broadcast to both possible match rooms so each side receives updates
        const matchIdsToNotify = pairMatches.length
          ? pairMatches.map((m) => m._id.toString())
          : [targetMatchId.toString()];

        matchIdsToNotify.forEach((id) => {
          io.to(`chat:${id}`).emit('receive_message', populated);
        });

        const preview = content.trim().slice(0, 60);
        const senderName = populated.sender?.username;

        const receiverRoomId = rid;

        io.to(`user:${receiverRoomId}`).emit('new_message_notification', {
          matchId: String(matchId),
          senderId: String(socket.userId),
          preview,
          senderUsername: senderName
        });
      } catch (err) {
        console.error('[Socket] send_message error:', err);
        socket.emit('error', { message: 'Could not send message' });
      }
    });

    // Typing indicators
    socket.on('typing', ({ matchId }) => {
      if (!matchId) return;
      socket.to(`chat:${matchId}`).emit('user_typing', { userId: socket.userId });
    });

    socket.on('stop_typing', ({ matchId }) => {
      if (!matchId) return;
      socket.to(`chat:${matchId}`).emit('user_stopped_typing', { userId: socket.userId });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.userId}`);
    });
  });
};

