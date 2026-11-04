// ============================================================================
// File: server.js
// Description: Main entry point for the Meow Meow Tarot Express backend.
// Sets up middleware, static assets, and mounts MVC route controllers.
// ============================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Step 1: MySQL connection pool (credentials from .env)
const { initDatabase } = require('./db');

// Step 2: Import modular route handlers (MVC Routes)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tarotRoutes = require('./routes/tarotRoutes');
const horoscopeRoutes = require('./routes/horoscopeRoutes');
const numerologyRoutes = require('./routes/numerologyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// Global Middleware Setup
// ============================================================================

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Parse incoming request bodies as JSON
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files (HTML, CSS, JS, Images) from the /public folder
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));

// Explicit aliases for assets and images directories
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));


// ============================================================================
// API Route Registration (MVC Architecture)
// ============================================================================

// Authentication endpoints: /api/auth/register, /api/auth/login, /api/auth/profile
app.use('/api/auth', authRoutes);

// User Profile endpoints: /api/user/profile (GET, PUT)
app.use('/api/user', userRoutes);

// Tarot endpoints: /api/tarot/cards, /api/tarot/reading, /api/tarot/daily-card, etc.
app.use('/api/tarot', tarotRoutes);

// Zodiac & Horoscope endpoints: /api/zodiacs, /api/horoscope/:identifier
app.use('/api', horoscopeRoutes);

// Numerology endpoints: /api/numerology, /api/numerology/history
app.use('/api/numerology', numerologyRoutes);

// Role-protected dashboard endpoints: /api/admin/* (Admin and Developer only)
app.use('/api/admin', adminRoutes);

// Single Page Application (SPA) Fallback: Serve index.html for unknown routes
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  // Full details stay in the server log only; the user gets a generic message
  console.error('Unhandled Application Error:', err);
  res.status(500).json({ error: 'Something went wrong. Please try again later.' });
});

// ============================================================================
// Start Server Listening
// ============================================================================
// Check MySQL first, then start listening
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✨ Meow Meow Tarot server is running at: http://localhost:${PORT}`);
    });
  })
  .catch(() => process.exit(1));
