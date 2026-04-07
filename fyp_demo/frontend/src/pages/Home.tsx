import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Compass,
  Sparkles,
  User as UserIcon,
  Loader2,
  RefreshCw,
  Calendar,
  MoreHorizontal,
  Bookmark,
  Ban,
  EyeOff,
} from 'lucide-react';
import { discoverService } from '../services/discoverService';
import type { DiscoveryUser } from '../types';
import toast from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');`;

// ── Helpers ────────────────────────────────────────────────────────────
function formatNumber(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

function getStoredUserId(): string {
  return (
    localStorage.getItem('userId') ||
    (() => {
      try { return JSON.parse(localStorage.getItem('user') || '{}')._id || ''; }
      catch { return ''; }
    })()
  );
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); }
  catch { return {}; }
}

// ── Skeleton card ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
      <div className="h-52 bg-slate-100" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-slate-100 rounded-full w-2/3" />
            <div className="h-3 bg-slate-100 rounded-full w-1/3" />
          </div>
        </div>
        <div className="h-3 bg-slate-100 rounded-full w-full" />
        <div className="h-3 bg-slate-100 rounded-full w-4/5" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="flex gap-4 pt-1">
          <div className="h-8 bg-slate-100 rounded-full w-16" />
          <div className="h-8 bg-slate-100 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

// ── Portal dropdown 
// Rendered into document.body so it is never clipped by any card's
// overflow:hidden, regardless of card size or scroll position.
function DropdownPortal({
  anchorRect,
  onAction,
  onClose,
  isSaved,
}: {
  anchorRect: DOMRect;
  onAction: (action: 'pass' | 'like' | 'block') => void;
  onClose: () => void;
  isSaved: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click (delayed so the trigger click doesn't re-close instantly)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const id = window.setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  // Close when the page scrolls so the menu doesn't drift
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('scroll', handler, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handler, true);
  }, [onClose]);

  // getBoundingClientRect() returns viewport-relative coords — correct for
  // position:fixed WITHOUT adding scrollY (that was the bug in the prev attempt).
  const top = anchorRect.bottom + 6;
  const right = window.innerWidth - anchorRect.right;

  return createPortal(
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.13 }}
      style={{ position: 'fixed', top, right, width: 200, zIndex: 99999 }}
      className="rounded-2xl border border-slate-100 bg-white shadow-2xl py-1 overflow-hidden"
    >
      <button
        type="button"
        onMouseDown={(e) => { e.stopPropagation(); onAction('pass'); }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 text-left transition-colors"
      >
        <EyeOff className="w-4 h-4 text-amber-500 shrink-0" />
        Not interested
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.stopPropagation(); onAction('like'); }}
        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
          isSaved ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-rose-50'
        }`}
      >
        <Bookmark className={`w-4 h-4 shrink-0 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-rose-400'}`} />
        {isSaved ? 'Unsave profile' : 'Save profile'}
      </button>
      <div className="my-0.5 border-t border-slate-100" />
      <button
        type="button"
        onMouseDown={(e) => { e.stopPropagation(); onAction('block'); }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left transition-colors"
      >
        <Ban className="w-4 h-4 shrink-0" />
        Block user
      </button>
    </motion.div>,
    document.body
  );
}

