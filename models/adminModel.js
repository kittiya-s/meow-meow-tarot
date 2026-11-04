// ============================================================================
// File: models/adminModel.js
// Description: Data Access Object for the Admin and Developer dashboard.
// Full CRUD on TAROT_CARDS, user role management on USERS,
// and read-only access to READING_AUDIT_LOGS (written by the trigger).
// All queries use ? placeholders (parameterized) to prevent SQL injection.
// ============================================================================

const { db } = require('../db');

const AdminModel = {
  // --------------------------------------------------------------------------
  // TAROT_CARDS: Create, Read, Update, Delete
  // --------------------------------------------------------------------------

  listCards() {
    return db.prepare(`
      SELECT tc.card_id, tc.card_name, tc.arcana_type, tc.meaning, tc.image,
             COUNT(tr.reading_id) AS times_drawn
      FROM TAROT_CARDS tc
      LEFT JOIN TAROT_READINGS tr ON tr.card_id = tc.card_id
      GROUP BY tc.card_id
      ORDER BY tc.card_id ASC
    `).all();
  },

  getCard(cardId) {
    return db.prepare('SELECT * FROM TAROT_CARDS WHERE card_id = ?').get(cardId);
  },

  createCard({ card_name, arcana_type, meaning, image }) {
    const info = db.prepare(`
      INSERT INTO TAROT_CARDS (card_name, arcana_type, meaning, image)
      VALUES (?, ?, ?, ?)
    `).run(card_name, arcana_type, meaning, image);
    return this.getCard(info.lastInsertRowid);
  },

  updateCard(cardId, { card_name, arcana_type, meaning, image }) {
    const info = db.prepare(`
      UPDATE TAROT_CARDS
      SET card_name = ?, arcana_type = ?, meaning = ?, image = ?
      WHERE card_id = ?
    `).run(card_name, arcana_type, meaning, image, cardId);
    return info.changes > 0 ? this.getCard(cardId) : null;
  },

  // ON DELETE CASCADE removes this card's TAROT_READINGS rows;
  // ON DELETE SET NULL keeps DAILY_PREDICTIONS rows but clears card_id.
  deleteCard(cardId) {
    return db.prepare('DELETE FROM TAROT_CARDS WHERE card_id = ?').run(cardId).changes > 0;
  },

  // --------------------------------------------------------------------------
  // USERS: Read, Update role, Delete
  // --------------------------------------------------------------------------

  listUsers() {
    return db.prepare(`
      SELECT u.user_id, u.name, u.email, u.birth_date, u.role, u.created_at,
             z.zodiac_name,
             (SELECT COUNT(*) FROM TAROT_READINGS tr WHERE tr.user_id = u.user_id) AS readings
      FROM USERS u
      LEFT JOIN ZODIAC z ON u.zodiac_id = z.zodiac_id
      ORDER BY u.user_id ASC
    `).all();
  },

  updateUserRole(userId, role) {
    return db.prepare('UPDATE USERS SET role = ? WHERE user_id = ?').run(role, userId).changes > 0;
  },

  // ON DELETE CASCADE removes the user's readings, numerology and daily draws.
  deleteUser(userId) {
    return db.prepare('DELETE FROM USERS WHERE user_id = ?').run(userId).changes > 0;
  },

  // --------------------------------------------------------------------------
  // Developer tools: audit log (filled by trigger) and table statistics
  // --------------------------------------------------------------------------

  listAuditLogs(limit = 50) {
    return db.prepare(`
      SELECT l.log_id, l.reading_id, l.user_id, u.name AS user_name,
             l.card_id, tc.card_name, l.logged_at, l.action_note
      FROM READING_AUDIT_LOGS l
      LEFT JOIN USERS u ON u.user_id = l.user_id
      LEFT JOIN TAROT_CARDS tc ON tc.card_id = l.card_id
      ORDER BY l.log_id DESC
      LIMIT ?
    `).all(limit);
  },

  tableStats() {
    // Table names are a fixed whitelist (never user input), so building
    // the COUNT query from this list is safe.
    const tables = [
      'USERS', 'ZODIAC', 'HOROSCOPES', 'TAROT_CARDS', 'TAROT_READINGS',
      'READING_AUDIT_LOGS', 'DAILY_PREDICTIONS', 'USER_DAILY_PREDICTIONS', 'NUMEROLOGY'
    ];
    return tables.map(name => ({
      table: name,
      rows: db.prepare(`SELECT COUNT(*) AS cnt FROM ${name}`).get().cnt
    }));
  }
};

module.exports = AdminModel;
