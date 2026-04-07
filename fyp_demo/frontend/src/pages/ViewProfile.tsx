import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Heart,
  X,
  Star,
  Bookmark,
  Ban,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Ruler,
  Cigarette,
  Wine,
  Dumbbell,
  Utensils,
  Target,
  ChevronLeft as ArrowLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Share2,
  Flag,
  UserCheck,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { discoverService } from '../services/discoverService';
import { userService } from '../services/userService';
import type { User, Post } from '../types';

// ─── Font import ──────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getStoredUserId = (): string => {
  try {
    const user = localStorage.getItem('user');
    if (user) return JSON.parse(user)._id || '';
  } catch {}
  return localStorage.getItem('userId') || '';
};

const fallbackAvatar = (id: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`;

function timeAgo(dateString: string) {
  if (!dateString) return '';
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

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Pill tag for interests */
function InterestPill({ label }: { label: string }) {
  return (
    <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-rose-50 text-rose-600 border border-rose-100">
      {label}
    </span>
  );
}

/** Single info row (icon + label + value) */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

/** Photo carousel for the gallery tab */
function GalleryCarousel({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!photos.length) return null;

  return (
    <div className="relative mx-auto w-full max-w-xs rounded-2xl overflow-hidden bg-slate-100" style={{ aspectRatio: '4/5' }}>
      <AnimatePresence mode="wait">
        <motion.img
          key={photos[idx]}
          src={photos[idx]}
          alt=""
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>

      {/* Dots */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === idx ? 'bg-white w-4' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx((p) => (p - 1 + photos.length) % photos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIdx((p) => (p + 1) % photos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

/** Post card for the posts tab */
function PostItem({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      {post.images?.length > 0 && (
        <div className="relative">
          <img
            src={post.images[0]}
            alt=""
            className="w-full h-64 object-cover"
          />
          {post.images.length > 1 && (
            <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              +{post.images.length - 1}
            </span>
          )}
        </div>
      )}
      <div className="p-4 space-y-3">
        {post.caption && (
          <p className="text-sm text-slate-700 leading-relaxed">{post.caption}</p>
        )}
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLiked((p) => !p)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                liked ? 'text-rose-500' : 'hover:text-rose-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
              <span>{post.likes + (liked ? 1 : 0)}</span>
            </button>
          </div>
          <span className="text-xs">{timeAgo(post.createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
}

/** Confirmation modal for block */
function BlockConfirmModal({
  username,
  onConfirm,
  onCancel,
}: {
  username: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full"
      >
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Ban className="w-7 h-7 text-red-500" />
        </div>
        <h3
          className="text-xl font-bold text-slate-900 text-center mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Block {username}?
        </h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          They won't be able to find you or see your profile. This can't be undone easily.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
          >
            Block
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ViewProfile: React.FC = () => {
  const { userId: targetUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUserId = getStoredUserId();

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'about' | 'photos' | 'posts'>('about');
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [interactionDone, setInteractionDone] = useState<
    'liked' | 'super_liked' | 'passed' | 'blocked' | null
  >(null);

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!targetUserId) return;
    loadProfile();
  }, [targetUserId]);

  const loadProfile = async () => {
    if (!targetUserId) return;
    try {
      setLoading(true);
      const data = await userService.getPublicProfile(targetUserId);
      if (data.success && data.user) {
        setProfile(data.user as User);
        setPosts(data.posts || []);
      } else {
        toast.error(data.error || 'Failed to load profile');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // ── Interaction handler ────────────────────────────────────────────────────
  const handleInteraction = async (
    action: 'like' | 'pass' | 'super_like' | 'block'
  ) => {
    if (!currentUserId || !targetUserId) {
      toast.error('Please log in first');
      return;
    }
    if (interactionDone) return;

    try {
      setActionLoading(action);
      const res = await discoverService.handleInteraction(currentUserId, targetUserId, action);

      if (action === 'like') {
        if (res.isMatch) {
          toast.success(`🎉 It's a match with ${profile?.username || 'them'}!`, {
            duration: 4000,
          });
        } else {
          toast.success('Liked!');
        }
        setInteractionDone('liked');
      } else if (action === 'super_like') {
        toast.success('⭐ Super liked!', { duration: 3000 });
        setInteractionDone('super_liked');
      } else if (action === 'pass') {
        toast('Passed', { icon: '👋' });
        setInteractionDone('passed');
      } else if (action === 'block') {
        toast.success('User blocked');
        setInteractionDone('blocked');
        setTimeout(() => navigate(-1), 1200);
      }
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
      setShowBlockConfirm(false);
    }
  };

  const handleSave = () => {
    setIsSaved((p) => !p);
    toast.success(isSaved ? 'Removed from saved' : 'Profile saved!');
    // TODO: wire to backend saved profiles endpoint
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const photos = [
    ...(profile?.profilePicture ? [profile.profilePicture] : []),
    ...(profile?.photos || []),
  ].filter((url, i, arr) => arr.indexOf(url) === i);

  const hasLocation =
    profile?.location?.displayLocation || profile?.location?.city;
  const displayLocation =
    profile?.location?.displayLocation ||
    [profile?.location?.city, profile?.location?.country]
      .filter(Boolean)
      .join(', ');

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-rose-400 mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8 text-rose-300" />
          </div>
          <h2
            className="text-2xl font-bold text-slate-800"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Profile not found
          </h2>
          <p className="text-slate-500 text-sm">This profile may be private or doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-2xl bg-rose-500 text-white font-semibold text-sm hover:bg-rose-600 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Interaction result overlay ────────────────────────────────────────────
  const interactionLabels = {
    liked: { emoji: '❤️', text: 'You liked this profile', color: 'bg-rose-50 border-rose-200 text-rose-700' },
    super_liked: { emoji: '⭐', text: 'You super liked this profile', color: 'bg-amber-50 border-amber-200 text-amber-700' },
    passed: { emoji: '👋', text: 'You passed on this profile', color: 'bg-slate-50 border-slate-200 text-slate-600' },
    blocked: { emoji: '🚫', text: 'User blocked', color: 'bg-red-50 border-red-200 text-red-700' },
  };

  return (
    <>
      <style>{FONTS}</style>
      <Toaster position="top-center" />

      <div
        className="min-h-screen bg-[#faf9f7]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

          {/* ── Hero Card (matches profile.tsx style) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden"
          >
            {/* Cover */}
            <div className="relative h-56 sm:h-72 bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500">
              {profile.coverImage && (
                <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Back button */}
              <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* More menu button */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setShowMenu((p) => !p)}
                  className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -8 }}
                      className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden w-44 z-20"
                    >
                      <button
                        onClick={() => { setShowMenu(false); handleSave(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                        {isSaved ? 'Unsave profile' : 'Save profile'}
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); toast('Report feature coming soon'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Flag className="w-4 h-4" />
                        Report
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); setShowBlockConfirm(true); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-slate-100"
                      >
                        <Ban className="w-4 h-4" />
                        Block user
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Avatar + name row (inside card, same as profile.tsx) */}
            <div className="px-6 pb-6 relative">
              <div className="flex items-end justify-between -mt-12 mb-4">
                <motion.div whileHover={{ scale: 1.03 }} className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl">
                    <img
                      src={profile.profilePicture || fallbackAvatar(profile._id)}
                      alt={profile.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {profile.isVerified && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow">
                      <UserCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  {profile.isOnline && (
                    <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white" />
                  )}
                </motion.div>

                {profile.profileCompleteness !== undefined && (
                  <div className="flex flex-col items-end pb-1">
                    <span className="text-xs font-semibold text-slate-400">Profile</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500"
                          style={{ width: `${profile.profileCompleteness}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {profile.profileCompleteness}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Name + bio */}
              <h1
                className="text-2xl font-bold text-slate-900 mb-0.5"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {profile.username || 'Unknown'}
                {profile.age ? `, ${profile.age}` : ''}
              </h1>
              {profile.pronouns && (
                <p className="text-xs text-slate-400 font-medium mt-0.5">{profile.pronouns}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-2">
                {hasLocation && (
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {displayLocation}
                  </span>
                )}
                {profile.lastActive && (
                  <span className="text-xs text-slate-400">
                    Active {timeAgo(profile.lastActive)}
                  </span>
                )}
              </div>

              {profile.bio && (
                <p className="text-sm text-slate-600 leading-relaxed mt-3 max-w-xl">{profile.bio}</p>
              )}

              {profile.relationshipGoals && (
                <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-50 to-pink-50 text-rose-600 border border-rose-100">
                  <Target className="w-3 h-3" />
                  {profile.relationshipGoals}
                </span>
              )}
            </div>
          </motion.div>

          {/* Interaction status banner */}
          <AnimatePresence>
            {interactionDone && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold ${interactionLabels[interactionDone].color}`}
              >
                <span>{interactionLabels[interactionDone].emoji}</span>
                <span>{interactionLabels[interactionDone].text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
            {(['about', 'photos', 'posts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
                {tab === 'photos' && photos.length > 0 && (
                  <span className="ml-1 text-xs text-slate-400">({photos.length})</span>
                )}
                {tab === 'posts' && posts.length > 0 && (
                  <span className="ml-1 text-xs text-slate-400">({posts.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab: About ── */}
          <AnimatePresence mode="wait">
            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 pb-36"
              >
                {profile.about && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                      About
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{profile.about}</p>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                    Details
                  </h3>
                  <InfoRow icon={<Calendar className="w-4 h-4" />} label="Age" value={profile.age ? `${profile.age} years old` : null} />
                  <InfoRow icon={<Ruler className="w-4 h-4" />} label="Height" value={profile.height ? `${profile.height} cm` : null} />
                  <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Work" value={
                    [profile.workTitle, profile.workCompany].filter(Boolean).join(' at ') || null
                  } />
                  <InfoRow icon={<GraduationCap className="w-4 h-4" />} label="Education" value={
                    [profile.educationDegree, profile.educationSchool].filter(Boolean).join(' · ') || null
                  } />
                  <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value={displayLocation || null} />
                </div>

                {profile.lifestyle && Object.values(profile.lifestyle).some(Boolean) && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                      Lifestyle
                    </h3>
                    <InfoRow icon={<Cigarette className="w-4 h-4" />} label="Smoking" value={profile.lifestyle.smoking || null} />
                    <InfoRow icon={<Wine className="w-4 h-4" />} label="Drinking" value={profile.lifestyle.drinking || null} />
                    <InfoRow icon={<Dumbbell className="w-4 h-4" />} label="Exercise" value={profile.lifestyle.exercise || null} />
                    <InfoRow icon={<Utensils className="w-4 h-4" />} label="Diet" value={profile.lifestyle.diet || null} />
                  </div>
                )}

                {profile.interests && profile.interests.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                      Interests
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <InterestPill key={interest} label={interest} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Tab: Photos ── */}
            {activeTab === 'photos' && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="pb-36"
              >
                {photos.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium">No photos yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <GalleryCarousel photos={photos} />
                    {photos.length > 1 && (
                      <div className="grid grid-cols-3 gap-2">
                        {photos.map((photo, i) => (
                          <img
                            key={i}
                            src={photo}
                            alt=""
                            className="aspect-square rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Tab: Posts ── */}
            {activeTab === 'posts' && (
              <motion.div
                key="posts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 pb-36"
              >
                {posts.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium">No public posts yet</p>
                  </div>
                ) : (
                  posts.map((post) => <PostItem key={post._id} post={post} />)
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* ── Sticky action bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-3 safe-area-inset-bottom">
          <div className="max-w-2xl mx-auto">
            {interactionDone ? (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Go back
                </button>
                <button
                  onClick={() => navigate('/discover')}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-sm hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg shadow-rose-200/60"
                >
                  Keep exploring
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                {/* Pass */}
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleInteraction('pass')}
                  disabled={!!actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  {actionLoading === 'pass' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Pass
                </motion.button>

                {/* Super Like */}
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleInteraction('super_like')}
                  disabled={!!actionLoading}
                  className="w-14 flex items-center justify-center rounded-2xl border-2 border-amber-200 text-amber-500 hover:bg-amber-50 transition-all disabled:opacity-50"
                >
                  {actionLoading === 'super_like' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Star className="w-5 h-5" />
                  )}
                </motion.button>

                {/* Like */}
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleInteraction('like')}
                  disabled={!!actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-sm hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg shadow-rose-200/60 disabled:opacity-50"
                >
                  {actionLoading === 'like' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className="w-4 h-4" />
                  )}
                  Like
                </motion.button>
              </div>
            )}

            {/* Not interested / Save row */}
            {!interactionDone && (
              <div className="flex justify-between mt-2">
                <button
                  onClick={() => handleInteraction('pass')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 transition-colors"
                >
                  Not interested
                </button>
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-1 text-xs px-2 py-1 transition-colors ${
                    isSaved ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500' : ''}`} />
                  {isSaved ? 'Saved' : 'Save profile'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Block confirm modal ── */}
        <AnimatePresence>
          {showBlockConfirm && (
            <BlockConfirmModal
              username={profile.username || 'this user'}
              onConfirm={() => handleInteraction('block')}
              onCancel={() => setShowBlockConfirm(false)}
            />
          )}
        </AnimatePresence>

        {/* Close menu on outside click */}
        {showMenu && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>
    </>
  );
};

export default ViewProfile;