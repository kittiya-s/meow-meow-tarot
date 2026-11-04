// ============================================================================
// File: models/userModel.js
// Description: Data Access Object for USERS entity.
// Interfaces directly with SQLite database table and triggers.
// ============================================================================

const { db } = require('../db');

const UserModel = {
  /**
   * Find a user by their unique email address
   * @param {string} email
   * @returns {object|null} user record with joined Zodiac metadata
   */
  findByEmail(email) {
    return db.prepare(`
      SELECT u.user_id, u.name, u.email, u.password, u.birth_date, u.zodiac_id,
             z.zodiac_name, z.element, z.symbol
      FROM USERS u
      LEFT JOIN ZODIAC z ON u.zodiac_id = z.zodiac_id
      WHERE u.email = ?
    `).get(email);
  },

  /**
   * Find a user by their Primary Key (user_id)
   * @param {number} userId
   * @returns {object|null} user record with joined Zodiac metadata
   */
  findById(userId) {
    return db.prepare(`
      SELECT u.user_id, u.name, u.email, u.birth_date, u.zodiac_id,
             z.zodiac_name, z.element, z.symbol
      FROM USERS u
      LEFT JOIN ZODIAC z ON u.zodiac_id = z.zodiac_id
      WHERE u.user_id = ?
    `).get(userId);
  },

  /**
   * Insert a new user into the database
   * Note: The database trigger (trg_assign_zodiac_before_insert) evaluates birth_date
   * and automatically sets the correct zodiac_id!
   * @param {object} userData { name, email, hashedPassword, birth_date }
   * @returns {object} newly inserted user record
   */
  create({ name, email, hashedPassword, birth_date }) {
    const stmt = db.prepare(`
      INSERT INTO USERS (name, email, password, birth_date)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(name, email, hashedPassword, birth_date);
    return this.findById(info.lastInsertRowid);
  },

  /**
   * Update user's name and/or birth_date
   * The trigger trg_assign_zodiac_before_update will automatically update zodiac_id
   * when birth_date is changed!
   * @param {number} userId
   * @param {object} updates { name, birth_date }
   * @returns {object} updated user record
   */
  update(userId, { name, birth_date }) {
    const stmt = db.prepare(`
      UPDATE USERS
      SET name = COALESCE(?, name),
          birth_date = COALESCE(?, birth_date)
      WHERE user_id = ?
    `);
    stmt.run(name || null, birth_date || null, userId);
    return this.findById(userId);
  }
};

module.exports = UserModel;
