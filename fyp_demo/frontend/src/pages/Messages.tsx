// frontend/src/pages/Messages.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ArrowLeft,
  Menu,
  SlidersHorizontal
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { discoverService } from '../services/discoverService';
import ChatWindow from '../components/ChatWindow';
import type { Match } from '../types';
import { getStoredUserId } from '../utils/auth';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'archived'>('all');

  // activeChat is the ONLY thing that controls what is open.
  // selectedId is only used for the sidebar highlight — it never
  // drives chat visibility, so closing the chat (setActiveChat(null))
  // does NOT affect selectedId and therefore does NOT block reopening.
  const [activeChat, setActiveChat] = useState<{
    matchId: string;
    receiverId: string;
    receiverName: string;
    receiverPhoto?: string;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Prevents the auto-open-first-match logic from firing more than once.
  const initialOpenDone = useRef(false);

  const userId = getStoredUserId();

  // ── Fetch matches ────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await discoverService.getMatches(userId);
        if (response.success) {
          setMatches(response.matches || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [userId, navigate]);

  // ── Deep-link + default first-chat ──────────────────────────────
  // activeChat is intentionally NOT a dependency here.
  // Including it would re-trigger this effect whenever the user closes
  // the panel, immediately re-opening it and breaking the X button.
  useEffect(() => {
    if (!matches.length) return;

    const matchIdParam = searchParams.get('matchId');
    const receiverIdParam = searchParams.get('receiverId');

    if (matchIdParam && receiverIdParam) {
      const match = matches.find((m) => m.matchId === matchIdParam);
      if (match && match.user?._id === receiverIdParam) {
        setSelectedId(match.matchId);
        setActiveChat({
          matchId: match.matchId,
          receiverId: match.user._id,
          receiverName: match.user.username || 'Match',
          receiverPhoto: match.user.profilePicture
        });
        initialOpenDone.current = true;
      }
    } else if (!initialOpenDone.current && matches[0]?.user?._id) {
      // Auto-open the first conversation exactly once on page load
      setSelectedId(matches[0].matchId);
      setActiveChat({
        matchId: matches[0].matchId,
        receiverId: matches[0].user._id,
        receiverName: matches[0].user.username || 'Match',
        receiverPhoto: matches[0].user.profilePicture
      });
      initialOpenDone.current = true;
    }
  }, [matches, searchParams]); // activeChat excluded on purpose

  // ── Open a chat (user-initiated) ─────────────────────────────────
  // Sets state directly — works whether activeChat is null or not.
  // This is why clicking the sidebar always works after closing.
  const openChat = (m: Match) => {
    if (!m.user?._id) return;
    setSelectedId(m.matchId);
    setActiveChat({
      matchId: m.matchId,
      receiverId: m.user._id,
      receiverName: m.user.username || 'Match',
      receiverPhoto: m.user.profilePicture
    });
  };

  // ── Close chat ───────────────────────────────────────────────────
  // Clears activeChat but intentionally keeps selectedId so the
  // sidebar item stays highlighted — makes it clear which one to
  // click to reopen. openChat() will always work on next click.
  const closeChat = () => {
    setActiveChat(null);
  };

  // ── Helpers ──────────────────────────────────────────────────────
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredMatches = useMemo(() => {
    let list = matches;
    if (activeFilter === 'unread') {
      list = list.filter((m) => !m.lastMessageAt);
    } else if (activeFilter === 'archived') {
      list = [];
    }
    return list.filter((m) =>
      (m.user?.username || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [matches, search, activeFilter]);

  // Used only for sidebar highlight — does NOT control chat visibility
  const highlightedId = activeChat?.matchId ?? selectedId;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex flex-col">

      {/* Mobile top bar */}
      <div className="lg:hidden bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Messages</h1>
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-slate-100">
            <SlidersHorizontal className="w-5 h-5 text-slate-600" />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100">
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Desktop header */}
      <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-slate-900 tracking-tight">Capella</span>
        </div>
        <div className="flex-1 mx-8 max-w-xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search matches"
            className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div>
        <nav className="flex items-center gap-6 text-sm text-slate-600">
          <button onClick={() => navigate('/home')} className="hover:text-purple-600">Home</button>
          <button onClick={() => navigate('/matches')} className="hover:text-purple-600">Matches</button>
          <span className="font-semibold text-purple-600">Messages</span>
          <button onClick={() => navigate('/profile')} className="hover:text-purple-600">Profile</button>
        </nav>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full px-0 lg:px-6 py-0 lg:py-6 gap-0 lg:gap-6">

        {/* Conversation list sidebar */}
        <aside className="bg-white lg:rounded-3xl lg:shadow-xl lg:w-80 border-slate-100 border-r lg:border flex flex-col">

          {/* Mobile search + new matches strip */}
          <div className="lg:hidden px-4 pt-3 pb-1 border-b border-slate-100">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chat"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-slate-500 mb-2">New Matches</h2>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {filteredMatches.slice(0, 5).map((m) => (
                  <button
                    key={m.matchId}
                    onClick={() => openChat(m)}
                    className="flex flex-col items-center gap-1 shrink-0"
                  >
                    <div className="relative">
                      <img
                        src={m.user?.profilePicture || 'https://via.placeholder.com/80'}
                        alt={m.user?.username || 'Match'}
                        className="w-14 h-14 rounded-full object-cover border-2 border-purple-400"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border border-white bg-emerald-400" />
                    </div>
                    <span className="text-xs text-slate-700">
                      {m.user?.username || 'Match'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop filter tabs */}
          <div className="hidden lg:flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-slate-700">Messages</h2>
            <div className="flex items-center gap-2 text-xs">
              {(['all', 'unread', 'archived'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-full capitalize transition-colors ${
                    activeFilter === filter
                      ? 'bg-purple-50 text-purple-600 font-medium'
                      : 'hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation items */}
          <div className="flex-1 overflow-y-auto">
            {activeFilter === 'archived' && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-sm font-medium text-slate-600">No archived chats</p>
                <p className="text-xs text-slate-400 mt-1">
                  Archived conversations will appear here
                </p>
              </div>
            )}

            {filteredMatches.map((m) => (
              <button
                key={m.matchId}
                onClick={() => openChat(m)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-purple-50/70 transition-colors ${
                  highlightedId === m.matchId
                    ? 'bg-purple-50 border-l-4 border-purple-500'
                    : ''
                }`}
              >
                <img
                  src={m.user?.profilePicture || 'https://via.placeholder.com/80'}
                  alt={m.user?.username || 'Match'}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {m.user?.username || 'Match'}
                    </p>
                    <span className="text-[11px] text-slate-400 ml-2 shrink-0">
                      {m.lastMessageAt
                        ? formatDate(m.lastMessageAt)
                        : formatDate(m.matchedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {m.lastMessageAt
                      ? 'Active conversation'
                      : `Matched ${formatDate(m.matchedAt)}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat panel — only mounts when activeChat is set */}
        {activeChat && (
          <section className="flex-1 bg-white lg:rounded-3xl lg:shadow-xl flex flex-col">
            <ChatWindow
              matchId={activeChat.matchId}
              receiverId={activeChat.receiverId}
              receiverName={activeChat.receiverName}
              receiverPhoto={activeChat.receiverPhoto}
              onClose={closeChat}
            />
          </section>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden border-t border-slate-200 bg-white px-6 py-2 flex justify-between text-xs text-slate-500">
        <button onClick={() => navigate('/discover')} className="flex flex-col items-center gap-0.5">
          <span className="w-5 h-5 rounded-full bg-slate-200" />
          <span>Explore</span>
        </button>
        <button onClick={() => navigate('/matches')} className="flex flex-col items-center gap-0.5">
          <span className="w-5 h-5 rounded-full bg-slate-200" />
          <span>Matches</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-purple-600">
          <span className="w-5 h-5 rounded-full bg-purple-500" />
          <span>Messages</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-0.5">
          <span className="w-5 h-5 rounded-full bg-slate-200" />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default Messages;