const express = require('express');
const router = express.Router();
const numerologyController = require('../controllers/numerologyController');
const { optionalAuth, authMiddleware } = require('../middleware/authMiddleware');

// Calculate life path number
router.post('/', optionalAuth, numerologyController.calculate);

// History
router.get('/history', authMiddleware, numerologyController.getHistory);

module.exports = router;

