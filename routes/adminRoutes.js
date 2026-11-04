// ============================================================================
// File: routes/adminRoutes.js
// Description: Role-protected endpoints mounted at /api/admin
//
//   Role       | Cards              | Users              | Audit log / Stats
//   -----------|--------------------|--------------------|------------------
//   admin      | Create/Read/Update/Delete | Read, change role, Delete | ✗ (403)
//   developer  | Read only          | ✗ (403)            | Read
//   user       | ✗ (403)            | ✗ (403)            | ✗ (403)
// ============================================================================

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Every route below requires a valid login token first
router.use(authMiddleware);

// Which role am I? (any logged-in user)
router.get('/me', requireRole('user', 'admin', 'developer'), adminController.me);

// Tarot cards
router.get('/cards', requireRole('admin', 'developer'), adminController.listCards);
router.post('/cards', requireRole('admin'), adminController.createCard);
router.put('/cards/:id', requireRole('admin'), adminController.updateCard);
router.delete('/cards/:id', requireRole('admin'), adminController.deleteCard);

// User management
router.get('/users', requireRole('admin'), adminController.listUsers);
router.put('/users/:id/role', requireRole('admin'), adminController.updateUserRole);
router.delete('/users/:id', requireRole('admin'), adminController.deleteUser);

// Developer tools
router.get('/audit-logs', requireRole('developer'), adminController.auditLogs);
router.get('/stats', requireRole('developer'), adminController.stats);

module.exports = router;
