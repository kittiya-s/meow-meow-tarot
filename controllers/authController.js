// ============================================================================
// File: controllers/authController.js
// Description: Controller handling User Registration, Login, and Profile retrieval.
// Uses bcrypt for secure password hashing and JWT for session token issuance.
// ============================================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const authController = {
  /**
   * Register a new user
   * Route: POST /api/auth/register
   * Input: { name, email, password, birth_date }
   */
  async register(req, res) {
    try {
      const { name, email, password, birth_date } = req.body;

      // Step 1: Validate required fields
      if (!name || !email || !password || !birth_date) {
        return res.status(400).json({
          error: 'Missing required fields: name, email, password, and birth_date are all required.'
        });
      }

      // Step 1B: Validate formats before touching the database
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
        return res.status(400).json({ error: 'Birth date must be in YYYY-MM-DD format.' });
      }

      // Step 2: Check if email already exists in the database
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          error: 'This email is already registered. Please log in instead.'
        });
      }

      // Step 3: Hash password with bcrypt (salt rounds = 10) for security
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Step 4: Insert new user into database
      // The SQL Trigger (trg_assign_zodiac_before_insert) will auto-assign zodiac_id based on birth_date!
      const newUser = await UserModel.create({
        name,
        email,
        hashedPassword,
        birth_date
      });

      // Step 5: Issue a JSON Web Token (JWT) valid for 7 days
      const token = jwt.sign(
        { user_id: newUser.user_id, email: newUser.email, name: newUser.name, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Step 6: Return 201 Created with user info (without password) and token
      return res.status(201).json({
        message: 'Account registered successfully!',
        token,
        user: newUser
      });
    } catch (err) {
      console.error('Registration Error:', err);
      return res.status(500).json({ error: 'Server error occurred during user registration.' });
    }
  },

  /**
   * Log in an existing user
   * Route: POST /api/auth/login
   * Input: { email, password }
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Step 1: Validate input fields
      if (!email || !password) {
        return res.status(400).json({ error: 'Please provide both email and password.' });
      }

      // Step 2: Look up user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Step 3: Compare submitted password against stored bcrypt hash
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Step 4: Issue JWT token upon successful authentication
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Step 5: Remove password before returning user object
      const { password: _, ...safeUserData } = user;

      return res.status(200).json({
        message: 'Login successful!',
        token,
        user: safeUserData
      });
    } catch (err) {
      console.error('Login Error:', err);
      return res.status(500).json({ error: 'Server error occurred during login.' });
    }
  },

  /**
   * Get current authenticated user's profile
   * Route: GET /api/auth/profile
   * Requires: Bearer token (authMiddleware)
   */
  async getProfile(req, res) {
    try {
      // req.user is set by authMiddleware
      const user = await UserModel.findById(req.user.user_id);
      if (!user) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      return res.status(200).json({ user });
    } catch (err) {
      console.error('Profile Retrieval Error:', err);
      return res.status(500).json({ error: 'Server error occurred retrieving profile.' });
    }
  }
};

module.exports = authController;
