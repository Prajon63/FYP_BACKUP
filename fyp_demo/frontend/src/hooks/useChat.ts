import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, connectSocket } from '../services/socketService';
import {
  getChatHistory,
  uploadChatImages,
  deleteChatMessage as deleteChatMessageApi,
  MAX_CHAT_IMAGES,
} from '../services/chatService';
import { ChatMessage, ProfilePrivacy, SendMessagePayload, MessageDeletedPayload } from '../types';

interface UseChatOptions {
  matchId: string;
  receiverId: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  sendImageMessages: (files: File[]) => Promise<void>;
  unsendMessage: (messageId: string) => Promise<void>;
  unsendingMessageId: string | null;
  maxChatImages: number;
  isUploadingImage: boolean;
  isConnected: boolean;
  isTyping: boolean;
  onTyping: () => void;
  onStopTyping: () => void;
  loading: boolean;
  error: string | null;
  privacy: ProfilePrivacy | null;
}

export const useChat = ({ matchId, receiverId }: UseChatOptions): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<ProfilePrivacy | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [unsendingMessageId, setUnsendingMessageId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load history & join room
  useEffect(() => {
    if (!matchId) return;

    const socket = getSocket() ?? connectSocket();

    const loadHistory = async () => {
      try {
        setLoading(true);
        const { messages: history, privacy: chatPrivacy } = await getChatHistory(matchId);
        setMessages(history);
        setPrivacy(chatPrivacy);
      } catch (err) {
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();

    const joinRoom = () => {
      socket.emit('join_chat', { matchId });
      setIsConnected(true);
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }

    const handleReceiveMessage = (message: ChatMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const handleUserTyping = () => setIsTyping(true);
    const handleUserStoppedTyping = () => setIsTyping(false);

    const handleError = ({ message }: { message: string }) => {
      setError(message);
    };

    const handleMessagesRead = ({ matchId: readMatchId }: { matchId: string }) => {
      if (readMatchId !== matchId) return;
      setMessages(prev => prev.map(m => ({ ...m, read: true })));
    };

    const handleMessageDeleted = ({ messageId, matchId: deletedMatchId }: MessageDeletedPayload) => {
      if (deletedMatchId !== matchId) return;
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('error', handleError);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('error', handleError);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [matchId]);

  const sendMessage = useCallback(
    (content: string) => {
      const socket = getSocket();
      if (!socket || !content.trim()) return;
      if (privacy && privacy.canMessage === false) return;

      const payload: SendMessagePayload = { matchId, receiverId, content: content.trim() };
      socket.emit('send_message', payload);
    },
    [matchId, receiverId, privacy]
  );

  const sendImageMessages = useCallback(
    async (files: File[]) => {
      if (privacy && privacy.canMessage === false) return;
      if (!files.length) return;

      const invalid = files.find((f) => !f.type.startsWith('image/'));
      if (invalid) {
        setError('Please choose image files only');
        return;
      }
      const tooLarge = files.find((f) => f.size > 5 * 1024 * 1024);
      if (tooLarge) {
        setError('Each image must be 5MB or smaller');
        return;
      }
      if (files.length > MAX_CHAT_IMAGES) {
        setError(`You can send up to ${MAX_CHAT_IMAGES} images at a time`);
        return;
      }

      try {
        setIsUploadingImage(true);
        setError(null);
        const sent = await uploadChatImages(matchId, receiverId, files);
        setMessages((prev) => {
          const next = [...prev];
          for (const message of sent) {
            if (!next.find((m) => m._id === message._id)) {
              next.push(message);
            }
          }
          return next;
        });
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to send images';
        setError(msg);
        throw err;
      } finally {
        setIsUploadingImage(false);
      }
    },
    [matchId, receiverId, privacy]
  );

  const onTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing', { matchId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { matchId });
    }, 2000);
  }, [matchId]);

  const onStopTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', { matchId });
  }, [matchId]);

  const unsendMessage = useCallback(
    async (messageId: string) => {
      try {
        setUnsendingMessageId(messageId);
        setError(null);
        await deleteChatMessageApi(matchId, messageId);
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to unsend message';
        setError(msg);
        throw err;
      } finally {
        setUnsendingMessageId(null);
      }
    },
    [matchId]
  );

  return {
    messages,
    sendMessage,
    sendImageMessages,
    unsendMessage,
    unsendingMessageId,
    maxChatImages: MAX_CHAT_IMAGES,
    isUploadingImage,
    isConnected,
    isTyping,
    onTyping,
    onStopTyping,
    loading,
    error,
    privacy
  };
};

