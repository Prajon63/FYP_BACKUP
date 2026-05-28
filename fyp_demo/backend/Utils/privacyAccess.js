import Match from '../models/Match.js';

/**
 * Privacy / block context between viewer and profile owner.
 */
export async function getBlockContext(viewerId, targetUserId) {
  const viewer = viewerId?.toString();
  const target = targetUserId?.toString();

  if (!viewer || !target || viewer === target) {
    return {
      blockedByMe: false,
      blockedMe: false,
      canViewProfile: true,
      canInteract: true,
      canMessage: true
    };
  }

  const [iBlocked, theyBlocked] = await Promise.all([
    Match.findOne({ fromUser: viewer, toUser: target, status: 'blocked' }).lean(),
    Match.findOne({ fromUser: target, toUser: viewer, status: 'blocked' }).lean()
  ]);

  const blockedByMe = !!iBlocked;
  const blockedMe = !!theyBlocked;
  const canInteract = !blockedByMe && !blockedMe;

  return {
    blockedByMe,
    blockedMe,
    canViewProfile: !blockedMe,
    canInteract,
    canMessage: canInteract
  };
}

/** User IDs to hide from discover/search (I blocked them + they blocked me). */
export async function getExcludedUserIds(userId) {
  const uid = userId.toString();
  const [iBlocked, blockedMe] = await Promise.all([
    Match.find({ fromUser: uid, status: 'blocked' }).distinct('toUser'),
    Match.find({ toUser: uid, status: 'blocked' }).distinct('fromUser')
  ]);
  return [...new Set([...iBlocked, ...blockedMe].map((id) => id.toString()))];
}

/**
 * Block a user. For mutual matches, keep isMutual so chat threads stay in Messages.
 * Does not demote the other user's record to "liked" (avoids false "liked you" alerts).
 */
export async function applyBlock(blockerId, targetUserId) {
  const blocker = blockerId.toString();
  const target = targetUserId.toString();

  const existing = await Match.findOne({ fromUser: blocker, toUser: target });
  const preserveMutual =
    existing?.isMutual === true || existing?.status === 'matched';

  const record = await Match.findOneAndUpdate(
    { fromUser: blocker, toUser: target },
    {
      $set: {
        status: 'blocked',
        updatedAt: new Date(),
        ...(preserveMutual ? { isMutual: true } : { isMutual: false })
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return record;
}

/**
 * Unblock: restore mutual match state when applicable (keeps chat + match list intact).
 */
export async function applyUnblock(unblockerId, targetUserId) {
  const unblocker = unblockerId.toString();
  const target = targetUserId.toString();

  const record = await Match.findOne({
    fromUser: unblocker,
    toUser: target,
    status: 'blocked'
  });

  if (!record) {
    return { restored: null };
  }

  const reverse = await Match.findOne({ fromUser: target, toUser: unblocker });
  const wasMutual =
    record.isMutual === true ||
    reverse?.isMutual === true ||
    reverse?.status === 'matched';

  if (wasMutual) {
    await Match.findOneAndUpdate(
      { fromUser: unblocker, toUser: target },
      {
        $set: {
          status: 'matched',
          isMutual: true,
          updatedAt: new Date()
        }
      }
    );

    if (reverse) {
      await Match.updateOne(
        { _id: reverse._id },
        {
          $set: {
            status: 'matched',
            isMutual: true,
            updatedAt: new Date()
          }
        }
      );
    }

    return { restored: 'matched' };
  }

  await Match.deleteOne({ _id: record._id });
  return { restored: 'removed' };
}

export function privacyMessage(ctx) {
  if (ctx.blockedMe) {
    return 'This profile is not available. The user has restricted access.';
  }
  if (ctx.blockedByMe) {
    return 'You blocked this user. They cannot see your profile or interact with you. Unblock in Settings to restore access.';
  }
  return null;
}

export function chatBlockMessage(ctx) {
  if (ctx.blockedByMe) {
    return 'You blocked this user. Unblock them in Settings to send messages again.';
  }
  if (ctx.blockedMe) {
    return 'This user is unavailable. You cannot send messages to them.';
  }
  return null;
}
