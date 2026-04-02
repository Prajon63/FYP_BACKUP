import { io, Socket } from 'socket.io-client';

const SOCKET_RESET_EVENT = 'capella-socket-reset';

function resolveSocketUrl(): string {
  const direct = import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, '');
  if (direct) return direct;

  const api = import.meta.env.VITE_API_URL;
  if (api) return api.replace(/\/api\/?$/, '').replace(/\/$/, '') || 'http://localhost:5000';

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000`;
  }
  return 'http://localhost:5000';
}

function notifySocketInstanceChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SOCKET_RESET_EVENT));
}

/** NotificationProvider should subscribe to this so listeners re-bind after login/logout. */
export const SOCKET_RESET_EVENT_NAME = SOCKET_RESET_EVENT;

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
  const url = resolveSocketUrl();

  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true
  });

  notifySocketInstanceChanged();

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
    notifySocketInstanceChanged();
  }
};

