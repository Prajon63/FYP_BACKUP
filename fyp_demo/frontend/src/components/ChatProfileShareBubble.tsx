import React from 'react';
import { ChevronRight, User } from 'lucide-react';
import SafeImage from './SafeImage';
import type { ChatMessage } from '../types';

function sharedProfileUserId(msg: ChatMessage): string | null {
  const raw = msg.sharedProfile?.userId;
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && '_id' in raw) {
    return String((raw as { _id: string })._id);
  }
  return String(raw);
}

interface ChatProfileShareBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  onOpenProfile: (userId: string) => void;
}

const ChatProfileShareBubble = ({
  message,
  isMine,
  onOpenProfile,
}: ChatProfileShareBubbleProps) => {
  const profileId = sharedProfileUserId(message);
  const username = message.sharedProfile?.username || 'Profile';
  const photo = message.sharedProfile?.profilePicture;

  if (!profileId) return null;

  return (
    <button
      type="button"
      onClick={() => onOpenProfile(profileId)}
      className={`w-full max-w-[240px] text-left rounded-2xl overflow-hidden border transition hover:opacity-95 ${
        isMine
          ? 'bg-white/95 border-white/40 shadow-sm'
          : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      <div className="px-3 py-2 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100/80">
        <p
          className={`text-[10px] font-semibold uppercase tracking-wide ${
            isMine ? 'text-rose-600' : 'text-rose-500'
          }`}
        >
          Shared profile
        </p>
      </div>
      <div className="flex items-center gap-3 p-3">
        <SafeImage
          src={photo}
          fallbackSeed={profileId}
          alt={username}
          className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-rose-100"
        />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isMine ? 'text-slate-900' : 'text-slate-800'}`}>
            {username}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-0.5">
            <User className="w-3 h-3" />
            View profile
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
      </div>
    </button>
  );
};

export default ChatProfileShareBubble;
