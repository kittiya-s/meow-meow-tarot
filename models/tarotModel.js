// ============================================================================
// File: models/tarotModel.js
// Description: Data Access Object for TAROT_CARDS, TAROT_READINGS,
// DAILY_PREDICTIONS and USER_DAILY_PREDICTIONS (MySQL).
// ============================================================================

const { query, queryOne } = require('../db');

const TarotModel = {
  /** All cards in the deck */
  getAllCards() {
    return query('SELECT * FROM TAROT_CARDS ORDER BY card_id ASC');
  },

  /** One card by primary key */
  getCardById(cardId) {
    return queryOne('SELECT * FROM TAROT_CARDS WHERE card_id = ?', [cardId]);
  },

  /** A random card from the deck */
  getRandomCard() {
    return queryOne('SELECT * FROM TAROT_CARDS ORDER BY RAND() LIMIT 1');
  },

  /**
   * Save a reading. The AFTER INSERT trigger trg_after_tarot_reading_insert
   * automatically writes a row into READING_AUDIT_LOGS.
   */
  async createReading(userId, cardId, question = 'General Reading') {
    const result = await query(
      'INSERT INTO TAROT_READINGS (user_id, card_id, reading_date, question) VALUES (?, ?, NOW(), ?)',
      [userId, cardId, question]
    );
    return result.insertId;
  },

  /** Reading history of one user (JOIN with TAROT_CARDS) */
  getUserReadings(userId) {
    return query(`
      SELECT tr.reading_id, tr.reading_date, tr.question,
             tc.card_id, tc.card_name, tc.meaning, tc.image
      FROM TAROT_READINGS tr
      JOIN TAROT_CARDS tc ON tr.card_id = tc.card_id
      WHERE tr.user_id = ?
      ORDER BY tr.reading_date DESC
    `, [userId]);
  },

  /** Today's daily card for this user, if already drawn */
  getDailyStatusForUser(userId) {
    return queryOne(`
      SELECT udp.open_id, udp.opened_at, dp.message, dp.card_id,
             tc.card_name, tc.image, tc.meaning
      FROM USER_DAILY_PREDICTIONS udp
      JOIN DAILY_PREDICTIONS dp ON udp.daily_prediction_id = dp.daily_prediction_id
      LEFT JOIN TAROT_CARDS tc ON dp.card_id = tc.card_id
      WHERE udp.user_id = ? AND DATE(udp.opened_at) = CURDATE()
      ORDER BY udp.opened_at DESC
      LIMIT 1
    `, [userId]);
  },

  /** A random message from the DAILY_PREDICTIONS pool */
  getRandomDailyPrediction() {
    return queryOne(`
      SELECT dp.daily_prediction_id, dp.card_id, dp.message,
             tc.card_name, tc.image, tc.meaning
      FROM DAILY_PREDICTIONS dp
      LEFT JOIN TAROT_CARDS tc ON dp.card_id = tc.card_id
      ORDER BY RAND()
      LIMIT 1
    `);
  },

  /** Record a daily draw in the M:N junction table USER_DAILY_PREDICTIONS */
  async recordDailyPrediction(userId, dailyPredictionId) {
    const result = await query(
      'INSERT INTO USER_DAILY_PREDICTIONS (user_id, daily_prediction_id, opened_at) VALUES (?, ?, NOW())',
      [userId, dailyPredictionId]
    );
    return result.insertId;
  }
};

module.exports = TarotModel;
