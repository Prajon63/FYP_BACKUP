import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  Heart,
  Users,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import UserCard from '../components/UserCard';
import MatchModal from '../components/MatchModal';
import FilterModal from '../components/FilterModal';
import { discoverService } from '../services/discoverService';
import type { DiscoveryUser, MatchPreferences } from '../types';

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
  const [stats, setStats] = useState({
    likesReceived: 0,
    totalMatches: 0
  });

  // Get userId from localStorage (adjust based on your auth implementation)
  const userId = localStorage.getItem('userId') || '';

  // Default preferences
  const [preferences, setPreferences] = useState<MatchPreferences>({
    ageRange: { min: 18, max: 100 },
    distanceRange: 50,
    genderPreference: []
  });

  // Fetch initial users
  useEffect(() => {
    if (userId) {
      fetchUsers();
      fetchStats();
    }
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
        setStats({
          likesReceived: response.stats.likesReceived,
          totalMatches: response.stats.totalMatches
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const loadMoreUsers = async () => {
    if (loadingMore) return;

    try {
      setLoadingMore(true);
      const response = await discoverService.getDiscoverUsers(userId, {
        limit: 10,
        offset: users.length,
        sortBy: 'score'
      });

      if (response.success && response.users.length > 0) {
        setUsers(prev => [...prev, ...response.users]);
      }
    } catch (error: any) {
      console.error('Failed to load more users:', error);
    } finally {
      setLoadingMore(false);
    }
  };

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
          // It's a match!
          setMatchedUser(response.match.user);
          setMatchScore(response.match.compatibilityScore);
          setShowMatchModal(true);
          fetchStats(); // Update stats
        } else {
          toast.success('Liked!', { duration: 1000, icon: '💖' });
        }
      }

      moveToNext();
    } catch (error: any) {
      toast.error(error.message || 'Failed to like user');
    }
  };

  const handlePass = async () => {
    const currentUser = users[currentIndex];
    if (!currentUser) return;

    try {
      await discoverService.handleInteraction(userId, currentUser._id, 'pass');
      moveToNext();
    } catch (error: any) {
      toast.error(error.message || 'Failed to pass user');
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
        if (response.isMatch && response.match) {
          setMatchedUser(response.match.user);
          setMatchScore(response.match.compatibilityScore);
          setShowMatchModal(true);
          fetchStats();
        } else {
          toast.success('Super Liked!', { duration: 1500, icon: '⭐' });
        }
      }

      moveToNext();
    } catch (error: any) {
      toast.error(error.message || 'Failed to super like user');
    }
  };

  const moveToNext = () => {
    setCurrentIndex(prev => prev + 1);

    // Load more users when running low
    if (currentIndex >= users.length - 3) {
      loadMoreUsers();
    }
  };

  const handleApplyFilters = async (newPreferences: MatchPreferences) => {
    try {
      await discoverService.updateMatchPreferences(userId, newPreferences);
      setPreferences(newPreferences);
      toast.success('Filters updated!');
      fetchUsers(); // Reload users with new filters
    } catch (error: any) {
      toast.error(error.message || 'Failed to update filters');
    }
  };

  const handleSendMessage = () => {
    setShowMatchModal(false);
    // Navigate to messages (implement when messages feature is ready)
    toast.success('Message feature coming soon!');
  };

  const handleKeepSwiping = () => {
    setShowMatchModal(false);
  };

  const currentUser = users[currentIndex];
  const noMoreUsers = currentIndex >= users.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Finding your perfect matches...</p>
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

          {/* Stats Bar */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Heart className="w-4 h-4 text-pink-500" />
              <span>{stats.likesReceived} likes</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4 text-purple-500" />
              <span>{stats.totalMatches} matches</span>
            </div>
            <button
              onClick={() => navigate('/matches')}
              className="ml-auto text-purple-600 hover:text-purple-700 font-medium"
            >
              View Matches →
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {noMoreUsers ? (
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
                />
              )}
            </AnimatePresence>

            {/* Loading indicator for next cards */}
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

        {/* Card Counter */}
        {!noMoreUsers && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              {currentIndex + 1} / {users.length}
              {loadingMore && ' (loading more...)'}
            </p>
          </div>
        )}
      </div>

      {/* Match Modal */}
      <MatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        matchUser={matchedUser}
        compatibilityScore={matchScore}
        onSendMessage={handleSendMessage}
        onKeepSwiping={handleKeepSwiping}
      />

      {/* Filter Modal */}
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