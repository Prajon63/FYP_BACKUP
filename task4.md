# TASK 2 — Socket.io Engine (Auth Handshake + Match Guard + Room Management)

## Context
- Task 1 is complete: `Message` model, chat REST routes, and Socket.io `io` instance exist on `server.js`
- The `io` instance is available via `app.get('io')` or directly in `server.js`
- JWT secret is in `process.env.JWT_SECRET`
- `Match` model has fields `user1` and `user2` (ObjectIds)

## Your Job
Create the entire real-time socket engine in one new file.

---

## Step 1 — Create `sockets/chatSocket.js`

Create this file at `backend/sockets/chatSocket.js`:

```js
import jwt from 'jsonwebtoken';
import Match from '../models/Match.js';
import Message from '../models/Message.js';

/**
 * Registers all socket.io chat logic on the given `io` instance.
 * Call this once from server.js after io is created.
 */
export const registerChatSocket = (io) => {

  // ─── AUTH MIDDLEWARE (runs before any connection is established) ───
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token missing'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded._id || decoded.userId;

      if (!socket.userId) return next(new Error('Invalid token payload'));
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  // ─── CONNECTION ───────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.userId}`);

    // Join a personal room so we can send targeted events to this user
    socket.join(`user:${socket.userId}`);

    // ── JOIN CHAT ROOM ──────────────────────────────────────────────
    /**
     * Client emits: { matchId: string }
     * Server validates the match, then joins the socket to that room.
     */
    socket.on('join_chat', async ({ matchId }) => {
      try {
        if (!matchId) return socket.emit('error', { message: 'matchId required' });

        const match = await Match.findById(matchId);
        if (!match) return socket.emit('error', { message: 'Match not found' });

        const isParticipant =
          match.user1.toString() === socket.userId.toString() ||
          match.user2.toString() === socket.userId.toString();

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

    // ── SEND MESSAGE ────────────────────────────────────────────────
    /**
     * Client emits: { matchId: string, receiverId: string, content: string }
     * Server validates match participation, saves to DB, broadcasts to room.
     */
    socket.on('send_message', async ({ matchId, receiverId, content }) => {
      try {
        // Basic validation
        if (!matchId || !receiverId || !content?.trim()) {
          return socket.emit('error', { message: 'matchId, receiverId, and content are required' });
        }

        if (content.trim().length > 1000) {
          return socket.emit('error', { message: 'Message too long (max 1000 chars)' });
        }

        // Verify match exists and user is a participant
        const match = await Match.findById(matchId);
        if (!match) return socket.emit('error', { message: 'Match not found' });

        const isParticipant =
          match.user1.toString() === socket.userId.toString() ||
          match.user2.toString() === socket.userId.toString();

        if (!isParticipant) {
          return socket.emit('error', { message: 'Not authorized for this match' });
        }

        // Verify receiver is the other participant
        const isValidReceiver =
          match.user1.toString() === receiverId ||
          match.user2.toString() === receiverId;

        if (!isValidReceiver) {
          return socket.emit('error', { message: 'Invalid receiver for this match' });
        }

        // Persist to database
        const message = await Message.create({
          matchId,
          sender: socket.userId,
          receiver: receiverId,
          content: content.trim(),
        });

        const populated = await message.populate([
          { path: 'sender', select: 'name profilePicture' },
          { path: 'receiver', select: 'name profilePicture' },
        ]);

        // Broadcast to everyone in the chat room (both participants)
        io.to(`chat:${matchId}`).emit('receive_message', populated);

        // Also send unread notification to receiver's personal room
        // (in case they haven't opened the chat yet)
        io.to(`user:${receiverId}`).emit('new_message_notification', {
          matchId,
          senderId: socket.userId,
          preview: content.trim().slice(0, 60),
        });

      } catch (err) {
        console.error('[Socket] send_message error:', err);
        socket.emit('error', { message: 'Could not send message' });
      }
    });

    // ── TYPING INDICATOR ───────────────────────────────────────────
    /**
     * Client emits: { matchId: string }
     */
    socket.on('typing', ({ matchId }) => {
      socket.to(`chat:${matchId}`).emit('user_typing', { userId: socket.userId });
    });

    socket.on('stop_typing', ({ matchId }) => {
      socket.to(`chat:${matchId}`).emit('user_stopped_typing', { userId: socket.userId });
    });

    // ── DISCONNECT ─────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.userId}`);
    });
  });
};
```

---

## Step 2 — Register the socket engine in `server.js`

Add these two lines to `server.js` after the `io` instance is created (from Task 1):

```js
import { registerChatSocket } from './sockets/chatSocket.js';

// After: const io = new Server(httpServer, { ... });
registerChatSocket(io);
```

---

## Step 3 — Verify JWT payload field

Open your existing `middleware/auth.js` and check what field the JWT payload uses for the user ID. Common options:

- `decoded.id`
- `decoded._id`  
- `decoded.userId`

In `chatSocket.js` line:
```js
socket.userId = decoded.id || decoded._id || decoded.userId;
```
This covers all three. But if yours is different, update that line accordingly.

---

## Step 4 — Check your Match model fields

Open `models/Match.js` and confirm the field names for the two matched users.
The socket code assumes `match.user1` and `match.user2`.

If your Match model uses different field names (e.g., `users[0]`, `requester`, `recipient`), update **every occurrence** of `match.user1` and `match.user2` in `chatSocket.js` to match.

---

## Acceptance Criteria
- [ ] Server starts without errors after adding `registerChatSocket(io)`
- [ ] A socket client connecting without a token gets disconnected with `'Authentication token missing'`
- [ ] A socket client with a valid JWT connects successfully
- [ ] Emitting `join_chat` with a valid matchId the user belongs to results in `joined_chat` event back
- [ ] Emitting `join_chat` with a matchId the user does NOT belong to results in an `error` event
- [ ] Emitting `send_message` saves a document to the `messages` collection in MongoDB
- [ ] Both participants in a chat room receive `receive_message` after one sends

---

## Hand off to TASK 3
Once verified, let me know