import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Sparkles,
  Loader2,
  UserX,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { discoverService } from '../services/discoverService';
import type { Match } from '../types';

const Matches: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (userId) {
      fetchMatches();
    }
  }, [userId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await discoverService.getMatches(userId);
      
      if (response.success) {
        setMatches(response.matches);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const handleUnmatch = async (matchId: string, targetUserId: string) => {
    const confirmed = window.confirm('Are you sure you want to unmatch? This cannot be undone.');
    
    if (!confirmed) return;

    try {
      const response = await discoverService.unmatch(userId, targetUserId);
      
      if (response.success) {
        toast.success('Unmatched successfully');
        setMatches(prev => prev.filter(m => m.matchId !== matchId));
        setSelectedMatch(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to unmatch');
    }
  };

  const handleMessage = (match: Match) => {
    // Navigate to messages (implement when messaging is ready)
    toast.success('Messaging feature coming soon!');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredMatches = matches.filter(match =>
    match.user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/discover')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>

            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Your Matches
            </h1>

            <div className="w-10"></div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No matches yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start swiping to find your perfect match!
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg"
            >
              Start Discovering
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match, index) => (
              <motion.div
                key={match.matchId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => setSelectedMatch(match)}
              >
                {/* User Image */}
                <div className="relative h-64">
                  <img
                    src={match.user.profilePicture || 'https://via.placeholder.com/400'}
                    alt={match.user.username || 'Match'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  
                  {/* Compatibility Badge */}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    {match.compatibilityScore}% Match
                  </div>

                  {/* User Info Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-xl font-bold mb-1">
                      {match.user.username || 'Anonymous'}
                      {match.user.age && <span className="text-white/90">, {match.user.age}</span>}
                    </h3>
                    {match.user.location && (
                      <p className="text-white/80 text-sm">{match.user.location}</p>
                    )}
                  </div>
                </div>

                {/* Match Info */}
                <div className="p-4">
                  {match.user.bio && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {match.user.bio}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Matched {formatDate(match.matchedAt)}</span>
                    </div>
                    {match.lastMessageAt && (
                      <span className="text-purple-600 font-medium">
                        Active conversation
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessage(match);
                      }}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnmatch(match.matchId, match.user._id);
                      }}
                      className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 p-2 rounded-xl transition-colors"
                    >
                      <UserX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Search Results */}
        {filteredMatches.length === 0 && matches.length > 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No matches found
            </h3>
            <p className="text-gray-600">
              Try searching with a different name
            </p>
          </div>
        )}
      </div>

      {/* Match Detail Modal */}
      {selectedMatch && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMatch(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-80">
              <img
                src={selectedMatch.user.profilePicture || 'https://via.placeholder.com/400'}
                alt={selectedMatch.user.username || 'Match'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-white text-3xl font-bold mb-2">
                  {selectedMatch.user.username || 'Anonymous'}
                  {selectedMatch.user.age && <span className="text-white/90">, {selectedMatch.user.age}</span>}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {selectedMatch.compatibilityScore}% Compatible
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {selectedMatch.user.bio && (
                <p className="text-gray-700 mb-4">{selectedMatch.user.bio}</p>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleMessage(selectedMatch)}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send Message
                </button>
                <button
                  onClick={() => handleUnmatch(selectedMatch.matchId, selectedMatch.user._id)}
                  className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 p-3 rounded-xl transition-colors"
                >
                  <UserX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Matches;