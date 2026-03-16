import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket: Socket | null = null;

/**
 * Call once on app load (after login).
 * Connects to the socket server with the stored JWT.
 */
export const connectSocket = (): Socket => {
  // Always create a fresh connection so we never
  // accidentally reuse a socket authenticated as
  // a previous user after logout/login.
  if (socket) {
    try {
      socket.disconnect();
    } catch {
      // ignore
    }
    socket = null;
  }

  const token = localStorage.getItem('token');

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

/**
 * Returns the existing socket instance (or null if not connected).
 */
export const getSocket = (): Socket | null => socket;

/**
 * Disconnects and clears the socket instance.
 * Call on logout.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket] Manually disconnected');
  }
};

