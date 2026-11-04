// ============================================================================
// File: routes/userRoutes.js
// Description: Express routes for User Profile management (Protected by JWT).
// ============================================================================

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/user/profile - Fetch current user profile
router.get('/profile', authMiddleware, userController.getProfile);

// PUT /api/user/profile - Update user name and birth_date (triggers Zodiac auto-recalculation)
router.put('/profile', authMiddleware, userController.updateProfile);

module.exports = router;

