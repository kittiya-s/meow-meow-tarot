const express = require('express');
const router = express.Router();
const tarotController = require('../controllers/tarotController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

// Tarot Deck & Readings
router.get('/cards', tarotController.getAllCards);
router.post('/reading', optionalAuth, tarotController.drawCardReading);
router.get('/history', authMiddleware, tarotController.getUserHistory);

// Daily Card Predictions with 1-per-day validation constraint
router.get('/daily-status', authMiddleware, tarotController.getDailyStatus);
router.post('/daily-card', authMiddleware, tarotController.drawDailyCard);

module.exports = router;

