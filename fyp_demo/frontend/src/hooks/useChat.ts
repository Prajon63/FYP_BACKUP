import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, connectSocket } from '../services/socketService';
import { getChatHistory } from '../services/chatService';
import { ChatMessage, SendMessagePayload } from '../types';

interface UseChatOptions {
  matchId: string;
  receiverId: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  isConnected: boolean;
  isTyping: boolean;
  onTyping: () => void;
  onStopTyping: () => void;
  loading: boolean;
  error: string | null;
}

export const useChat = ({ matchId, receiverId }: UseChatOptions): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load history & join room
  useEffect(() => {
    if (!matchId) return;

    const socket = connectSocket();

    const loadHistory = async () => {
      try {
        setLoading(true);
        const history = await getChatHistory(matchId);
        setMessages(history);
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

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('error', handleError);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('error', handleError);
    };
  }, [matchId]);

  const sendMessage = useCallback(
    (content: string) => {
      const socket = getSocket();
      if (!socket || !content.trim()) return;

      const payload: SendMessagePayload = { matchId, receiverId, content: content.trim() };
      socket.emit('send_message', payload);
    },
    [matchId, receiverId]
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

  return {
    messages,
    sendMessage,
    isConnected,
    isTyping,
    onTyping,
    onStopTyping,
    loading,
    error
  };
};

