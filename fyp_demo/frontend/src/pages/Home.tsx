import React, { useState, useEffect, useRef } from 'react';
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
  Bell,
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

// ── Profile Feed Card ──────────────────────────────────────────────────
function ProfileCard({
  user,
  index,
  liked,
  onToggleLike,
  currentUserId,
}: {
  user: DiscoveryUser;
  index: number;
  liked: boolean;
  onToggleLike: () => void;
  currentUserId: string;
}) {
  const navigate = useNavigate();
  const [localLikes, setLocalLikes] = useState(Math.floor(Math.random() * 900) + 100);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayPicture =
    user.profilePicture ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user._id}`;

  const handleLike = () => {
    setLocalLikes(prev => (liked ? prev - 1 : prev + 1));
    onToggleLike();
  };

  const goToProfile = () => {
    if (user._id === currentUserId) navigate('/profile');
    else navigate(`/profile/${user._id}`);
  };

  const handleMenuAction = async (action: 'pass' | 'like' | 'block') => {
    setMenuOpen(false);
    if (!currentUserId || !user._id) {
      toast.error('Please log in');
      return;
    }
    try {
      await discoverService.handleInteraction(currentUserId, user._id, action);
      if (action === 'pass') toast.success('Marked as not interested');
      if (action === 'like') toast.success('Profile saved');
      if (action === 'block') toast.success('User blocked');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const close = (ev: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(ev.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group"
    >
      {/* Cover / banner area */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={displayPicture}
          alt={user.username || 'Profile'}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {user.compatibilityScore > 0 && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            {user.compatibilityScore}% match
          </div>
        )}

        {/* Clickable author: avatar + name */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={goToProfile}
          className="absolute bottom-4 left-4 right-4 flex items-end gap-3 text-left rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <div className="relative shrink-0 pointer-events-none">
            <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg">
              <img
                src={displayPicture}
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

      <div className="p-5 space-y-4">
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

        <div className="relative rounded-2xl overflow-hidden">
          <img
            src={displayPicture}
            alt={`${user.username || 'User'}'s photo`}
            className="w-full h-56 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4">
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors ${
                liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-all ${liked ? 'fill-rose-500 scale-110' : ''}`}
              />
              <span className="text-sm font-semibold">{formatNumber(localLikes)}</span>
            </motion.button>

            <button type="button" className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">
                {formatNumber(Math.floor(Math.random() * 80) + 10)}
              </span>
            </button>

            <button type="button" className="text-slate-400 hover:text-rose-500 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <div className="relative" ref={menuRef}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setMenuOpen(o => !o)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50"
              aria-label="More options"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="w-5 h-5" />
            </motion.button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-2xl border border-slate-100 bg-white shadow-xl py-1 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => void handleMenuAction('pass')}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left"
                  >
                    <EyeOff className="w-4 h-4 text-slate-500" />
                    Not interested
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleMenuAction('like')}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left"
                  >
                    <Bookmark className="w-4 h-4 text-rose-500" />
                    Save profile
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleMenuAction('block')}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left"
                  >
                    <Ban className="w-4 h-4" />
                    Block
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
    </motion.article>
  );
}

// ── Nav link ───────────────────────────────────────────────────────────
function NavLink({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-rose-50 text-rose-600'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [feedUsers, setFeedUsers] = useState<DiscoveryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const userId = getStoredUserId();
  const storedUser = getStoredUser();

  const fetchFeed = async (isRefresh = false) => {
    if (!userId) {
      navigate('/');
      return;
    }
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const response = await discoverService.getDiscoverUsers(userId, {
        limit: 12,
        sortBy: 'score',
      });
      if (response.success) {
        setFeedUsers(response.users || []);
      }
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [userId]);

  const toggleLike = (id: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <style>{`${FONTS} * { box-sizing: border-box; }`}</style>
        <div className="bg-white/80 backdrop-blur-lg border-b border-slate-100 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="h-7 w-24 bg-slate-100 rounded-full animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-9 w-20 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonCard key={i} />
          ))}
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

      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <h1
            className="text-2xl font-bold shrink-0 cursor-pointer"
            style={{ fontFamily: "'Playfair Display', serif" }}
            onClick={() => navigate('/home')}
          >
            <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              Capella
            </span>
          </h1>

          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-[52%] md:max-w-none">
            <NavLink
              icon={<Compass className="w-4 h-4" />}
              label="Discover"
              active={location.pathname === '/discover'}
              onClick={() => navigate('/discover')}
            />
            <NavLink
              icon={<Sparkles className="w-4 h-4" />}
              label="Matches"
              active={location.pathname === '/matches'}
              onClick={() => navigate('/matches')}
            />
            <NavLink
              icon={<MessageCircle className="w-4 h-4" />}
              label="Messages"
              active={location.pathname === '/messages'}
              onClick={() => navigate('/messages')}
            />
            <NavLink
              icon={<UserIcon className="w-4 h-4" />}
              label="Profile"
              active={location.pathname === '/profile' || location.pathname.startsWith('/profile/')}
              onClick={() => navigate('/profile')}
            />
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => fetchFeed(true)}
              disabled={refreshing}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              title="Refresh feed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
            </motion.button>

            <button
              type="button"
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
            </button>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/profile')}
              role="button"
              tabIndex={0}
              className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-br from-rose-400 to-pink-500 cursor-pointer shadow-md shadow-rose-200"
            >
              {storedUser?.profilePicture ? (
                <img
                  src={storedUser.profilePicture}
                  alt="Me"
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-rose-400" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-8 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h2
              className="text-3xl font-bold text-slate-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {storedUser?.username ? `Hello, ${String(storedUser.username).split(' ')[0]} 👋` : 'Your Feed'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {feedUsers.length > 0
                ? `${feedUsers.length} profiles curated for you today`
                : 'Discover amazing people around you'}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/discover')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-lg shadow-rose-300/40"
            >
              <Compass className="w-3.5 h-3.5" />
              Swipe Mode
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/matches')}
              className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-2xl hover:border-rose-200 hover:text-rose-600 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              My Matches
            </motion.button>
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {feedUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm p-16 text-center max-w-md mx-auto mt-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-rose-300" />
            </div>
            <h3
              className="text-xl font-bold text-slate-700 mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Your feed is empty
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              No profiles to show right now. Try refreshing or adjusting your preferences.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => fetchFeed(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-rose-300/40 hover:from-rose-600 hover:to-pink-600 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => navigate('/discover')}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 font-bold px-5 py-2.5 rounded-2xl hover:border-rose-200 hover:text-rose-600 transition-colors"
              >
                <Compass className="w-4 h-4" />
                Discover
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
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-12"
            >
              <p className="text-slate-400 text-sm mb-4">Want to see more people?</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fetchFeed(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 font-semibold text-sm px-5 py-2.5 rounded-2xl hover:border-rose-200 hover:text-rose-500 transition-colors shadow-sm"
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh Feed
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/discover')}
                  className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-sm px-5 py-2.5 rounded-2xl shadow-lg shadow-rose-300/40 hover:from-rose-600 hover:to-pink-600 transition-all"
                >
                  <Compass className="w-4 h-4" />
                  Switch to Swipe Mode
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-between z-40">
        {[
          { icon: <Sparkles className="w-5 h-5" />, label: 'Feed', path: '/home' },
          { icon: <Compass className="w-5 h-5" />, label: 'Discover', path: '/discover' },
          { icon: <MessageCircle className="w-5 h-5" />, label: 'Messages', path: '/messages' },
          { icon: <UserIcon className="w-5 h-5" />, label: 'Profile', path: '/profile' },
        ].map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${
                active ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-rose-50' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Home;
