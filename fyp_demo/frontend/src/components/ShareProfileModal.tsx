import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import SafeImage from './SafeImage';
import type { Match } from '../types';

interface ShareProfileModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  matches: Match[];
  loading?: boolean;
  sendingId?: string | null;
  excludeUserId?: string;
  onSelect: (match: Match) => void;
}

const ShareProfileModal = ({
  open,
  onClose,
  title,
  subtitle,
  matches,
  loading = false,
  sendingId = null,
  excludeUserId,
  onSelect,
}: ShareProfileModalProps) => {
  const list = excludeUserId
    ? matches.filter((m) => m.user?._id !== excludeUserId)
    : matches;

  const available = list.filter((m) => m.privacy?.canMessage !== false);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed left-0 right-0 bottom-0 z-[61] bg-white rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                </div>
              ) : available.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-12 px-4">
                  No conversations available. Share profiles only with mutual matches
                  you can message.
                </p>
              ) : (
                <ul className="space-y-1">
                  {available.map((m) => {
                    const isSending = sendingId === m.matchId;
                    return (
                      <li key={m.matchId}>
                        <button
                          type="button"
                          disabled={!!sendingId}
                          onClick={() => onSelect(m)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-rose-50 transition-colors disabled:opacity-60 text-left"
                        >
                          <SafeImage
                            src={m.user?.profilePicture}
                            fallbackSeed={m.user?._id || 'user'}
                            alt={m.user?.username || 'Match'}
                            className="w-11 h-11 rounded-full object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {m.user?.username || 'Match'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {m.lastMessageAt
                                ? 'Active conversation'
                                : 'Mutual match'}
                            </p>
                          </div>
                          {isSending && (
                            <Loader2 className="w-4 h-4 animate-spin text-pink-500 shrink-0" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareProfileModal;
