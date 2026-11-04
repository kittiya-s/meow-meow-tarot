// ============================================================================
// File: models/adminModel.js
// Description: Data Access Object for the Admin and Developer dashboard (MySQL).
// Full CRUD on TAROT_CARDS, user role management on USERS,
// and read-only access to READING_AUDIT_LOGS (written by the trigger).
// All queries use ? placeholders (parameterized) to prevent SQL injection.
// ============================================================================

const { query, queryOne } = require('../db');

const AdminModel = {
  // --------------------------------------------------------------------------
  // TAROT_CARDS: Create, Read, Update, Delete
  // --------------------------------------------------------------------------

  listCards() {
    return query(`
      SELECT tc.card_id, tc.card_name, tc.arcana_type, tc.meaning, tc.image,
             COUNT(tr.reading_id) AS times_drawn
      FROM TAROT_CARDS tc
      LEFT JOIN TAROT_READINGS tr ON tr.card_id = tc.card_id
      GROUP BY tc.card_id
      ORDER BY tc.card_id ASC
    `);
  },

  getCard(cardId) {
    return queryOne('SELECT * FROM TAROT_CARDS WHERE card_id = ?', [cardId]);
  },

  async createCard({ card_name, arcana_type, meaning, image }) {
    const result = await query(
      'INSERT INTO TAROT_CARDS (card_name, arcana_type, meaning, image) VALUES (?, ?, ?, ?)',
      [card_name, arcana_type, meaning, image]
    );
    return this.getCard(result.insertId);
  },

  async updateCard(cardId, { card_name, arcana_type, meaning, image }) {
    if (!(await this.getCard(cardId))) return null;
    await query(
      'UPDATE TAROT_CARDS SET card_name = ?, arcana_type = ?, meaning = ?, image = ? WHERE card_id = ?',
      [card_name, arcana_type, meaning, image, cardId]
    );
    return this.getCard(cardId);
  },

  // ON DELETE CASCADE removes this card's TAROT_READINGS rows;
  // ON DELETE SET NULL keeps DAILY_PREDICTIONS rows but clears card_id.
  async deleteCard(cardId) {
    const result = await query('DELETE FROM TAROT_CARDS WHERE card_id = ?', [cardId]);
    return result.affectedRows > 0;
  },

  // --------------------------------------------------------------------------
  // USERS: Read, Update role, Delete
  // --------------------------------------------------------------------------

  listUsers() {
    return query(`
      SELECT u.user_id, u.name, u.email, u.birth_date, u.role, u.created_at,
             z.zodiac_name,
             (SELECT COUNT(*) FROM TAROT_READINGS tr WHERE tr.user_id = u.user_id) AS readings
      FROM USERS u
      LEFT JOIN ZODIAC z ON u.zodiac_id = z.zodiac_id
      ORDER BY u.user_id ASC
    `);
  },

  async updateUserRole(userId, role) {
    const user = await queryOne('SELECT user_id FROM USERS WHERE user_id = ?', [userId]);
    if (!user) return false;
    await query('UPDATE USERS SET role = ? WHERE user_id = ?', [role, userId]);
    return true;
  },

  // ON DELETE CASCADE removes the user's readings, numerology and daily draws.
  async deleteUser(userId) {
    const result = await query('DELETE FROM USERS WHERE user_id = ?', [userId]);
    return result.affectedRows > 0;
  },

  // --------------------------------------------------------------------------
  // Developer tools: audit log (filled by trigger) and table statistics
  // --------------------------------------------------------------------------

  listAuditLogs() {
    return query(`
      SELECT l.log_id, l.reading_id, l.user_id, u.name AS user_name,
             l.card_id, tc.card_name, l.logged_at, l.action_note
      FROM READING_AUDIT_LOGS l
      LEFT JOIN USERS u ON u.user_id = l.user_id
      LEFT JOIN TAROT_CARDS tc ON tc.card_id = l.card_id
      ORDER BY l.log_id DESC
      LIMIT 50
    `);
  },

  async tableStats() {
    // Table names are a fixed whitelist (never user input), so building
    // the COUNT query from this list is safe. Values can't be placeholders
    // for table names in SQL.
    const tables = [
      'USERS', 'ZODIAC', 'HOROSCOPES', 'TAROT_CARDS', 'TAROT_READINGS',
      'READING_AUDIT_LOGS', 'DAILY_PREDICTIONS', 'USER_DAILY_PREDICTIONS', 'NUMEROLOGY'
    ];
    const stats = [];
    for (const name of tables) {
      const row = await queryOne(`SELECT COUNT(*) AS cnt FROM ${name}`);
      stats.push({ table: name, rows: Number(row.cnt) });
    }
    return stats;
  }
};

module.exports = AdminModel;
