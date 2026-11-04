// ============================================================================
// File: models/tarotModel.js
// Description: Data Access Object for TAROT_CARDS, TAROT_READINGS,
// DAILY_PREDICTIONS, and USER_DAILY_PREDICTIONS tables.
// ============================================================================

const { db } = require('../db');

const TarotModel = {
  /**
   * Fetch all 22 Major Arcana cards from TAROT_CARDS
   */
  getAllCards() {
    return db.prepare('SELECT * FROM TAROT_CARDS ORDER BY card_id ASC').all();
  },

  /**
   * Fetch a single Tarot card by card_id
   */
  getCardById(cardId) {
    return db.prepare('SELECT * FROM TAROT_CARDS WHERE card_id = ?').get(cardId);
  },

  /**
   * Select a random Tarot card from the deck
   */
  getRandomCard() {
    const cards = this.getAllCards();
    return cards[Math.floor(Math.random() * cards.length)];
  },

  /**
   * Create an interactive reading record in TAROT_READINGS
   * Note: Triggers trg_after_tarot_reading_insert to record in READING_AUDIT_LOGS.
   */
  createReading(userId, cardId, readingDate, question = 'General Reading') {
    const stmt = db.prepare(`
      INSERT INTO TAROT_READINGS (user_id, card_id, reading_date, question)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(userId, cardId, readingDate, question);
    return info.lastInsertRowid;
  },

  /**
   * Get all past readings for a user
   */
  getUserReadings(userId) {
    return db.prepare(`
      SELECT tr.reading_id, tr.reading_date, tr.question,
             tc.card_id, tc.card_name, tc.meaning, tc.image
      FROM TAROT_READINGS tr
      JOIN TAROT_CARDS tc ON tr.card_id = tc.card_id
      WHERE tr.user_id = ?
      ORDER BY tr.reading_date DESC
    `).all(userId);
  },

  /**
   * Check if user drew a daily card today by comparing date(opened_at)
   */
  getDailyStatusForUser(userId, todayDateStr) {
    return db.prepare(`
      SELECT udp.open_id, udp.opened_at, dp.message, dp.card_id,
             tc.card_name, tc.image, tc.meaning
      FROM USER_DAILY_PREDICTIONS udp
      JOIN DAILY_PREDICTIONS dp ON udp.daily_prediction_id = dp.daily_prediction_id
      LEFT JOIN TAROT_CARDS tc ON dp.card_id = tc.card_id
      WHERE udp.user_id = ? AND date(udp.opened_at) = date(?)
      ORDER BY udp.opened_at DESC
      LIMIT 1
    `).get(userId, todayDateStr);
  },

  /**
   * Pick a random omen from DAILY_PREDICTIONS pool
   */
  getRandomDailyPrediction() {
    const predictions = db.prepare(`
      SELECT dp.daily_prediction_id, dp.card_id, dp.message,
             tc.card_name, tc.image, tc.meaning
      FROM DAILY_PREDICTIONS dp
      LEFT JOIN TAROT_CARDS tc ON dp.card_id = tc.card_id
    `).all();
    if (!predictions.length) return null;
    return predictions[Math.floor(Math.random() * predictions.length)];
  },

  /**
   * Record a new daily prediction draw in USER_DAILY_PREDICTIONS
   */
  recordDailyPrediction(userId, dailyPredictionId, openedAt) {
    const stmt = db.prepare(`
      INSERT INTO USER_DAILY_PREDICTIONS (user_id, daily_prediction_id, opened_at)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(userId, dailyPredictionId, openedAt);
    return info.lastInsertRowid;
  }
};

module.exports = TarotModel;
