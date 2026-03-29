import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import type { ChatMessage } from '../types';

interface ChatWindowProps {
  matchId: string;
  receiverId: string;
  receiverName: string;
  receiverPhoto?: string;
  onClose: () => void;
}

const ChatWindow = ({
  matchId,
  receiverId,
  receiverName,
  receiverPhoto,
  onClose
}: ChatWindowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, sendMessage, isTyping, onTyping, onStopTyping, loading, error } =
    useChat({ matchId, receiverId });

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const goToProfile = () => {
    if (!receiverId) return;
    if (receiverId === user?._id) navigate('/profile');
    else navigate(`/profile/${receiverId}`);
  };

  return (
    <div className="flex flex-col h-full max-h-screen bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={goToProfile}
          className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <div className="w-9 h-9 rounded-full bg-white/30 overflow-hidden flex-shrink-0">
            {receiverPhoto ? (
              <img src={receiverPhoto} alt={receiverName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">
                {receiverName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-none truncate">{receiverName}</p>
            {isTyping && (
              <p className="text-xs text-white/80 mt-0.5 animate-pulse">typing…</p>
            )}
          </div>
        </motion.button>
        <button
          onClick={onClose}
          className="ml-auto p-1.5 hover:bg-white/20 rounded-full transition"
          aria-label="Close chat"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-red-500 py-4">{error}</div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">
            No messages yet. Say hi!
          </div>
        )}

        {messages.map((msg: ChatMessage) => {
          const isMine = msg.sender._id === user?._id;
          const initial = msg.sender.username?.charAt(0) ?? receiverName.charAt(0);

          return (
            <div
              key={msg._id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              {!isMine && (
                <div className="w-7 h-7 rounded-full bg-gray-300 overflow-hidden flex-shrink-0 mr-2 self-end">
                  {msg.sender.profilePicture ? (
                    <img
                      src={msg.sender.profilePicture}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-600">
                      {initial}
                    </div>
                  )}
                </div>
              )}
              <div className="max-w-[72%] group">
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
                    isMine
                      ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <p
                  className={`text-[10px] text-gray-400 mt-0.5 ${
                    isMine ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatTime(msg.createdAt)}
                  {isMine && <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 bg-white border-t border-gray-100 flex items-center gap-2">
        <input
          type="text"
          name="chat-message"
          id="chat-message-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onTyping();
          }}
          onBlur={onStopTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          maxLength={1000}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 transition"
          autoComplete="off"
        />
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition flex-shrink-0"
          aria-label="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
};

export default ChatWindow;
