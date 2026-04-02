import express from 'express';
import {
  getChatHistory,
  getUnreadCount,
  getUnreadDigest
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/unread-count', protect, getUnreadCount);
router.get('/unread-digest', protect, getUnreadDigest);
router.get('/:matchId', protect, getChatHistory);

export default router;

