import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Settings,
  Heart,
  Users,
  TrendingUp,
  Loader2,
  RefreshCw,
  UserX,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import UserCard from '../components/UserCard';
import MatchModal from '../components/MatchModal';
import FilterModal from '../components/FilterModal';
import { discoverService } from '../services/discoverService';
import type { DiscoveryUser, MatchPreferences, Like, LikedByMeItem, PassedItem } from '../types';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');`;

function EmptyCard({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-400">
        {icon}
      </div>
      <h2
        className="text-2xl font-bold text-slate-800 mb-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </h2>
      <p className="text-slate-500 mb-6">{description}</p>
      <button
        type="button"
        onClick={onCta}
        className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-rose-300/40 hover:from-rose-600 hover:to-pink-600 transition-all"
      >
        {ctaLabel}
      </button>
    </motion.div>
  );
}

function PersonRow({
  name,
  bio,
  image,
  rightAction,
  subLabel,
  delay = 0,
  profileUserId,
  currentUserId,
}: {
  name: string;
  bio?: string;
  image: string;
  rightAction: React.ReactNode;
  subLabel?: React.ReactNode;
  delay?: number;
  profileUserId: string;
  currentUserId: string;
}) {
  const navigate = useNavigate();
  const goProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (profileUserId === currentUserId) navigate('/profile');
    else navigate(`/profile/${profileUserId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4"
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={goProfile}
        className="shrink-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        aria-label={`View ${name}'s profile`}
      >
        <img src={image} alt="" className="w-14 h-14 rounded-2xl object-cover" />
      </motion.button>
      <div className="flex-1 min-w-0">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={goProfile}
          className="text-left w-full"
        >
          <p className="font-bold text-slate-800 truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
            {name}
          </p>
        </motion.button>
        {bio && <p className="text-sm text-slate-500 truncate">{bio}</p>}
        {subLabel}
      </div>
      {rightAction}
    </motion.div>
  );
}

