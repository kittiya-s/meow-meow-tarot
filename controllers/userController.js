// ============================================================================
// File: controllers/userController.js
// Description: Controller handling User Profile viewing and updating.
// Updating birth_date triggers automatic Zodiac recalculation via database trigger.
// ============================================================================

const UserModel = require('../models/userModel');

const userController = {
  /**
   * Get user profile details
   * Route: GET /api/user/profile
   */
  getProfile(req, res) {
    try {
      const userId = req.user.user_id;
      const user = UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      return res.status(200).json({ user });
    } catch (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ error: 'Failed to retrieve profile information.' });
    }
  },

  /**
   * Update user profile (Name, Birth Date)
   * Route: PUT /api/user/profile
   * Note: The database trigger automatically updates zodiac_id when birth_date changes!
   */
  updateProfile(req, res) {
    try {
      const userId = req.user.user_id;
      const { name, birth_date } = req.body;

      if (!name && !birth_date) {
        return res.status(400).json({ error: 'Please provide name or birth_date to update.' });
      }

      // Execute update in database model
      const updatedUser = UserModel.update(userId, { name, birth_date });

      return res.status(200).json({
        message: 'Profile updated successfully!',
        user: updatedUser
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      return res.status(500).json({ error: 'Failed to update user profile.' });
    }
  }
};

module.exports = userController;

