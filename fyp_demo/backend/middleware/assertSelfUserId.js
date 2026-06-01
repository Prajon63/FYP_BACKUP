/**
 * Binds :userId to the authenticated user so stale client IDs cannot break discover.
 */
export const bindAuthenticatedUserId = (req, res, next) => {
  if (!req.user?._id) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized',
    });
  }

  const authId = req.user._id.toString();
  if (req.params.userId && req.params.userId !== authId) {
    console.warn(
      `[discover] URL userId ${req.params.userId} != auth ${authId}; using auth id`
    );
  }
  req.params.userId = authId;
  next();
};

export default bindAuthenticatedUserId;
