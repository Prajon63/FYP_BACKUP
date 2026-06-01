import Match from '../models/Match.js';

/**
 * Match id the viewer should use for chat (Messages list / join_chat).
 * Prefers the viewer's fromUser→other record, then the reverse mutual doc.
 */
export async function resolveViewerMatchId(viewerId, otherUserId) {
  const viewer = String(viewerId);
  const other = String(otherUserId);

  const mine = await Match.findOne({
    fromUser: viewer,
    toUser: other,
    isMutual: true,
  })
    .select('_id')
    .lean();

  if (mine) return mine._id.toString();

  const sibling = await Match.findOne({
    fromUser: other,
    toUser: viewer,
    isMutual: true,
  })
    .select('_id')
    .lean();

  return sibling?._id.toString() ?? null;
}