// ── Profile Feed Card ──────────────────────────────────────────────────
function ProfileCard({
  user,
  index,
  liked,
  onToggleLike,
  currentUserId,
  cardAction,
  onOverflowAction,
  onUndoAction,
  onDismissAction,
  isSaved,
}: {
  user: DiscoveryUser;
  index: number;
  liked: boolean;
  onToggleLike: () => void;
  currentUserId: string;
  cardAction?: 'pass' | 'block' | null;
  onOverflowAction: (action: 'pass' | 'like' | 'block') => void;
  onUndoAction: () => void;
  onDismissAction: () => void;
  isSaved: boolean;
}) {
  const navigate = useNavigate();
  // Stable random counts — won't re-roll on re-render
  const [localLikes] = useState(() => Math.floor(Math.random() * 900) + 100);
  const [localComments] = useState(() => Math.floor(Math.random() * 80) + 10);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // ── Image sources ───────────────────────────────────────────────────
  // dicebear fallback keeps avatars for profiles with no uploaded images
  const dicebear = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user._id}`;

  // Small avatar chip on banner — always profile pic (or dicebear)
  const avatarSrc = user.profilePicture || dicebear;

  // Large banner at top:
  //   coverImage → profilePicture → dicebear
  // This means if a user has a profile pic but no cover, the profile pic
  // fills the banner (which is the original behaviour before the bugs).
  const coverImage = (user as any).coverImage as string | undefined;
  const bannerSrc = coverImage || user.profilePicture || dicebear;

  // Body image (the "post" preview section):
  //   profilePicture → dicebear
  // Once real posts are available from the API, swap to post.images[0].
  const bodyImageSrc = user.profilePicture || dicebear;

  // ── Handlers ────────────────────────────────────────────────────────
  const goToProfile = () => {
    if (user._id === currentUserId) navigate('/profile');
    else navigate(`/profile/${user._id}`);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cardAction) return;
    if (menuOpen) { setMenuOpen(false); return; }
    if (menuBtnRef.current) setAnchorRect(menuBtnRef.current.getBoundingClientRect());
    setMenuOpen(true);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group"
    >
      {/* ── Banner ── */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={bannerSrc}
          alt={user.username || 'Profile'}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {user.compatibilityScore > 0 && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            {user.compatibilityScore}% match
          </div>
        )}

        {/* Author chip */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={goToProfile}
          className="absolute bottom-4 left-4 right-4 flex items-end gap-3 text-left rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <div className="shrink-0 pointer-events-none">
            <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg">
              <img
                src={avatarSrc}
                alt={user.username || ''}
                className="w-full h-full rounded-xl object-cover border-2 border-white"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0 pointer-events-none">
            <h3
              className="text-white font-bold text-lg leading-tight truncate"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {user.username}
              {user.age && (
                <span className="font-normal text-white/80 text-base ml-1">, {user.age}</span>
              )}
            </h3>
            {user.location && (
              <div className="flex items-center gap-1 text-white/70 text-xs mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{user.location}</span>
              </div>
            )}
          </div>
        </motion.button>
      </div>

      {/* ── Card body ── */}
      <div className="p-5 space-y-4">
        {cardAction && (
          <div className={`rounded-2xl border p-4 ${cardAction === 'block' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-bold ${cardAction === 'block' ? 'text-red-700' : 'text-amber-800'}`}>
                  {cardAction === 'block' ? 'Blocked' : 'Not interested'}
                </p>
                <p className={`text-xs mt-0.5 ${cardAction === 'block' ? 'text-red-600/80' : 'text-amber-700/80'}`}>
                  {cardAction === 'block'
                    ? 'This account will no longer appear anywhere.'
                    : 'You won’t see this profile in Discover or Feed.'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={onUndoAction}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Undo
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={onDismissAction}
                  className={`px-3 py-2 rounded-xl text-xs font-bold ${cardAction === 'block' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                >
                  Dismiss
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {user.bio && (
          <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">{user.bio}</p>
        )}

        {user.interests && user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {user.interests.slice(0, 4).map((tag: string) => (
              <span
                key={tag}
                className="bg-rose-50 text-rose-600 border border-rose-100 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {user.interests.length > 4 && (
              <span className="bg-slate-50 text-slate-400 border border-slate-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                +{user.interests.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Body image — profile pic (or dicebear).
            TODO: replace bodyImageSrc with post.images[0] once post data
            is included in the discover API response. */}
        <div className="relative rounded-2xl overflow-hidden">
          <img
            src={bodyImageSrc}
            alt={`${user.username || 'User'}'s photo`}
            className="w-full h-56 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Action row */}
        <div className={`flex items-center justify-between pt-1 ${cardAction ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-4">
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={() => onToggleLike()}
              className={`flex items-center gap-1.5 transition-colors ${
                liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-5 h-5 transition-all ${liked ? 'fill-rose-500 scale-110' : ''}`} />
              <span className="text-sm font-semibold">
                {formatNumber(localLikes + (liked ? 1 : 0))}
              </span>
            </motion.button>

            <button type="button" className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">{formatNumber(localComments)}</span>
            </button>

            <button type="button" className="text-slate-400 hover:text-rose-500 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* ⋯ triggers portal dropdown */}
          <motion.button
            ref={menuBtnRef}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={toggleMenu}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50"
            aria-label="More options"
            aria-expanded={menuOpen}
            disabled={!!cardAction}
          >
            <MoreHorizontal className="w-5 h-5" />
          </motion.button>
        </div>

        {user.age && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 border-t border-slate-50 pt-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>{user.age} years old</span>
            {user.location && (
              <>
                <span className="opacity-40 mx-1">·</span>
                <MapPin className="w-3.5 h-3.5" />
                <span>{user.location}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Portal dropdown — escapes overflow:hidden completely */}
      <AnimatePresence>
        {menuOpen && anchorRect && (
          <DropdownPortal
            anchorRect={anchorRect}
            isSaved={isSaved}
            onAction={(action) => {
              setMenuOpen(false);
              onOverflowAction(action);
            }}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// ─ Nav link 
function NavLink({
  icon, label, onClick, active,
}: {
  icon: React.ReactNode; label: string; onClick: () => void; active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
        active ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
      }`}
    >
      {icon}{label}
    </button>
  );
}

// ─ Main Page 
const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [feedUsers, setFeedUsers] = useState<DiscoveryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [cardActions, setCardActions] = useState<Record<string, 'pass' | 'block' | null>>({});
  const [savedProfiles, setSavedProfiles] = useState<Set<string>>(new Set());

  const userId = getStoredUserId();
  const storedUser = getStoredUser();

  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (!userId) { navigate('/'); return; }
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const response = await discoverService.getDiscoverUsers(userId, { limit: 12, sortBy: 'score' });
      if (response.success) setFeedUsers(response.users || []);
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, navigate]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const toggleLike = (id: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isMobileNow = () =>
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(max-width: 767px)').matches;

  // Rich toast shown whenever "Not interested" is triggered (all viewports)
  const showNotInterestedToast = (targetUserId: string) => {
    toast.custom((t) => (
      <div className="max-w-sm w-[92vw] rounded-2xl shadow-2xl border px-4 py-3 bg-white border-amber-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <EyeOff className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">Not interested</p>
            <p className="text-xs text-slate-500 mt-0.5">This profile won't appear in your feed.</p>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await discoverService.removeInteraction(userId, targetUserId);
                toast.success('Profile restored');
                await fetchFeed(true);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed to undo');
              }
            }}
            className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100 shrink-0"
          >
            Undo
          </motion.button>
        </div>
      </div>
    ), { position: 'bottom-center', duration: 4500 });
  };

  // Rich toast for save / unsave
  const showSaveToast = (isSave: boolean, targetUserId: string) => {
    toast.custom((t) => (
      <div className="max-w-sm w-[92vw] rounded-2xl shadow-2xl border px-4 py-3 bg-white border-rose-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <Bookmark className={`w-4 h-4 ${isSave ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">
              {isSave ? 'Profile saved' : 'Removed from saved'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSave ? 'Find it anytime in your saved profiles.' : 'Profile removed from your saved list.'}
            </p>
          </div>
          {isSave && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await discoverService.removeInteraction(userId, targetUserId);
                  setSavedProfiles(prev => { const next = new Set(prev); next.delete(targetUserId); return next; });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Failed to undo');
                }
              }}
              className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 shrink-0"
            >
              Undo
            </motion.button>
          )}
        </div>
      </div>
    ), { position: 'bottom-center', duration: 4500 });
  };

  // Block-only mobile toast (block has its own inline panel on desktop)
  const showBlockToast = (targetUserId: string) => {
    toast.custom((t) => (
      <div className="max-w-sm w-[92vw] rounded-2xl shadow-2xl border px-4 py-3 bg-white border-red-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Ban className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">User blocked</p>
            <p className="text-xs text-slate-500 mt-0.5">This account will no longer appear anywhere.</p>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await discoverService.removeInteraction(userId, targetUserId);
                toast.success('Unblocked');
                await fetchFeed(true);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed to undo');
              }
            }}
            className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100 shrink-0"
          >
            Undo
          </motion.button>
        </div>
      </div>
    ), { position: 'bottom-center', duration: 4500 });
  };

  const handleOverflowAction = async (target: DiscoveryUser, action: 'pass' | 'like' | 'block') => {
    if (!userId) { navigate('/'); return; }
    const targetId = target._id;
    if (!targetId) return;

    // ── Save / Unsave toggle ─────────────────────────────────────────────
    if (action === 'like') {
      const isCurrentlySaved = savedProfiles.has(targetId);
      try {
        if (isCurrentlySaved) {
          await discoverService.removeInteraction(userId, targetId);
          setSavedProfiles(prev => { const next = new Set(prev); next.delete(targetId); return next; });
          showSaveToast(false, targetId);
        } else {
          await discoverService.handleInteraction(userId, targetId, 'like');
          setSavedProfiles(prev => new Set([...prev, targetId]));
          showSaveToast(true, targetId);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to update saved profiles');
      }
      return;
    }

    // ── Not interested ───────────────────────────────────────────────────
    if (action === 'pass') {
      try {
        await discoverService.handleInteraction(userId, targetId, 'pass');
        if (isMobileNow()) {
          setFeedUsers(prev => prev.filter(u => u._id !== targetId));
        } else {
          setCardActions(prev => ({ ...prev, [targetId]: 'pass' }));
        }
        showNotInterestedToast(targetId);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to update');
      }
      return;
    }

    // ── Block ────────────────────────────────────────────────────────────
    try {
      await discoverService.handleInteraction(userId, targetId, 'block');
      if (isMobileNow()) {
        setFeedUsers(prev => prev.filter(u => u._id !== targetId));
        showBlockToast(targetId);
      } else {
        setCardActions(prev => ({ ...prev, [targetId]: 'block' }));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to block');
    }
  };

  const undoCardAction = async (targetUserId: string) => {
    try {
      await discoverService.removeInteraction(userId, targetUserId);
      setCardActions(prev => ({ ...prev, [targetUserId]: null }));
      toast.success('Undone');
      await fetchFeed(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to undo');
    }
  };

  const dismissCardAction = (targetUserId: string) => {
    setCardActions(prev => ({ ...prev, [targetUserId]: null }));
    setFeedUsers(prev => prev.filter(u => u._id !== targetUserId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <style>{`${FONTS} * { box-sizing: border-box; }`}</style>
        <div className="bg-white/80 backdrop-blur-lg border-b border-slate-100 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="h-7 w-24 bg-slate-100 rounded-full animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-9 w-20 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] pb-20 md:pb-16" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        ${FONTS}
        * { box-sizing: border-box; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <h1
            className="text-2xl font-bold shrink-0 cursor-pointer"
            style={{ fontFamily: "'Playfair Display', serif" }}
            onClick={() => navigate('/home')}
          >
            <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Capella</span>
          </h1>

          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-[52%] md:max-w-none">
            <NavLink icon={<Compass className="w-4 h-4" />} label="Discover"
              active={location.pathname === '/discover'} onClick={() => navigate('/discover')} />
            <NavLink icon={<Sparkles className="w-4 h-4" />} label="Matches"
              active={location.pathname === '/matches'} onClick={() => navigate('/matches')} />
            <NavLink icon={<MessageCircle className="w-4 h-4" />} label="Messages"
              active={location.pathname === '/messages'} onClick={() => navigate('/messages')} />
            <NavLink icon={<UserIcon className="w-4 h-4" />} label="Profile"
              active={location.pathname === '/profile' || location.pathname.startsWith('/profile/')}
              onClick={() => navigate('/profile')} />
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button type="button" whileTap={{ scale: 0.9 }}
              onClick={() => fetchFeed(true)} disabled={refreshing}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              title="Refresh feed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
            </motion.button>

            <NotificationBell />

            <motion.div
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/profile')}
              role="button" tabIndex={0}
              className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-br from-rose-400 to-pink-500 cursor-pointer shadow-md shadow-rose-200"
            >
              {storedUser?.profilePicture ? (
                <img src={storedUser.profilePicture} alt="Me"
                  className="w-full h-full rounded-full object-cover border-2 border-white" />
              ) : (
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-rose-400" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero greeting */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              {storedUser?.username ? `Hello, ${String(storedUser.username).split(' ')[0]} 👋` : 'Your Feed'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {feedUsers.length > 0 ? `${feedUsers.length} profiles curated for you today` : 'Discover amazing people around you'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/discover')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-lg shadow-rose-300/40"
            >
              <Compass className="w-3.5 h-3.5" /> Swipe Mode
            </motion.button>
            <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/matches')}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-2xl hover:border-rose-200 hover:text-rose-600 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" /> My Matches
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Feed */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {feedUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm p-16 text-center max-w-md mx-auto mt-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-rose-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your feed is empty
            </h3>
            <p className="text-slate-400 text-sm mb-6">No profiles to show right now. Try refreshing or adjusting your preferences.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button type="button" onClick={() => fetchFeed(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-rose-300/40 hover:from-rose-600 hover:to-pink-600 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button type="button" onClick={() => navigate('/discover')}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 font-bold px-5 py-2.5 rounded-2xl hover:border-rose-200 hover:text-rose-600 transition-colors"
              >
                <Compass className="w-4 h-4" /> Discover
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedUsers.map((user, index) => (
                <ProfileCard
                  key={user._id}
                  user={user}
                  index={index}
                  liked={likedPosts.has(user._id)}
                  onToggleLike={() => toggleLike(user._id)}
                  currentUserId={userId}
                  cardAction={cardActions[user._id] || null}
                  isSaved={savedProfiles.has(user._id)}
                  onOverflowAction={(action) => void handleOverflowAction(user, action)}
                  onUndoAction={() => void undoCardAction(user._id)}
                  onDismissAction={() => dismissCardAction(user._id)}
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-center mt-12"
            >
              <p className="text-slate-400 text-sm mb-4">Want to see more people?</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => fetchFeed(true)} disabled={refreshing}
                  className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 font-semibold text-sm px-5 py-2.5 rounded-2xl hover:border-rose-200 hover:text-rose-500 transition-colors shadow-sm"
                >
                  {refreshing ? <Loader2 className="w-4 h-4 animate-spin text-rose-400" /> : <RefreshCw className="w-4 h-4" />}
                  Refresh Feed
                </motion.button>
                <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/discover')}
                  className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-sm px-5 py-2.5 rounded-2xl shadow-lg shadow-rose-300/40 hover:from-rose-600 hover:to-pink-600 transition-all"
                >
                  <Compass className="w-4 h-4" /> Switch to Swipe Mode
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-between z-40">
        {[
          { icon: <Sparkles className="w-5 h-5" />, label: 'Feed', path: '/home' },
          { icon: <Compass className="w-5 h-5" />, label: 'Discover', path: '/discover' },
          { icon: <Heart className="w-5 h-5" />, label: 'Matches', path: '/matches' },
          { icon: <MessageCircle className="w-5 h-5" />, label: 'Messages', path: '/messages' },
          { icon: <UserIcon className="w-5 h-5" />, label: 'Profile', path: '/profile' },
        ].map(item => {
          const active =
            item.path === '/profile'
              ? location.pathname === '/profile' || location.pathname.startsWith('/profile/')
              : location.pathname === item.path;
          return (
            <button key={item.path} type="button" onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${
                active ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-rose-50' : ''}`}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Home;