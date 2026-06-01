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

export const MAX_CHAT_IMAGES = 4;

/**
 * Upload up to 4 images and send each as a chat message (multipart via multer).
 */
export const uploadChatImages = async (
  matchId: string,
  receiverId: string,
  files: File[]
): Promise<ChatMessage[]> => {
  if (!files.length) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  formData.append('receiverId', receiverId);

  const { data } = await api.post<{
    success: boolean;
    messages: ChatMessage[];
    message?: ChatMessage;
  }>(`/chat/${matchId}/image`, formData);

  return data.messages ?? (data.message ? [data.message] : []);
};

/**
 * Unsend/delete a message (own messages only).
 */
export const deleteChatMessage = async (
  matchId: string,
  messageId: string
): Promise<void> => {
  await api.delete(`/chat/${matchId}/messages/${messageId}`);
};

/**
 * Share a profile in a chat conversation (recipient must be a mutual match).
 */
export const shareProfileInChat = async (
  matchId: string,
  receiverId: string,
  sharedUserId: string
): Promise<ChatMessage> => {
  const { data } = await api.post<{ success: boolean; message: ChatMessage }>(
    `/chat/${matchId}/profile-share`,
    { receiverId, sharedUserId }
  );
  return data.message;
};

