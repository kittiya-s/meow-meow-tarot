// ============================================================================
// File: models/userModel.js
// Description: Data Access Object for the USERS table (MySQL).
// Zodiac is assigned by the MySQL triggers trg_assign_zodiac_before_insert
// and trg_assign_zodiac_before_update.
// ============================================================================

const { query, queryOne } = require('../db');

const UserModel = {
  /**
   * Find a user by email (includes password hash, used only for login)
   */
  findByEmail(email) {
    return queryOne(`
      SELECT u.user_id, u.name, u.email, u.password, u.birth_date, u.zodiac_id, u.role,
             z.zodiac_name, z.element, z.symbol
      FROM USERS u
      LEFT JOIN ZODIAC z ON u.zodiac_id = z.zodiac_id
      WHERE u.email = ?
    `, [email]);
  },

  /**
   * Find a user by primary key (no password)
   */
  findById(userId) {
    return queryOne(`
      SELECT u.user_id, u.name, u.email, u.birth_date, u.zodiac_id, u.role,
             z.zodiac_name, z.element, z.symbol
      FROM USERS u
      LEFT JOIN ZODIAC z ON u.zodiac_id = z.zodiac_id
      WHERE u.user_id = ?
    `, [userId]);
  },

  /**
   * Insert a new user (role defaults to 'user').
   * The BEFORE INSERT trigger sets zodiac_id from birth_date.
   */
  async create({ name, email, hashedPassword, birth_date }) {
    const result = await query(
      'INSERT INTO USERS (name, email, password, birth_date) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, birth_date]
    );
    return this.findById(result.insertId);
  },

  /**
   * Update name and/or birth_date.
   * The BEFORE UPDATE trigger recalculates zodiac_id when birth_date changes.
   */
  async update(userId, { name, birth_date }) {
    await query(`
      UPDATE USERS
      SET name = COALESCE(?, name),
          birth_date = COALESCE(?, birth_date)
      WHERE user_id = ?
    `, [name || null, birth_date || null, userId]);
    return this.findById(userId);
  }
};

module.exports = UserModel;
