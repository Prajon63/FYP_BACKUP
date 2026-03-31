import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Bookmark,
  Ban,
  Loader2,
  UserX,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { discoverService } from '../services/discoverService';
import type { LikedByMeItem, BlockedItem } from '../types';
import { getStoredUserId } from '../utils/auth';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');`;

function EmptyState({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCta,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-400">
        {icon}
      </div>
      <h2
        className="text-2xl font-bold text-slate-900"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </h2>
      <p className="text-slate-500 mt-2">{subtitle}</p>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={onCta}
        className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-rose-300/40"
      >
        <Sparkles className="w-4 h-4" />
        {ctaLabel}
      </motion.button>
    </motion.div>
  );
}

function Row({
  image,
  name,
  bio,
  onOpenProfile,
  rightAction,
}: {
  image: string;
  name: string;
  bio?: string;
  onOpenProfile: () => void;
  rightAction: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={onOpenProfile}
        className="shrink-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        aria-label={`View ${name}'s profile`}
      >
        <img src={image} alt="" className="w-14 h-14 rounded-2xl object-cover" />
      </motion.button>
      <div className="flex-1 min-w-0">
        <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onOpenProfile} className="text-left w-full">
          <p className="font-bold text-slate-900 truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
            {name}
          </p>
        </motion.button>
        {bio && <p className="text-sm text-slate-500 truncate">{bio}</p>}
      </div>
      {rightAction}
    </div>
  );
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const userId = useMemo(() => getStoredUserId(), []);

  const [tab, setTab] = useState<'saved' | 'blocked'>('saved');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<LikedByMeItem[]>([]);
  const [blocked, setBlocked] = useState<BlockedItem[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const goProfile = (targetId: string) => {
    if (targetId === userId) navigate('/profile');
    else navigate(`/profile/${targetId}`);
  };

  const load = async () => {
    if (!userId) { navigate('/'); return; }
    try {
      setLoading(true);
      const [likedRes, blockedRes] = await Promise.all([
        discoverService.getLikedByMe(userId),
        discoverService.getBlocked(userId),
      ]);
      if (likedRes.success) setSaved(likedRes.list || []);
      if (blockedRes.success) setBlocked(blockedRes.list || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [userId]);

  const removeSaved = async (item: LikedByMeItem) => {
    try {
      setActionLoading(item.interactionId);
      await discoverService.removeInteraction(userId, item.user._id);
      setSaved(prev => prev.filter(x => x.interactionId !== item.interactionId));
      toast.success('Removed from saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove');
    } finally {
      setActionLoading(null);
    }
  };

  const unblock = async (item: BlockedItem) => {
    try {
      setActionLoading(item.interactionId);
      await discoverService.removeInteraction(userId, item.user._id);
      setBlocked(prev => prev.filter(x => x.interactionId !== item.interactionId));
      toast.success('Unblocked');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to unblock');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{FONTS}</style>
      <Toaster position="top-center" />

      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Settings
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Saved profiles & blocked users</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pb-4">
          <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm w-fit">
            <button
              type="button"
              onClick={() => setTab('saved')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'saved'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-300/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Saved ({saved.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('blocked')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'blocked'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-300/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Blocked ({blocked.length})
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
          </div>
        ) : tab === 'saved' ? (
          saved.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="w-8 h-8" />}
              title="No saved profiles"
              subtitle="Save profiles from Home or Discover to view them here."
              ctaLabel="Go to Discover"
              onCta={() => navigate('/discover')}
            />
          ) : (
            <div className="space-y-4">
              {saved.map((item) => (
                <Row
                  key={item.interactionId}
                  image={item.user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user._id}`}
                  name={item.user.username || 'Someone'}
                  bio={item.user.bio}
                  onOpenProfile={() => goProfile(item.user._id)}
                  rightAction={
                    <div className="flex items-center gap-2">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => goProfile(item.user._id)}
                        className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center"
                        title="View profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => void removeSaved(item)}
                        disabled={actionLoading === item.interactionId}
                        className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors text-xs font-bold"
                        title="Remove from saved"
                      >
                        {actionLoading === item.interactionId ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                        Remove
                      </motion.button>
                    </div>
                  }
                />
              ))}
            </div>
          )
        ) : blocked.length === 0 ? (
          <EmptyState
            icon={<Ban className="w-8 h-8" />}
            title="No blocked users"
            subtitle="Users you block will appear here. They won’t appear anywhere else in the app."
            ctaLabel="Back to Profile"
            onCta={() => navigate('/profile')}
          />
        ) : (
          <div className="space-y-4">
            {blocked.map((item) => (
              <Row
                key={item.interactionId}
                image={item.user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user._id}`}
                name={item.user.username || 'Someone'}
                bio={item.user.bio}
                onOpenProfile={() => goProfile(item.user._id)}
                rightAction={
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => void unblock(item)}
                    disabled={actionLoading === item.interactionId}
                    className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold"
                    title="Unblock"
                  >
                    {actionLoading === item.interactionId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4 text-red-500" />}
                    Unblock
                  </motion.button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

