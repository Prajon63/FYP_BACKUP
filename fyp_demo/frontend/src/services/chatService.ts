import api from './api';
import { ChatMessage } from '../types';

/**
 * Fetch chat history for a given matchId.
 * Also marks unread messages as read server-side.
 */
export const getChatHistory = async (matchId: string): Promise<ChatMessage[]> => {
  const { data } = await api.get(`/chat/${matchId}`);
  return data.messages;
};

/**
 * Fetch total unread message count for the logged-in user.
 */
export const getUnreadCount = async (): Promise<number> => {
  const { data } = await api.get('/chat/unread-count');
  return data.count;
};

