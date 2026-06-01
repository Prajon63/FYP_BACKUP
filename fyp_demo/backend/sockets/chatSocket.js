import jwt from 'jsonwebtoken';
import Match from '../models/Match.js';
import { dispatchChatMessage } from '../Utils/dispatchChatMessage.js';

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

        await dispatchChatMessage({
          io,
          matchId,
          senderId: socket.userId,
          receiverId,
          content: content.trim(),
          messageType: 'text',
        });
      } catch (err) {
        console.error('[Socket] send_message error:', err);
        socket.emit('error', {
          message: err.message || 'Could not send message',
          code: err.code,
        });
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

