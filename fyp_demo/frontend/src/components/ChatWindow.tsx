import React, { useState, useEffect, useRef } from 'react';
import { X, ImagePlus, Loader2, MoreVertical } from 'lucide-react';
import SafeImage from './SafeImage';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import type { ChatMessage } from '../types';
import { MAX_CHAT_IMAGES } from '../services/chatService';

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

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
  const {
    messages,
    sendMessage,
    sendImageMessages,
    unsendMessage,
    unsendingMessageId,
    isUploadingImage,
    isTyping,
    onTyping,
    onStopTyping,
    loading,
    error,
    privacy,
  } = useChat({ matchId, receiverId });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagingBlocked = privacy?.canMessage === false;
  const blockedByMe = privacy?.blockedByMe === true;
  const blockedByOther = privacy?.blockedMe === true;

  const blockBannerText =
    privacy?.message ||
    (blockedByMe
      ? 'You blocked this user. Unblock them in Settings to send messages again.'
      : blockedByOther
        ? 'This user is unavailable. You cannot send messages to them.'
        : null);

  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [unsendMenuId, setUnsendMenuId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!unsendMenuId) return;
    const closeMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-unsend-menu]')) {
        setUnsendMenuId(null);
      }
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [unsendMenuId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingImages]);

  const pendingImagesRef = useRef(pendingImages);
  pendingImagesRef.current = pendingImages;

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  const revokePending = (items: PendingImage[]) => {
    items.forEach((p) => URL.revokeObjectURL(p.previewUrl));
  };

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const removed = prev.find((p) => p.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearPendingImages = () => {
    setPendingImages((prev) => {
      revokePending(prev);
      return [];
    });
  };

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!picked.length) return;

    const valid = picked.filter((f) => f.type.startsWith('image/'));
    if (valid.length < picked.length) {
      toast.error('Only image files can be added');
    }

    setPendingImages((prev) => {
      const slotsLeft = MAX_CHAT_IMAGES - prev.length;
      if (slotsLeft <= 0) {
        toast.error(`Maximum ${MAX_CHAT_IMAGES} images at a time`);
        return prev;
      }

      if (valid.length > slotsLeft) {
        toast.error(`Only ${slotsLeft} more image${slotsLeft === 1 ? '' : 's'} can be added`);
      }

      const toAdd = valid.slice(0, slotsLeft).map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      return [...prev, ...toAdd];
    });
  };

  const handleSendPendingImages = async () => {
    if (!pendingImages.length || isUploadingImage) return;
    const files = pendingImages.map((p) => p.file);
    try {
      await sendImageMessages(files);
      clearPendingImages();
    } catch {
      /* error surfaced via useChat */
    }
  };

  const canAddMoreImages = pendingImages.length < MAX_CHAT_IMAGES;
  const slotsLeft = MAX_CHAT_IMAGES - pendingImages.length;

  const handleUnsend = async (messageId: string) => {
    setUnsendMenuId(null);
    try {
      await unsendMessage(messageId);
      toast.success('Message unsent');
    } catch {
      toast.error('Could not unsend message');
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

      {messagingBlocked && blockBannerText && (
        <div
          className={`px-4 py-3 border-b text-center ${
            blockedByMe
              ? 'bg-red-50 border-red-100'
              : 'bg-slate-50 border-slate-100'
          }`}
        >
          {blockedByMe && (
            <p className="text-sm font-semibold text-red-800">User blocked</p>
          )}
          <p
            className={`text-sm ${
              blockedByMe
                ? 'text-xs text-red-700/90 mt-0.5'
                : 'text-slate-600 leading-snug'
            }`}
          >
            {blockBannerText}
          </p>
        </div>
      )}

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
          const isUnsending = unsendingMessageId === msg._id;
          const showUnsendMenu = unsendMenuId === msg._id;

          return (
            <div
              key={msg._id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${
                isUnsending ? 'opacity-50' : ''
              }`}
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
              <div
                className="max-w-[72%] group relative"
                data-unsend-menu={showUnsendMenu ? true : undefined}
                onContextMenu={(e) => {
                  if (!isMine || messagingBlocked) return;
                  e.preventDefault();
                  setUnsendMenuId(showUnsendMenu ? null : msg._id);
                }}
              >
                {isMine && !messagingBlocked && (
                  <div
                    className={`flex justify-end mb-0.5 transition-opacity ${
                      showUnsendMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setUnsendMenuId(showUnsendMenu ? null : msg._id)
                      }
                      disabled={isUnsending}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/80 disabled:opacity-40"
                      aria-label="Message options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {showUnsendMenu && isMine && (
                  <div
                    data-unsend-menu
                    className="absolute right-0 top-6 z-20 min-w-[120px] py-1 bg-white rounded-xl shadow-lg border border-slate-100"
                  >
                    <button
                      type="button"
                      onClick={() => handleUnsend(msg._id)}
                      disabled={isUnsending}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUnsending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : null}
                      Unsend
                    </button>
                  </div>
                )}

                <div
                  className={`rounded-2xl text-sm leading-snug overflow-hidden ${
                    msg.messageType === 'image'
                      ? 'p-1'
                      : `px-3 py-2 ${
                          isMine
                            ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                        }`
                  } ${
                    msg.messageType === 'image' && isMine
                      ? 'bg-gradient-to-br from-pink-500 to-rose-500 rounded-br-sm'
                      : msg.messageType === 'image'
                        ? 'bg-white shadow-sm rounded-bl-sm'
                        : ''
                  }`}
                >
                  {msg.messageType === 'image' && msg.imageUrl ? (
                    <a
                      href={msg.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <SafeImage
                        src={msg.imageUrl}
                        fallbackSeed={msg._id}
                        alt="Shared image"
                        className="max-w-[220px] max-h-[280px] w-auto h-auto rounded-xl object-cover"
                      />
                    </a>
                  ) : (
                    msg.content
                  )}
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
      {messagingBlocked ? (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            {blockedByMe
              ? 'Messaging is disabled while this user is blocked.'
              : 'You cannot send messages in this conversation.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border-t border-gray-100">
          {pendingImages.length > 0 && (
            <div className="px-3 pt-3 pb-2 border-b border-gray-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-500">
                  {pendingImages.length} / {MAX_CHAT_IMAGES} selected
                </p>
                <button
                  type="button"
                  onClick={clearPendingImages}
                  disabled={isUploadingImage}
                  className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-40"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {pendingImages.map((item) => (
                  <div
                    key={item.id}
                    className="relative w-16 h-16 rounded-xl overflow-hidden ring-2 ring-pink-100 shrink-0"
                  >
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingImage(item.id)}
                      disabled={isUploadingImage}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center disabled:opacity-40"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {canAddMoreImages && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-pink-200 text-pink-400 flex items-center justify-center hover:bg-pink-50 disabled:opacity-40 shrink-0"
                    aria-label="Add more images"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                )}
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={handleSendPendingImages}
                disabled={isUploadingImage}
                className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  `Send ${pendingImages.length} photo${pendingImages.length === 1 ? '' : 's'}`
                )}
              </motion.button>
            </div>
          )}

          <div className="px-3 py-3 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
              disabled={isUploadingImage}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage || !canAddMoreImages}
              className="w-9 h-9 rounded-full flex items-center justify-center text-pink-500 hover:bg-pink-50 disabled:opacity-40 transition flex-shrink-0"
              aria-label={
                canAddMoreImages
                  ? `Add images (${slotsLeft} left)`
                  : 'Maximum images selected'
              }
            >
              {isUploadingImage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImagePlus className="w-5 h-5" />
              )}
            </button>
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
              disabled={!input.trim() || isUploadingImage}
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
      )}
    </div>
  );
};

export default ChatWindow;
