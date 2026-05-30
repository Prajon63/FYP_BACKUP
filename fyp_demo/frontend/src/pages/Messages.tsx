// frontend/src/pages/Messages.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Menu,
  SlidersHorizontal,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { discoverService } from '../services/discoverService';
import ChatWindow from '../components/ChatWindow';
import SafeImage from '../components/SafeImage';
import type { Match } from '../types';
import { getStoredUserId } from '../utils/auth';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');`;

const CapellaLogo = ({
  onClick,
  className = 'text-2xl',
}: {
  onClick: () => void;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`font-bold shrink-0 cursor-pointer hover:opacity-90 transition-opacity ${className}`}
    style={{ fontFamily: "'Playfair Display', serif" }}
    aria-label="Go to home"
  >
    <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
      Capella
    </span>
  </button>
);

type ContextMenuState = {
  x: number;
  y: number;
  match: Match;
};

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const [activeChat, setActiveChat] = useState<{
    matchId: string;
    receiverId: string;
    receiverName: string;
    receiverPhoto?: string;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const initialOpenDone = useRef(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const userId = getStoredUserId();

  const fetchMatches = async () => {
    if (!userId) return;
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

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    void fetchMatches();
  }, [userId, navigate]);

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
          receiverPhoto: match.user.profilePicture,
        });
        initialOpenDone.current = true;
      }
    } else if (!initialOpenDone.current && matches[0]?.user?._id) {
      const first = matches.find((m) => !m.isArchived) ?? matches[0];
      if (first?.user?._id) {
        setSelectedId(first.matchId);
        setActiveChat({
          matchId: first.matchId,
          receiverId: first.user._id,
          receiverName: first.user.username || 'Match',
          receiverPhoto: first.user.profilePicture,
        });
        initialOpenDone.current = true;
      }
    }
  }, [matches, searchParams]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = (e: MouseEvent) => {
      if (contextMenuRef.current?.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  const openChat = (m: Match) => {
    if (!m.user?._id) return;
    setContextMenu(null);
    setSelectedId(m.matchId);
    setActiveChat({
      matchId: m.matchId,
      receiverId: m.user._id,
      receiverName: m.user.username || 'Match',
      receiverPhoto: m.user.profilePicture,
    });
  };

  const closeChat = () => {
    setActiveChat(null);
  };

  const handleContextMenu = (e: React.MouseEvent, match: Match) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, match });
  };

  const toggleArchive = async (match: Match, archive: boolean) => {
    if (!userId || !match.user?._id) return;
    setArchiveLoading(true);
    setContextMenu(null);
    try {
      await discoverService.setChatArchive(userId, match.user._id, archive);
      setMatches((prev) =>
        prev.map((m) =>
          m.matchId === match.matchId ? { ...m, isArchived: archive } : m
        )
      );
      if (archive && activeChat?.matchId === match.matchId) {
        closeChat();
      }
      toast.success(archive ? 'Chat archived' : 'Chat restored');
      if (archive && activeFilter === 'all') {
        // stay on all — archived chat disappears from list
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update archive');
    } finally {
      setArchiveLoading(false);
    }
  };

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
    if (activeFilter === 'archived') {
      list = list.filter((m) => m.isArchived);
    } else {
      list = list.filter((m) => !m.isArchived);
      if (activeFilter === 'unread') {
        list = list.filter((m) => !m.lastMessageAt);
      }
    }
    return list.filter((m) =>
      (m.user?.username || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [matches, search, activeFilter]);

  const highlightedId = activeChat?.matchId ?? selectedId;

  const renderConversationRow = (m: Match) => (
    <button
      key={m.matchId}
      type="button"
      onClick={() => openChat(m)}
      onContextMenu={(e) => handleContextMenu(e, m)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-rose-50/70 transition-colors ${
        highlightedId === m.matchId
          ? 'bg-rose-50 border-l-4 border-rose-500'
          : ''
      }`}
    >
      <SafeImage
        src={m.user?.profilePicture}
        fallbackSeed={m.user?._id || m.user?.username || 'user'}
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
        <p
          className={`text-xs truncate ${
            m.privacy?.blockedByMe || m.privacy?.blockedMe
              ? 'text-red-500 font-medium'
              : m.isArchived
                ? 'text-slate-400 italic'
                : 'text-slate-500'
          }`}
        >
          {m.privacy?.blockedByMe || m.privacy?.blockedMe
            ? 'User blocked'
            : m.isArchived
              ? 'Archived'
              : m.lastMessageAt
                ? 'Active conversation'
                : `Matched ${formatDate(m.matchedAt)}`}
        </p>
      </div>
    </button>
  );

  return (
    <div
      className="min-h-screen bg-[#faf9f7] flex flex-col"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{FONTS}</style>

      {/* Mobile top bar */}
      <div className="lg:hidden bg-white/80 backdrop-blur-lg border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <CapellaLogo onClick={() => navigate('/home')} className="text-xl" />
        <h1 className="text-sm font-semibold text-slate-600">Messages</h1>
        <div className="flex gap-2">
          <button type="button" className="p-2 rounded-full hover:bg-slate-100">
            <SlidersHorizontal className="w-5 h-5 text-slate-600" />
          </button>
          <button type="button" className="p-2 rounded-full hover:bg-slate-100">
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Desktop header */}
      <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-40">
        <CapellaLogo onClick={() => navigate('/home')} />
        <div className="flex-1 mx-8 max-w-xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search matches"
            className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm"
          />
        </div>
        <nav className="flex items-center gap-6 text-sm text-slate-600">
          <button type="button" onClick={() => navigate('/home')} className="hover:text-rose-500 transition-colors">Home</button>
          <button type="button" onClick={() => navigate('/matches')} className="hover:text-rose-500 transition-colors">Matches</button>
          <span className="font-semibold text-rose-500">Messages</span>
          <button type="button" onClick={() => navigate('/profile')} className="hover:text-rose-500 transition-colors">Profile</button>
        </nav>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full px-0 lg:px-6 py-0 lg:py-6 gap-0 lg:gap-6">

        <aside className="bg-white lg:rounded-3xl lg:shadow-xl lg:w-80 border-slate-100 border-r lg:border flex flex-col">

          <div className="lg:hidden px-4 pt-3 pb-1 border-b border-slate-100">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chat"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-2 mb-3 text-xs">
              {(['all', 'unread', 'archived'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-full capitalize transition-colors ${
                    activeFilter === filter
                      ? 'bg-rose-50 text-rose-600 font-medium'
                      : 'hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-slate-500 mb-2">New Matches</h2>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {filteredMatches.slice(0, 5).map((m) => (
                  <button
                    key={m.matchId}
                    type="button"
                    onClick={() => openChat(m)}
                    onContextMenu={(e) => handleContextMenu(e, m)}
                    className="flex flex-col items-center gap-1 shrink-0"
                  >
                    <div className="relative">
                      <img
                        src={
                          m.user?.profilePicture ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user?.username || 'user'}`
                        }
                        alt={m.user?.username || 'Match'}
                        className="w-14 h-14 rounded-full object-cover border-2 border-rose-400"
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

          <div className="hidden lg:flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-slate-700">Messages</h2>
            <div className="flex items-center gap-2 text-xs">
              {(['all', 'unread', 'archived'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-full capitalize transition-colors ${
                    activeFilter === filter
                      ? 'bg-rose-50 text-rose-600 font-medium'
                      : 'hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-sm font-medium text-slate-600">
                  {activeFilter === 'archived'
                    ? 'No archived chats'
                    : activeFilter === 'unread'
                      ? 'No unread conversations'
                      : 'No conversations yet'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {activeFilter === 'archived'
                    ? 'Archived conversations will appear here'
                    : activeFilter === 'unread'
                      ? 'New matches without messages appear here'
                      : 'Start matching to chat!'}
                </p>
              </div>
            ) : (
              filteredMatches.map(renderConversationRow)
            )}
          </div>
        </aside>

        {activeChat && (
          <section className="flex-1 bg-white lg:rounded-3xl lg:shadow-xl flex flex-col min-h-[50vh] lg:min-h-0">
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

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-[100] min-w-[180px] bg-white rounded-xl shadow-xl border border-slate-100 py-1 text-sm"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 200),
            top: Math.min(contextMenu.y, window.innerHeight - 120),
          }}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            disabled={archiveLoading}
            onClick={() =>
              void toggleArchive(
                contextMenu.match,
                !contextMenu.match.isArchived
              )
            }
            className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {contextMenu.match.isArchived ? (
              <>
                <ArchiveRestore className="w-4 h-4 text-rose-500" />
                Unarchive chat
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 text-slate-500" />
                Archive chat
              </>
            )}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => openChat(contextMenu.match)}
            className="w-full px-4 py-2.5 text-left text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-100"
          >
            Open chat
          </button>
        </div>
      )}

      <nav className="lg:hidden border-t border-slate-200 bg-white px-6 py-2 flex justify-between text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/discover')} className="flex flex-col items-center gap-0.5">
          <span className="w-5 h-5 rounded-full bg-slate-200" />
          <span>Explore</span>
        </button>
        <button type="button" onClick={() => navigate('/matches')} className="flex flex-col items-center gap-0.5">
          <span className="w-5 h-5 rounded-full bg-slate-200" />
          <span>Matches</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-0.5 text-rose-500">
          <span className="w-5 h-5 rounded-full bg-rose-500" />
          <span>Messages</span>
        </button>
        <button type="button" onClick={() => navigate('/profile')} className="flex flex-col items-center gap-0.5">
          <span className="w-5 h-5 rounded-full bg-slate-200" />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default Messages;
