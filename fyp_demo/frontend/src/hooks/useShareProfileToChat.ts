import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { discoverService } from '../services/discoverService';
import { shareProfileInChat } from '../services/chatService';
import type { Match } from '../types';

export function useShareProfileToChat(currentUserId: string) {
  const [open, setOpen] = useState(false);
  const [sharedUserId, setSharedUserId] = useState<string | null>(null);
  const [sharedUsername, setSharedUsername] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const openShare = useCallback(
    async (userId: string, username?: string) => {
      if (!currentUserId) {
        toast.error('Please sign in to share profiles');
        return;
      }
      if (userId === currentUserId) {
        toast.error('You cannot share your own profile');
        return;
      }

      setSharedUserId(userId);
      setSharedUsername(username ?? null);
      setOpen(true);
      setLoading(true);

      try {
        const res = await discoverService.getMatches(currentUserId);
        setMatches(res.matches ?? []);
      } catch {
        toast.error('Could not load your matches');
        setMatches([]);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId]
  );

  const closeShare = useCallback(() => {
    setOpen(false);
    setSharedUserId(null);
    setSharedUsername(null);
    setSendingId(null);
  }, []);

  const shareToMatch = useCallback(
    async (match: Match) => {
      const receiverId = match.user?._id;
      if (!sharedUserId || !receiverId) return;

      setSendingId(match.matchId);
      try {
        await shareProfileInChat(match.matchId, receiverId, sharedUserId);
        toast.success(
          `Shared ${sharedUsername || 'profile'} with ${match.user?.username || 'your match'}`
        );
        closeShare();
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || 'Failed to share profile';
        toast.error(msg);
      } finally {
        setSendingId(null);
      }
    },
    [sharedUserId, sharedUsername, closeShare]
  );

  return {
    open,
    matches,
    loading,
    sendingId,
    sharedUserId,
    sharedUsername,
    openShare,
    closeShare,
    shareToMatch,
  };
}
