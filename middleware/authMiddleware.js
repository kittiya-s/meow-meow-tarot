// ============================================================================
// File: middleware/authMiddleware.js
// Description: JSON Web Token (JWT) authentication middleware.
// Protects private endpoints and verifies seeker identities.
// ============================================================================

const jwt = require('jsonwebtoken');

// Secret key used to sign and verify JWT tokens (read from .env, never hardcoded)
const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set in .env. Using a temporary random secret (logins reset on restart).');
}

/**
 * Mandatory Authentication Middleware
 * Validates that an Authorization header with Bearer token is provided.
 * Rejects request with 401 Unauthorized if missing, expired, or invalid.
 */
function authMiddleware(req, res, next) {
  // Step 1: Read the Authorization header from the incoming request
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
  }

  // Step 2: Strip the "Bearer " prefix if present
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    // Step 3: Verify the token using the secret key
    const decoded = jwt.verify(token, JWT_SECRET);

    // Step 4: Attach the decoded user payload ({ user_id, email, name }) to req.user
    req.user = decoded;

    // Step 5: Proceed to the next middleware / controller
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

/**
 * Optional Authentication Middleware
 * Used on endpoints accessible to both guests and logged-in seekers
 * (e.g., guest tarot readings or saving history if logged in).
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
}

module.exports = {
  JWT_SECRET,
  authMiddleware,
  optionalAuth
};
