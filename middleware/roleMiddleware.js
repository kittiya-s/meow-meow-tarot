// ============================================================================
// File: middleware/roleMiddleware.js
// Description: Role-based access control (RBAC) on the server.
// Roles: 'user' (default), 'admin', 'developer'.
// Must run AFTER authMiddleware, which sets req.user from the JWT.
// ============================================================================

const { queryOne } = require('../db');

/**
 * Allow the request only if the logged-in user's role is in allowedRoles.
 * The role is read fresh from the USERS table (not trusted from the token),
 * so a role change in the database takes effect immediately.
 *
 * Usage: router.delete('/cards/:id', authMiddleware, requireRole('admin'), handler)
 */
function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const row = await queryOne('SELECT role FROM USERS WHERE user_id = ?', [req.user.user_id]);

      if (!row) {
        return res.status(401).json({ error: 'Account not found. Please log in again.' });
      }

      if (!allowedRoles.includes(row.role)) {
        return res.status(403).json({
          error: `Access denied. This action requires role: ${allowedRoles.join(' or ')}.`
        });
      }

      req.user.role = row.role;
      next();
    } catch (err) {
      console.error('Role Check Error:', err);
      return res.status(500).json({ error: 'Could not verify permissions.' });
    }
  };
}

module.exports = { requireRole };
