import express from 'express';
import { protect } from '../middleware/auth.js';
import { searchLocation, reverseLocation } from '../controllers/geocodeController.js';

const router = express.Router();

router.get('/search', protect, searchLocation);
router.get('/reverse', protect, reverseLocation);

export default router;
