import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  connectSocket,
  getSocket,
  SOCKET_RESET_EVENT_NAME,
} from '../services/socketService';
import { getUnreadMessageDigest } from '../services/chatService';
import { discoverService } from '../services/discoverService';
import { getStoredUserId } from '../utils/auth';
import type { Socket } from 'socket.io-client';
import type { Like, LikesResponse } from '../types';

export type NotificationKind = 'message' | 'like' | 'super_like';

export interface AppNotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  /** Navigate target */
  href?: string;
  meta?: Record<string, string | undefined>;
}

interface NotificationContextValue {
  notifications: AppNotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const MAX_ITEMS = 50;

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function mapAppNotification(payload: Record<string, unknown>): AppNotificationItem | null {
  const type = payload.type as string | undefined;
  if (type === 'message') {
    const preview = String(payload.preview || '').trim();
    const sender =
      (payload.senderUsername as string) ||
      (payload.senderId as string)?.slice(-6) ||
      'Someone';
    return {
      id: makeId(),
      kind: 'message',
      title: 'New message',
      body: preview ? `${sender}: ${preview}` : `Message from ${sender}`,
      createdAt: Date.now(),
      read: false,
      href: '/messages',
      meta: {
        matchId: String(payload.matchId || ''),
        senderId: String(payload.senderId || ''),
      },
    };
  }
  if (type === 'like' || type === 'super_like') {
    const name = String(payload.username || 'Someone');
    const isSuper = type === 'super_like';
    const isMatch = Boolean(payload.isMatch);
    return {
      id: makeId(),
      kind: isSuper ? 'super_like' : 'like',
      title: isMatch ? "It's a match!" : isSuper ? 'Super like' : 'New like',
      body: isMatch
        ? `You and ${name} liked each other`
        : isSuper
          ? `${name} super liked you`
          : `${name} liked you`,
      createdAt: Date.now(),
      read: false,
      href: isMatch ? '/matches' : '/discover',
      meta: { fromUserId: String(payload.fromUserId || '') },
    };
  }
  return null;
}

function mapLegacyMessage(payload: Record<string, unknown>): AppNotificationItem {
  const preview = String(payload.preview || '').trim();
  const sender =
    (payload.senderUsername as string) ||
    (payload.senderId as string)?.slice(-6) ||
    'Someone';
  return {
    id: makeId(),
    kind: 'message',
    title: 'New message',
    body: preview ? `${sender}: ${preview}` : `Message from ${sender}`,
    createdAt: Date.now(),
    read: false,
    href: '/messages',
    meta: {
      matchId: String(payload.matchId || ''),
      senderId: String(payload.senderId || ''),
    },
  };
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [socketEpoch, setSocketEpoch] = useState(0);
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);

  useEffect(() => {
    const bump = () => setSocketEpoch((n) => n + 1);
    window.addEventListener(SOCKET_RESET_EVENT_NAME, bump);
    return () => window.removeEventListener(SOCKET_RESET_EVENT_NAME, bump);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  useEffect(() => {
    if (location.pathname === '/') {
      setNotifications([]);
    }
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem('token');  //gets token from backend 
    if (!token) return;  //return nothing for invalid token

    const socket: Socket = getSocket() ?? connectSocket();

    const push = (item: AppNotificationItem | null) => {
      if (!item) return;
      setNotifications((prev) => {
        let base = prev;
        if (item.kind === 'message' && item.meta?.matchId) {
          const mid = String(item.meta.matchId);
          base = base.filter(
            (n) =>
              !(n.id.startsWith('digest-') && String(n.meta?.matchId) === mid)
          );
        }
        if (
          (item.kind === 'like' || item.kind === 'super_like') &&
          item.meta?.fromUserId
        ) {
          const fid = String(item.meta.fromUserId);
          base = base.filter(
            (n) =>
              !(
                n.id.startsWith('like-pending-') &&
                String(n.meta?.fromUserId) === fid
              )
          );
        }
        return [item, ...base].slice(0, MAX_ITEMS);
      });
    };

    const onApp = (raw: Record<string, unknown>) => {
      push(mapAppNotification(raw));
    };

    const onLegacy = (raw: Record<string, unknown>) => {
      push(mapLegacyMessage(raw));
    };

    const onConnect = () => {
      // Optional: helps verify wiring in dev
      console.log('[Notifications] socket listening');
    };

    socket.on('connect', onConnect);
    socket.on('app_notification', onApp);
    socket.on('new_message_notification', onLegacy);

    /** REST: missed socket events while logged out (messages + pending likes). */
    let cancelled = false;
    (async () => {
      try {
        const uid = getStoredUserId();
        const emptyLikes: LikesResponse = {
          success: true,
          likes: [],
          total: 0,
        };
        const [digestRows, likesRes] = await Promise.all([
          getUnreadMessageDigest(),
          uid
            ? discoverService.getLikes(uid).catch(() => emptyLikes)
            : Promise.resolve(emptyLikes),
        ]);
        if (cancelled) return;

        const digestItems: AppNotificationItem[] = digestRows.map((row) => ({
          id: `digest-${row.messageId}`,
          kind: 'message',
          title: 'New message',
          body: row.preview?.trim()
            ? `${row.senderUsername}: ${row.preview.trim()}`
            : `Message from ${row.senderUsername}`,
          createdAt: new Date(row.createdAt).getTime(),
          read: false,
          href: '/messages',
          meta: {
            matchId: row.matchId,
            senderId: row.senderId,
            messageId: row.messageId,
          },
        }));

        const likes = likesRes.likes ?? [];
        const likeItems: AppNotificationItem[] = likes.map((like: Like) => {
          const u = like.user;
          const fromId = String(u._id);
          const isSuper = Boolean(like.isSuperLike);
          return {
            id: `like-pending-${fromId}`,
            kind: isSuper ? 'super_like' : 'like',
            title: isSuper ? 'Super like' : 'New like',
            body: isSuper
              ? `${u.username || 'Someone'} super liked you`
              : `${u.username || 'Someone'} liked you`,
            createdAt: new Date(like.likedAt).getTime(),
            read: false,
            href: '/discover',
            meta: { fromUserId: fromId },
          };
        });

        setNotifications((prev) => {
          const keep = prev.filter(
            (n) =>
              !n.id.startsWith('digest-') && !n.id.startsWith('like-pending-')
          );
          return [...likeItems, ...digestItems, ...keep].slice(0, MAX_ITEMS);
        });
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      socket.off('connect', onConnect);
      socket.off('app_notification', onApp);
      socket.off('new_message_notification', onLegacy);
    };
  }, [location.pathname, socketEpoch]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      clearAll,
    }),
    [notifications, unreadCount, markAllRead, markRead, clearAll]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
