import api from './api';
import { ChatMessage, ProfilePrivacy } from '../types';

export interface UnreadDigestItem {
  matchId: string;
  senderId: string;
  senderUsername: string;
  preview: string;
  createdAt: string;
  messageId: string;
}

/**
 * Fetch chat history for a given matchId.
 * Also marks unread messages as read server-side.
 */
export interface ChatHistoryResult {
  messages: ChatMessage[];
  privacy: ProfilePrivacy | null;
}

export const getChatHistory = async (matchId: string): Promise<ChatHistoryResult> => {
  const { data } = await api.get(`/chat/${matchId}`);
  return {
    messages: data.messages ?? [],
    privacy: data.privacy ?? null
  };
};

/**
 * Fetch total unread message count for the logged-in user.
 */
export const getUnreadCount = async (): Promise<number> => {
  const { data } = await api.get('/chat/unread-count');
  return data.count;
};

/**
 * Unread message rows for notification bell (offline / missed socket).
 */
export const getUnreadMessageDigest = async (): Promise<UnreadDigestItem[]> => {
  const { data } = await api.get<{ success?: boolean; items?: UnreadDigestItem[] }>(
    '/chat/unread-digest'
  );
  return data.items ?? [];
};

