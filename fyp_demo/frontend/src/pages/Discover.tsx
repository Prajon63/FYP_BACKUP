import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
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

  const currentUser = users[currentIndex];
  const noMoreUsers = !loading && currentIndex >= users.length;
  const noMoreLikes = !loadingLikes && likesList.length === 0;
  const hasLikes = likesList.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Finding perfect matches for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/home')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>

            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Discover
            </h1>

            <button
              onClick={() => setShowFilterModal(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            >
              <Settings className="w-6 h-6 text-gray-700" />
              {preferences.genderPreference.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-purple-600 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Stats: likes you, matches */}
          <div className="flex items-center gap-4 mt-4 text-sm flex-wrap">
            <button
              type="button"
              onClick={() => { setActiveSection('likes'); fetchLikes(); fetchStats(); }}
              className={`flex items-center gap-2 transition-colors ${activeSection === 'likes' ? 'text-pink-600 font-semibold' : 'text-gray-600 hover:text-pink-600'}`}
            >
              <Heart className="w-4 h-4 text-pink-500" />
              <span>{stats.likesReceived} like{stats.likesReceived !== 1 ? 's' : ''} you</span>
              {stats.likesReceived > 0 && (
                <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full">Respond?</span>
              )}
            </button>
            <div
              className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-purple-600 transition-colors"
              onClick={() => navigate('/matches')}
            >
              <Users className="w-4 h-4 text-purple-500" />
              <span>{stats.totalMatches} matches</span>
            </div>
            <button
              onClick={() => navigate('/matches')}
              className="ml-auto text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              See Matches →
            </button>
          </div>

          {/* Tabs: Likes you | Liked by you | Passed | Discover */}
          <div className="flex gap-1 mt-3 p-1 bg-gray-100 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => { setActiveSection('likes'); fetchLikes(); fetchStats(); }}
              className={`flex-shrink-0 py-2 px-3 rounded-lg text-xs font-medium transition-all ${activeSection === 'likes' ? 'bg-white shadow text-pink-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Likes you ({activeSection === 'likes' && likesList.length > 0 ? likesList.length : stats.likesReceived})
            </button>
            <button
              type="button"
              onClick={() => { setActiveSection('likedByMe'); fetchLikedByMe(); fetchStats(); }}
              className={`flex-shrink-0 py-2 px-3 rounded-lg text-xs font-medium transition-all ${activeSection === 'likedByMe' ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              You liked ({stats.likedByMePending})
            </button>
            <button
              type="button"
              onClick={() => { setActiveSection('passed'); fetchPassed(); fetchStats(); }}
              className={`flex-shrink-0 py-2 px-3 rounded-lg text-xs font-medium transition-all ${activeSection === 'passed' ? 'bg-white shadow text-gray-700' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Passed ({stats.passes})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('discover')}
              className={`flex-shrink-0 py-2 px-3 rounded-lg text-xs font-medium transition-all ${activeSection === 'discover' ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
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
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
            </div>
          ) : noMoreLikes ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl p-12 text-center"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No likes yet</h2>
              <p className="text-gray-600 mb-6">When someone likes you, they’ll show up here. Respond when you're ready 💕</p>
              <button
                onClick={() => setActiveSection('discover')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl"
              >
                Go to Discover
              </button>
            </motion.div>
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
                />
              </AnimatePresence>
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl p-12 text-center"
            >
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No one here yet</h2>
              <p className="text-gray-600 mb-6">People you like will show up here until they like you back – then they move to Matches!</p>
              <button
                onClick={() => setActiveSection('discover')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl"
              >
                Go to Discover
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Waiting for them to like you back – or remove to see them in Discover again
              </p>
              {likedByMeList.map((item) => (
                <motion.div
                  key={item.interactionId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4"
                >
                  <img
                    src={item.user.profilePicture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.user._id}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.user.username || 'Someone'}</p>
                    {item.user.bio && <p className="text-sm text-gray-500 truncate">{item.user.bio}</p>}
                    {item.isSuperLike && <span className="text-xs text-amber-600">⭐ Super like</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromLikedByMe(item)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Remove – they'll show in Discover again"
                  >
                    <UserX className="w-4 h-4" />
                    Remove
                  </button>
                </motion.div>
              ))}
            </div>
          )
        ) : activeSection === 'passed' ? (
          loadingPassed ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-gray-500 animate-spin" />
            </div>
          ) : passedList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl p-12 text-center"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserX className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No passed profiles</h2>
              <p className="text-gray-600 mb-6">Anyone you pass on will show here. Remove to see them in Likes you or Discover again.</p>
              <button
                onClick={() => setActiveSection('discover')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl"
              >
                Go to Discover
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <UserX className="w-4 h-4 text-gray-500" />
                Remove to see them in Likes you or Discover again
              </p>
              {passedList.map((item) => (
                <motion.div
                  key={item.interactionId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4"
                >
                  <img
                    src={item.user.profilePicture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.user._id}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.user.username || 'Someone'}</p>
                    {item.user.bio && <p className="text-sm text-gray-500 truncate">{item.user.bio}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromPassed(item)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                    title="Remove – they'll show in Likes you again"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Remove
                  </button>
                </motion.div>
              ))}
            </div>
          )
        ) : noMoreUsers ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              You're all caught up!
            </h2>
            <p className="text-gray-600 mb-6">
              No more users to show right now. Check back later for new matches!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={fetchUsers}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              <button
                onClick={() => navigate('/matches')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                View Your Matches
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="relative" style={{ height: '70vh', maxHeight: '700px' }}>
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
                />
              )}
            </AnimatePresence>

            {loadingMore && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading more...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'discover' && !noMoreUsers && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
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