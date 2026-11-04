// ============================================================================
// File: controllers/horoscopeController.js
// Description: Controller for retrieving celestial Zodiac signs and horoscope predictions
// categorized by Career/Work, Education/Study, Finance, and Overall guidance.
// ============================================================================

const { query, queryOne } = require('../db');

const horoscopeController = {
  /**
   * Get all 12 Zodiac signs
   * Route: GET /api/zodiacs
   */
  async getAllZodiacs(req, res) {
    try {
      // Query all zodiacs in order
      const zodiacs = await query('SELECT * FROM ZODIAC ORDER BY zodiac_id ASC');
      return res.status(200).json(zodiacs);
    } catch (err) {
      console.error('Error fetching zodiacs:', err);
      return res.status(500).json({ error: 'Failed to retrieve zodiac list.' });
    }
  },

  /**
   * Get detailed Horoscope forecast for a specific Zodiac (by ID or Name)
   * Route: GET /api/horoscope/:identifier
   * e.g., /api/horoscope/Pisces or /api/horoscope/12
   */
  async getHoroscope(req, res) {
    const { identifier } = req.params;
    try {
      let sql;
      // Step 1: Check if identifier is numeric ID or string name
      if (isNaN(identifier)) {
        sql = `
          SELECT z.zodiac_id, z.zodiac_name, z.element, z.symbol, z.date_range,
                 h.overall, h.study, h.work, h.love
          FROM ZODIAC z
          JOIN HOROSCOPES h ON z.zodiac_id = h.zodiac_id
          WHERE LOWER(z.zodiac_name) = LOWER(?)
        `;
      } else {
        sql = `
          SELECT z.zodiac_id, z.zodiac_name, z.element, z.symbol, z.date_range,
                 h.overall, h.study, h.work, h.love
          FROM ZODIAC z
          JOIN HOROSCOPES h ON z.zodiac_id = h.zodiac_id
          WHERE z.zodiac_id = ?
        `;
      }

      // Step 2: Execute query with parameter
      const result = await queryOne(sql, [identifier]);
      if (!result) {
        return res.status(404).json({ error: 'Horoscope forecast not found for this zodiac.' });
      }

      // Step 3: Return detailed horoscope forecast
      return res.status(200).json(result);
    } catch (err) {
      console.error('Error fetching horoscope:', err);
      return res.status(500).json({ error: 'Failed to retrieve horoscope details.' });
    }
  }
};

module.exports = horoscopeController;
