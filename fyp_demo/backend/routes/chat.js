import express from 'express';
import multer from 'multer';
import {
  getChatHistory,
  getUnreadCount,
  getUnreadDigest,
  uploadChatImage,
  shareProfileInChat,
  deleteChatMessage,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.get('/unread-count', protect, getUnreadCount);
router.get('/unread-digest', protect, getUnreadDigest);
const MAX_CHAT_IMAGES = 4;

const handleImageUpload = (req, res, next) => {
  upload.array('images', MAX_CHAT_IMAGES)(req, res, (err) => {
    if (err) {
      let message = err.message || 'Invalid image upload';
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'Each image must be 5MB or smaller';
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        message = `You can send up to ${MAX_CHAT_IMAGES} images at a time`;
      }
      return res.status(400).json({ message });
    }
    next();
  });
};

router.post('/:matchId/image', protect, handleImageUpload, uploadChatImage);
router.post('/:matchId/profile-share', protect, shareProfileInChat);
router.delete('/:matchId/messages/:messageId', protect, deleteChatMessage);
router.get('/:matchId', protect, getChatHistory);

export default router;