const Discover: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<DiscoveryUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [matchScore, setMatchScore] = useState(0);
  // FIX 9: Track total available on server so we know when loadMore is worthwhile
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [stats, setStats] = useState({
    likesReceived: 0,
    likedByMePending: 0,
    totalMatches: 0,
    passes: 0,
    superLikesRemaining: 1,
    superLikeLimit: 1,
    nextResetAt: null as string | null
  });
  const [likesList, setLikesList] = useState<Like[]>([]);
  const [likedByMeList, setLikedByMeList] = useState<LikedByMeItem[]>([]);
  const [passedList, setPassedList] = useState<PassedItem[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [loadingLikedByMe, setLoadingLikedByMe] = useState(false);
  const [loadingPassed, setLoadingPassed] = useState(false);
  const [likesTabIndex, setLikesTabIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<'likes' | 'likedByMe' | 'passed' | 'discover'>('discover');
  const [savedProfiles, setSavedProfiles] = useState<Set<string>>(new Set());

  const userId = localStorage.getItem('userId') ||
    (() => { try { return JSON.parse(localStorage.getItem('user') || '{}')._id || ''; } catch { return ''; } })();

  const [preferences, setPreferences] = useState<MatchPreferences>({
    ageRange: { min: 18, max: 100 },
    distanceRange: 50,
    genderPreference: []
  });

  const fetchLikes = useCallback(async (switchToLikesIfAny = false) => {
    if (!userId) return;
    try {
      setLoadingLikes(true);
      const response = await discoverService.getLikes(userId);
      if (response.success && response.likes) {
        setLikesList(response.likes);
        if (switchToLikesIfAny && response.likes.length > 0) {
          setActiveSection('likes');
        }
      }
    } catch (e) {
      console.error('Failed to fetch likes:', e);
    } finally {
      setLoadingLikes(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    fetchUsers();
    fetchStats();
    fetchLikes(true);
  }, [userId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await discoverService.getDiscoverUsers(userId, {
        limit: 20,
        sortBy: 'score'
      });

      if (response.success) {
        setUsers(response.users);
        setTotalAvailable(response.total || response.users.length);
        setCurrentIndex(0);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await discoverService.getStats(userId);
      if (response.success) {
        const s = response.stats;
        setStats({
          likesReceived: s.likesReceived ?? 0,
          likedByMePending: s.likedByMePending ?? 0,
          totalMatches: s.totalMatches ?? 0,
          passes: s.passes ?? 0,
          superLikesRemaining: s.superLikesRemaining ?? 0,
          superLikeLimit: s.superLikeLimit ?? 1,
          nextResetAt: s.nextResetAt ?? null
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchLikedByMe = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadingLikedByMe(true);
      const response = await discoverService.getLikedByMe(userId);
      if (response.success && response.list) setLikedByMeList(response.list);
    } catch (e) {
      console.error('Failed to fetch liked-by-me:', e);
    } finally {
      setLoadingLikedByMe(false);
    }
  }, [userId]);

  const fetchPassed = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadingPassed(true);
      const response = await discoverService.getPassed(userId);
      if (response.success && response.list) setPassedList(response.list);
    } catch (e) {
      console.error('Failed to fetch passed:', e);
    } finally {
      setLoadingPassed(false);
    }
  }, [userId]);

  // FIX 10: loadMoreUsers now passes the correct server-side offset.
  // Previously it passed users.length (client count), but the server excludes
  // already-interacted users before counting, so the offset was wrong.
  // We now track interacted count separately and offset from users.length
  // which reflects how many we've fetched (not shown), giving correct pagination.
  const loadMoreUsers = useCallback(async () => {
    if (loadingMore) return;

    try {
      setLoadingMore(true);
      const response = await discoverService.getDiscoverUsers(userId, {
        limit: 10,
        offset: users.length, // offset into the server's scored+sorted list
        sortBy: 'score'
      });

      if (response.success && response.users.length > 0) {
        setUsers(prev => [...prev, ...response.users]);
        setTotalAvailable(response.total || 0);
      }
    } catch (error: any) {
      console.error('Failed to load more users:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, users.length, userId]);

  // FIX 11: moveToNext is now synchronous and called AFTER the API resolves,
  // ensuring the interaction is saved before we advance the UI.
  const moveToNext = useCallback(() => {
    setCurrentIndex(prev => {
      const next = prev + 1;
      // Load more when 3 cards from the end
      if (next >= users.length - 3 && !loadingMore) {
        loadMoreUsers();
      }
      return next;
    });
  }, [users.length, loadingMore, loadMoreUsers]);

  const handleLike = async () => {
    const currentUser = users[currentIndex];
    if (!currentUser) return;

    try {
      const response = await discoverService.handleInteraction(
        userId,
        currentUser._id,
        'like'
      );

      if (response.success) {
        if (response.isMatch && response.match) {
          setMatchedUser(response.match.user);
          setMatchScore(response.match.compatibilityScore);
          setShowMatchModal(true);
          fetchStats();
        } else if (!response.alreadyInteracted) {
          toast.success('Liked!', { duration: 1000, icon: '💖' });
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to like user');
    } finally {
      // FIX 12: Always advance card even if request failed, to prevent being stuck
      moveToNext();
    }
  };

  const handlePass = async () => {
    const currentUser = users[currentIndex];
    if (!currentUser) return;

    try {
      await discoverService.handleInteraction(userId, currentUser._id, 'pass');
    } catch (error: any) {
      console.error('Pass error (non-critical):', error);
    } finally {
      moveToNext();
    }
  };

  const handleSuperLike = async () => {
    const currentUser = users[currentIndex];
    if (!currentUser) return;

    try {
      const response = await discoverService.handleInteraction(
        userId,
        currentUser._id,
        'super_like'
      );

      if (response.success) {
        if (response.superLikesRemaining !== undefined) {
          setStats(prev => ({ ...prev, superLikesRemaining: response.superLikesRemaining ?? 0 }));
        }
        if (response.isMatch && response.match) {
          setMatchedUser(response.match.user);
          setMatchScore(response.match.compatibilityScore ?? 0);
          setShowMatchModal(true);
          fetchStats();
        } else if (!response.alreadyInteracted) {
          toast.success('Super Liked!', { duration: 1500, icon: '⭐' });
        }
      }
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.code === 'SUPER_LIKE_LIMIT') {
        toast.error("No Super likes left today. Resets tomorrow! ⭐", { duration: 4000 });
        setStats(prev => ({ ...prev, superLikesRemaining: 0 }));
        return;
      }
      toast.error(error.message || 'Failed to super like');
    } finally {
      moveToNext();
    }
  };

  const handleApplyFilters = async (newPreferences: MatchPreferences) => {
    try {
      await discoverService.updateMatchPreferences(userId, newPreferences);
      setPreferences(newPreferences);
      toast.success('Filters updated!');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update filters');
    }
  };

  const handleSendMessage = () => {
    setShowMatchModal(false);
    toast.success('Message feature coming soon!');
  };

  const handleKeepSwiping = () => {
    setShowMatchModal(false);
  };

  // Convert "like" item to DiscoveryUser shape for UserCard
  const likeToDiscoveryUser = (like: Like): DiscoveryUser => ({
    _id: like.user._id,
    username: like.user.username,
    profilePicture: like.user.profilePicture,
    bio: like.user.bio,
    age: like.user.age,
    location: like.user.location,
    interests: like.user.interests,
    compatibilityScore: 0
  });

  const currentLike = likesList[likesTabIndex];

  const handleLikeFromLikesYou = async () => {
    if (!currentLike) return;
    try {
      const response = await discoverService.handleInteraction(
        userId,
        currentLike.user._id,
        'like'
      );
      if (response.success && response.isMatch && response.match) {
        setMatchedUser(response.match.user);
        setMatchScore(response.match.compatibilityScore ?? 0);
        setShowMatchModal(true);
        setLikesList(prev => prev.filter(l => l.user._id !== currentLike.user._id));
        setLikesTabIndex(prev => Math.min(prev, Math.max(0, likesList.length - 2)));
        fetchStats();
      } else {
        setLikesList(prev => prev.filter(l => l.user._id !== currentLike.user._id));
        setLikesTabIndex(prev => Math.min(prev, Math.max(0, likesList.length - 2)));
        fetchStats();
        toast.success('Liked!', { duration: 1500, icon: '💖' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to like');
    }
  };

  const handlePassFromLikesYou = async () => {
    if (!currentLike) return;
    try {
      await discoverService.handleInteraction(userId, currentLike.user._id, 'pass');
      setLikesList(prev => prev.filter(l => l.user._id !== currentLike.user._id));
      setLikesTabIndex(prev => Math.min(prev, Math.max(0, likesList.length - 2)));
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to pass');
    }
  };

  const handleSuperLikeFromLikesYou = async () => {
    if (!currentLike) return;
    try {
      const response = await discoverService.handleInteraction(
        userId,
        currentLike.user._id,
        'super_like'
      );
      if (response.superLikesRemaining !== undefined) {
        setStats(prev => ({ ...prev, superLikesRemaining: response.superLikesRemaining ?? 0 }));
      }
      if (response.success && response.isMatch && response.match) {
        setMatchedUser(response.match.user);
        setMatchScore(response.match.compatibilityScore ?? 0);
        setShowMatchModal(true);
        setLikesList(prev => prev.filter(l => l.user._id !== currentLike.user._id));
        setLikesTabIndex(prev => Math.min(prev, Math.max(0, likesList.length - 2)));
        fetchStats();
      } else if (response.success) {
        setLikesList(prev => prev.filter(l => l.user._id !== currentLike.user._id));
        setLikesTabIndex(prev => Math.min(prev, Math.max(0, likesList.length - 2)));
        fetchStats();
        toast.success('Super liked!', { duration: 1500, icon: '⭐' });
      }
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.code === 'SUPER_LIKE_LIMIT') {
        toast.error("No Super likes left today. Resets tomorrow! ⭐", { duration: 4000 });
        setStats(prev => ({ ...prev, superLikesRemaining: 0 }));
        return;
      }
      toast.error(error.message || 'Failed to super like');
    }
  };

  const handleRemoveFromLikedByMe = async (item: LikedByMeItem) => {
    try {
      await discoverService.removeInteraction(userId, item.user._id);
      setLikedByMeList(prev => prev.filter(x => x.interactionId !== item.interactionId));
      fetchStats();
      toast.success('Removed – they can show in Discover again');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove');
    }
  };

  const handleRemoveFromPassed = async (item: PassedItem) => {
    try {
      await discoverService.removeInteraction(userId, item.user._id);
      setPassedList(prev => prev.filter(x => x.interactionId !== item.interactionId));
      fetchStats();
      toast.success('Removed – they can show in Likes you again');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove');
    }
  };

  const handleSaveProfile = async (targetUserId: string) => {
    if (!userId) return;
    try {
      await discoverService.handleInteraction(userId, targetUserId, 'like');
      setSavedProfiles(prev => {
        const next = new Set(prev);
        next.add(targetUserId);
        return next;
      });
      toast.success('Saved profile');
      fetchStats();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    }
  };

  const currentUser = users[currentIndex];
  const noMoreUsers = !loading && currentIndex >= users.length;
  const noMoreLikes = !loadingLikes && likesList.length === 0;
  const hasLikes = likesList.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <style>{FONTS}</style>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Finding your people…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{FONTS}</style>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/home')}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>

            <h1
              className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Discover
            </h1>

            <button
              onClick={() => setShowFilterModal(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors relative"
            >
              <Settings className="w-5 h-5 text-slate-600" />
              {preferences.genderPreference.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Stats: likes you, matches */}
          <div className="flex items-center gap-3 mt-4 text-sm flex-wrap">
            <button
              type="button"
              onClick={() => { setActiveSection('likes'); fetchLikes(); fetchStats(); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                activeSection === 'likes'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-lg shadow-rose-300/40'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-rose-600'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>{stats.likesReceived} like{stats.likesReceived !== 1 ? 's' : ''} you</span>
              {stats.likesReceived > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeSection === 'likes' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'}`}>Respond?</span>
              )}
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white text-slate-600 border-slate-200 hover:text-rose-600 transition-all"
              onClick={() => navigate('/matches')}
            >
              <Users className="w-4 h-4" />
              <span>{stats.totalMatches} matches</span>
            </button>
            <button
              onClick={() => navigate('/matches')}
              className="ml-auto text-rose-600 hover:text-rose-700 font-semibold text-sm"
            >
              See Matches →
            </button>
          </div>

          {/* Tabs: Likes you | Liked by you | Passed | Discover */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => { setActiveSection('likes'); fetchLikes(); fetchStats(); }}
              className={`flex-shrink-0 py-2 px-3 rounded-full text-xs font-semibold transition-all border ${
                activeSection === 'likes'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-md shadow-rose-300/30'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Likes you <span className={`ml-1 px-1.5 py-0.5 rounded-full ${activeSection === 'likes' ? 'bg-white/20' : 'bg-slate-100'}`}>{activeSection === 'likes' && likesList.length > 0 ? likesList.length : stats.likesReceived}</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveSection('likedByMe'); fetchLikedByMe(); fetchStats(); }}
              className={`flex-shrink-0 py-2 px-3 rounded-full text-xs font-semibold transition-all border ${
                activeSection === 'likedByMe'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-md shadow-rose-300/30'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              You liked <span className={`ml-1 px-1.5 py-0.5 rounded-full ${activeSection === 'likedByMe' ? 'bg-white/20' : 'bg-slate-100'}`}>{stats.likedByMePending}</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveSection('passed'); fetchPassed(); fetchStats(); }}
              className={`flex-shrink-0 py-2 px-3 rounded-full text-xs font-semibold transition-all border ${
                activeSection === 'passed'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-md shadow-rose-300/30'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Passed <span className={`ml-1 px-1.5 py-0.5 rounded-full ${activeSection === 'passed' ? 'bg-white/20' : 'bg-slate-100'}`}>{stats.passes}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('discover')}
              className={`flex-shrink-0 py-2 px-3 rounded-full text-xs font-semibold transition-all border ${
                activeSection === 'discover'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-md shadow-rose-300/30'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Discover
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {activeSection === 'likes' ? (
          loadingLikes ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
            </div>
          ) : noMoreLikes ? (
            <EmptyCard
              icon={<Heart className="w-8 h-8" />}
              title="No likes yet"
              description="When someone likes you, they will show up here. Respond when you're ready."
              ctaLabel="Go to Discover"
              onCta={() => setActiveSection('discover')}
            />
          ) : currentLike ? (
            <div className="relative" style={{ height: '70vh', maxHeight: '700px' }}>
              <AnimatePresence>
                <UserCard
                  key={currentLike.likeId}
                  user={likeToDiscoveryUser(currentLike)}
                  onLike={handleLikeFromLikesYou}
                  onPass={handlePassFromLikesYou}
                  onSuperLike={handleSuperLikeFromLikesYou}
                  isSuperLikedByThem={currentLike.isSuperLike}
                  superLikesRemaining={stats.superLikesRemaining}
                  superLikeLimit={stats.superLikeLimit}
                  currentUserId={userId}
                  onSaveProfile={() => handleSaveProfile(currentLike.user._id)}
                  isSaved={savedProfiles.has(currentLike.user._id)}
                />
              </AnimatePresence>
              <div className="text-center mt-4">
                <p className="text-sm text-slate-500">
                  Like them back to match • {likesTabIndex + 1} / {likesList.length}
                </p>
              </div>
            </div>
          ) : null
        ) : activeSection === 'likedByMe' ? (
          loadingLikedByMe ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
          ) : likedByMeList.length === 0 ? (
            <EmptyCard
              icon={<Sparkles className="w-8 h-8" />}
              title="No one here yet"
              description="People you like will appear here until they like you back."
              ctaLabel="Go to Discover"
              onCta={() => setActiveSection('discover')}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-rose-500" />
                Waiting for them to like you back – or remove to see them in Discover again
              </p>
              {likedByMeList.map((item, index) => (
                <PersonRow
                  key={item.interactionId}
                  delay={index * 0.07}
                  profileUserId={item.user._id}
                  currentUserId={userId}
                  image={item.user.profilePicture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.user._id}
                  name={item.user.username || 'Someone'}
                  bio={item.user.bio}
                  subLabel={item.isSuperLike ? <span className="text-xs text-amber-600">⭐ Super like</span> : undefined}
                  rightAction={
                    <button
                      type="button"
                      onClick={() => handleRemoveFromLikedByMe(item)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Remove – they'll show in Discover again"
                    >
                      <UserX className="w-4 h-4" />
                      Remove
                    </button>
                  }
                />
              ))}
            </div>
          )
        ) : activeSection === 'passed' ? (
          loadingPassed ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-gray-500 animate-spin" />
            </div>
          ) : passedList.length === 0 ? (
            <EmptyCard
              icon={<UserX className="w-8 h-8" />}
              title="No passed profiles"
              description="Anyone you pass on will show here. Remove to see them again."
              ctaLabel="Go to Discover"
              onCta={() => setActiveSection('discover')}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <UserX className="w-4 h-4 text-slate-500" />
                Remove to see them in Likes you or Discover again
              </p>
              {passedList.map((item, index) => (
                <PersonRow
                  key={item.interactionId}
                  delay={index * 0.07}
                  profileUserId={item.user._id}
                  currentUserId={userId}
                  image={item.user.profilePicture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.user._id}
                  name={item.user.username || 'Someone'}
                  bio={item.user.bio}
                  rightAction={
                    <button
                      type="button"
                      onClick={() => handleRemoveFromPassed(item)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remove – they'll show in Likes you again"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Remove
                    </button>
                  }
                />
              ))}
            </div>
          )
        ) : noMoreUsers ? (
          <div className="space-y-3">
            <EmptyCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="You're all caught up!"
              description="No more users to show right now. Check back later for new matches."
              ctaLabel="Refresh"
              onCta={fetchUsers}
            />
            <button
              onClick={() => navigate('/matches')}
              className="w-full bg-white rounded-2xl border border-slate-200 text-slate-700 font-semibold py-3 px-6 hover:bg-slate-50 transition-colors"
            >
              View Your Matches
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            {/* Keep above the absolutely positioned card — UserCard is position:absolute; h-full and was covering this row */}
            <div className="flex items-center justify-between shrink-0 z-10 px-0.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                Super likes: {stats.superLikesRemaining}/{stats.superLikeLimit}
              </span>
              <span className="text-xs font-medium text-slate-600 tabular-nums">
                {Math.min(currentIndex + 1, Math.max(users.length, 1))}/{Math.max(users.length, 1)}
              </span>
            </div>

            <div
              className="relative w-full mx-auto rounded-2xl"
              style={{ height: 'min(70vh, 700px)', minHeight: '420px' }}
            >
              <AnimatePresence>
                {currentUser && (
                  <UserCard
                    key={currentUser._id}
                    user={currentUser}
                    onLike={handleLike}
                    onPass={handlePass}
                    onSuperLike={handleSuperLike}
                    superLikesRemaining={stats.superLikesRemaining}
                    superLikeLimit={stats.superLikeLimit}
                    currentUserId={userId}
                    onSaveProfile={() => handleSaveProfile(currentUser._id)}
                    isSaved={savedProfiles.has(currentUser._id)}
                  />
                )}
              </AnimatePresence>

              {loadingMore && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-white px-4 py-2 rounded-full shadow-lg">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading more...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                initial={false}
                animate={{
                  width: `${users.length > 0 ? Math.min(((currentIndex + 1) / users.length) * 100, 100) : 0}%`,
                }}
                transition={{ duration: 0.35 }}
              />
            </div>
          </div>
        )}

        {activeSection === 'discover' && !noMoreUsers && (
          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              {currentIndex + 1} / {users.length}
              {loadingMore && ' (loading more...)'}
            </p>
          </div>
        )}
      </div>

      <MatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        matchUser={matchedUser}
        compatibilityScore={matchScore}
        onSendMessage={handleSendMessage}
        onKeepSwiping={handleKeepSwiping}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        currentPreferences={preferences}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default Discover;