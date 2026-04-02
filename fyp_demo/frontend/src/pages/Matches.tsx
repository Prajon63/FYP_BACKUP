import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Sparkles,
  Search,
  X,
  MapPin,
  ChevronLeft,
  Flame,
  Clock,
  Loader2,
  UserX,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { discoverService } from '../services/discoverService';
import ChatWindow from '../components/ChatWindow';
import type { Match } from '../types';
import { getStoredUserId } from '../utils/auth';
import NotificationBell from '../components/NotificationBell';

// ── Helpers ────────────────────────────────────────────────────────────
function timeAgo(dateString: string) {
  if (!dateString) return 'Recently';
  const diff = Date.now() - new Date(dateString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function scoreColor(score: number) {
  if (score >= 90) return { bg: 'from-rose-400 to-pink-500' };
  if (score >= 80) return { bg: 'from-orange-400 to-rose-400' };
  return { bg: 'from-amber-400 to-orange-400' };
}

// ── New Match Bubble ───────────────────────────────────────────────────
function NewMatchBubble({ match, onProfileClick }: { match: Match; onProfileClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onProfileClick}
      className="flex flex-col items-center gap-1.5 shrink-0"
      type="button"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500">
          <img
            src={
              match.user?.profilePicture ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.user?._id}`
            }
            alt={match.user?.username || 'Match'}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">✦</span>
        </span>
      </div>
      <span className="text-[11px] font-semibold text-slate-600 max-w-[60px] truncate">
        {(match.user?.username || 'Match').split(' ')[0]}
      </span>
    </motion.button>
  );
}

// ── Match Card ─────────────────────────────────────────────────────────
function MatchCard({
  match,
  index,
  onOpenDetails,
  onNavigateProfile,
  onMessage,
  onUnmatch,
}: {
  match: Match;
  index: number;
  onOpenDetails: () => void;
  onNavigateProfile: (e: React.MouseEvent) => void;
  onMessage: (e: React.MouseEvent) => void;
  onUnmatch: (e: React.MouseEvent) => void;
}) {
  const colors = scoreColor(match.compatibilityScore);
  const isNew = !match.lastMessageAt;
  const isHot = match.compatibilityScore >= 90;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500"
      style={{ aspectRatio: '3/4' }}
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenDetails();
        }}
        className="absolute top-14 left-4 z-20 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        title="Quick view"
        aria-label="Open match details"
      >
        <Info className="w-4 h-4" />
      </motion.button>

      <img
        src={
          match.user?.profilePicture ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.user?._id}`
        }
        alt={match.user?.username || 'Match'}
        onClick={onNavigateProfile}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer z-0"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent z-[1] pointer-events-none" />

      {/* Badges */}
      <div className="absolute top-4 left-4 flex gap-2 z-[1] pointer-events-none">
        {isHot && (
          <span className="flex items-center gap-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg">
            <Flame className="w-3 h-3" /> Hot Match
          </span>
        )}
        {isNew && (
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/30">
            <Sparkles className="w-3 h-3" /> New
          </span>
        )}
      </div>

      {/* Compatibility score */}
      <div
        className={`absolute top-4 right-4 z-[1] pointer-events-none bg-gradient-to-r ${colors.bg} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg`}
      >
        {match.compatibilityScore}%
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateProfile}
          className="text-left w-full"
        >
          <h3
            className="text-white font-bold text-xl leading-tight mb-0.5 cursor-pointer"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {match.user?.username || 'Anonymous'}
            {match.user?.age && (
              <span className="font-normal text-white/80 text-lg">, {match.user.age}</span>
            )}
          </h3>
        </motion.button>

        <div className="flex items-center gap-1 text-white/70 text-xs mb-3">
          {match.user?.location && (
            <>
              <MapPin className="w-3 h-3" />
              <span>{match.user.location}</span>
              <span className="mx-1.5 opacity-40">·</span>
            </>
          )}
          <Clock className="w-3 h-3" />
          <span>{timeAgo(match.matchedAt)}</span>
        </div>

        {match.user?.bio && (
          <p className="text-white/80 text-xs leading-relaxed line-clamp-2 mb-4">{match.user.bio}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onMessage}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold text-sm py-2.5 rounded-2xl transition-all shadow-lg shadow-rose-500/30"
            type="button"
          >
            <MessageCircle className="w-4 h-4" />
            Message
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUnmatch}
            className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white hover:bg-red-500/60 transition-all"
            title="Unmatch"
            type="button"
          >
            <UserX className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────
function DetailModal({
  match,
  onClose,
  onMessage,
  onUnmatch,
  onOpenMessagesPage,
}: {
  match: Match;
  onClose: () => void;
  onMessage: () => void;
  onUnmatch: () => void;
  onOpenMessagesPage: () => void;
}) {
  const colors = scoreColor(match.compatibilityScore);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo */}
        <div className="relative h-96">
          <img
            src={
              match.user?.profilePicture ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.user?._id}`
            }
            alt={match.user?.username || 'Match'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
          <div
            className={`absolute top-4 left-4 bg-gradient-to-r ${colors.bg} text-white text-sm font-bold px-3 py-1 rounded-full`}
          >
            {match.compatibilityScore}% Match
          </div>
          <div className="absolute bottom-5 left-5">
            <h2
              className="text-white text-3xl font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {match.user?.username || 'Anonymous'}
            </h2>
            <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
              {match.user?.age && <span>{match.user.age} years</span>}
              {match.user?.location && (
                <>
                  <span className="opacity-40">·</span>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{match.user.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 space-y-4">
          {match.user?.bio && (
            <p className="text-slate-600 text-sm leading-relaxed">{match.user.bio}</p>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-400" />
              Matched {timeAgo(match.matchedAt)}
            </span>
            {match.lastMessageAt && (
              <span className="text-purple-500 font-medium flex items-center gap-1">
                <MessageCircle className="w-3 h-3" /> Active chat
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onMessage}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-400/30"
              type="button"
            >
              <MessageCircle className="w-5 h-5" />
              Quick Message
            </motion.button>
            <button
              onClick={onOpenMessagesPage}
              className="px-4 py-3 text-sm rounded-2xl border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors font-medium"
              type="button"
            >
              Open Chat
            </button>
          </div>

          <button
            onClick={onUnmatch}
            className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 py-2.5 rounded-2xl transition-colors"
            type="button"
          >
            <UserX className="w-4 h-4" />
            Unmatch
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const Matches: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'chatting'>('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeChat, setActiveChat] = useState<{
    matchId: string;
    receiverId: string;
    receiverName: string;
    receiverPhoto?: string;
  } | null>(null);

  // FIX 14: Robust userId retrieval - same pattern as Discover.tsx
  const userId = getStoredUserId();

  const goProfile = (targetId: string | undefined) => {
    if (!targetId) return;
    if (targetId === userId) navigate('/profile');
    else navigate(`/profile/${targetId}`);
  };

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    fetchMatches();
  }, [userId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await discoverService.getMatches(userId);

      if (response.success) {
        setMatches(response.matches || []);
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
        // FIX 15: Remove from local state immediately for instant UI feedback
        setMatches(prev => prev.filter(m => m.matchId !== matchId));
        setSelectedMatch(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to unmatch');
    }
  };

  const handleMessage = (match: Match) => {
    if (!match.user?._id) return;
    setActiveChat({
      matchId: match.matchId,
      receiverId: match.user._id,
      receiverName: match.user.username || 'Match',
      receiverPhoto: match.user.profilePicture
    });
  };

  const handleOpenMessagesPage = (match: Match) => {
    if (!match.user?._id) {
      navigate('/messages');
      return;
    }
    navigate(
      `/messages?matchId=${encodeURIComponent(
        match.matchId
      )}&receiverId=${encodeURIComponent(match.user._id)}`
    );
  };

  const newMatches = matches.filter((m) => !m.lastMessageAt);
  const activeChats = matches.filter((m) => !!m.lastMessageAt);

  const filteredMatches = matches.filter((m) => {
    const matchesSearch = (m.user?.username || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'new') return matchesSearch && !m.lastMessageAt;
    if (activeTab === 'chatting') return matchesSearch && !!m.lastMessageAt;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading your matches…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#faf9f7]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/discover')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            type="button"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1
              className="text-xl font-bold text-slate-900 leading-none"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Your Matches
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {matches.length} {matches.length === 1 ? 'person' : 'people'} matched with you
            </p>
          </div>
          <NotificationBell variant="soft" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* New Matches Strip */}
        {newMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-slate-700 tracking-wide">New Matches</h2>
              <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {newMatches.length}
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
              {newMatches.map((m) => (
                <NewMatchBubble
                  key={m.matchId}
                  match={m}
                  onProfileClick={() => goProfile(m.user?._id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Total Matches',
              value: matches.length,
              icon: Heart,
              iconBg: 'bg-rose-50',
              iconText: 'text-rose-500',
            },
            {
              label: 'New Matches',
              value: newMatches.length,
              icon: Sparkles,
              iconBg: 'bg-purple-50',
              iconText: 'text-purple-500',
            },
            {
              label: 'Active Chats',
              value: activeChats.length,
              icon: MessageCircle,
              iconBg: 'bg-pink-50',
              iconText: 'text-pink-500',
            },
          ].map(({ label, value, icon: Icon, iconBg, iconText }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon className={`w-5 h-5 ${iconText}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter Tabs */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent shadow-sm"
            />
          </div>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm shrink-0">
            {(['all', 'new', 'chatting'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Empty / No results states */}
        {matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-12 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-rose-300" />
            </div>
            <h3
              className="text-2xl font-bold text-slate-800 mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              No matches yet
            </h3>
            <p className="text-slate-400 text-sm mb-6">Start swiping to find your perfect match!</p>
            <button
              onClick={() => navigate('/discover')}
              className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-3 px-8 rounded-2xl shadow-lg shadow-rose-300/40 hover:from-rose-600 hover:to-pink-600 transition-all"
              type="button"
            >
              Start Discovering
            </button>
          </motion.div>
        ) : filteredMatches.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No matches found</h3>
            <p className="text-slate-400 text-sm">Try a different name or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredMatches.map((match, i) => (
              <MatchCard
                key={match.matchId}
                match={match}
                index={i}
                onOpenDetails={() => setSelectedMatch(match)}
                onNavigateProfile={(e) => {
                  e.stopPropagation();
                  goProfile(match.user?._id);
                }}
                onMessage={(e) => {
                  e.stopPropagation();
                  handleMessage(match);
                }}
                onUnmatch={(e) => {
                  e.stopPropagation();
                  handleUnmatch(match.matchId, match.user._id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMatch && (
          <DetailModal
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            onMessage={() => {
              handleMessage(selectedMatch);
              setSelectedMatch(null);
            }}
            onUnmatch={() => handleUnmatch(selectedMatch.matchId, selectedMatch.user._id)}
            onOpenMessagesPage={() => {
              handleOpenMessagesPage(selectedMatch);
              setSelectedMatch(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Inline Chat Panel */}
      {activeChat && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 z-50 p-4 flex flex-col h-screen">
          <ChatWindow
            matchId={activeChat.matchId}
            receiverId={activeChat.receiverId}
            receiverName={activeChat.receiverName}
            receiverPhoto={activeChat.receiverPhoto}
            onClose={() => setActiveChat(null)}
          />
        </div>
      )}
    </div>
  );
};

export default Matches;