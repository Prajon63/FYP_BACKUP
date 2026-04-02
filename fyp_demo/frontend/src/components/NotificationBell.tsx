import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageCircle, Heart, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

type Props = {
  className?: string;
  buttonClassName?: string;
  variant?: 'default' | 'soft';
};

function PanelContent({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (href?: string) => void;
}) {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  const iconFor = (kind: string) => {
    if (kind === 'message') return <MessageCircle className="w-4 h-4 text-sky-500 shrink-0" />;
    if (kind === 'super_like') return <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />;
    return <Heart className="w-4 h-4 text-rose-500 shrink-0" />;
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
        <span className="text-sm font-bold text-slate-800">Notifications</span>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              onClick={() => markAllRead()}
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-500 md:hidden"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0 max-h-[min(70vh,420px)] md:max-h-80">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10 px-4">
            No notifications yet. Likes and new messages appear here.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-rose-50/50 transition-colors ${
                    !n.read ? 'bg-rose-50/30' : ''
                  }`}
                  onClick={() => {
                    markRead(n.id);
                    onNavigate(n.href);
                    onClose();
                  }}
                >
                  <div className="mt-0.5">{iconFor(n.kind)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{n.body}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default function NotificationBell({
  className = '',
  buttonClassName = '',
  variant = 'default',
}: Props) {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const baseBtn =
    variant === 'soft'
      ? 'relative w-9 h-9 flex items-center justify-center rounded-full bg-rose-50 text-rose-500'
      : 'relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500';

  const go = (href?: string) => {
    if (href) navigate(href);
  };

  return (
    <div className={`relative z-[100] ${className}`} ref={wrapRef}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.93 }}
        className={`${baseBtn} ${buttonClassName}`}
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Desktop: panel under header, not clipped */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="hidden md:flex md:flex-col absolute right-0 top-full mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden z-[100]"
          >
            <PanelContent onClose={() => setOpen(false)} onNavigate={go} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: portal + bottom sheet */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-black/25 md:hidden"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.2 }}
                className="fixed z-[120] left-3 right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] flex flex-col rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden max-h-[min(70vh,420px)] md:hidden"
              >
                <PanelContent onClose={() => setOpen(false)} onNavigate={go} />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
