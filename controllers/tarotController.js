// ============================================================================
// File: controllers/tarotController.js
// Description: Controller for Tarot deck retrieval, interactive card reading sessions,
// and daily prediction constraint enforcement (1 draw per calendar day).
// ============================================================================

const TarotModel = require('../models/tarotModel');

const tarotController = {
  /**
   * Get all Tarot cards in the deck
   * Route: GET /api/tarot/cards
   */
  getAllCards(req, res) {
    try {
      const cards = TarotModel.getAllCards();
      return res.status(200).json(cards);
    } catch (err) {
      console.error('Error fetching cards:', err);
      return res.status(500).json({ error: 'Failed to retrieve Tarot cards.' });
    }
  },

  /**
   * Draw a card for an interactive Tarot Reading session (User Flow 4)
   * Route: POST /api/tarot/reading
   * Body: { cardId (optional), question (optional) }
   */
  drawCardReading(req, res) {
    try {
      const { cardId, question } = req.body;
      const userId = req.user ? req.user.user_id : (req.body.userId || null);

      // Step 1: Select specific card if requested, otherwise pick randomly
      let chosenCard;
      if (cardId) {
        chosenCard = TarotModel.getCardById(cardId);
      } else {
        chosenCard = TarotModel.getRandomCard();
      }

      if (!chosenCard) {
        return res.status(404).json({ error: 'Selected Tarot card does not exist.' });
      }

      const readingDate = new Date().toISOString();
      let readingId = null;

      // Step 2: If user is authenticated, persist reading to database
      // The SQL Trigger (trg_after_tarot_reading_insert) will auto-log this to READING_AUDIT_LOGS!
      if (userId) {
        readingId = TarotModel.createReading(
          userId,
          chosenCard.card_id,
          readingDate,
          question || 'General Reading'
        );
      }

      // Step 3: Return reading details and drawn card
      return res.status(200).json({
        reading_id: readingId,
        card: chosenCard,
        reading_date: readingDate,
        question: question || 'General Reading'
      });
    } catch (err) {
      console.error('Tarot Reading Error:', err);
      return res.status(500).json({ error: 'Failed to record Tarot reading.' });
    }
  },

  /**
   * Get Tarot Reading history for the authenticated user
   * Route: GET /api/tarot/history
   */
  getUserHistory(req, res) {
    try {
      const userId = req.user.user_id;
      const history = TarotModel.getUserReadings(userId);
      return res.status(200).json(history);
    } catch (err) {
      console.error('History Retrieval Error:', err);
      return res.status(500).json({ error: 'Failed to load reading history.' });
    }
  },

  /**
   * Check if user has already viewed their Daily Card today
   * Route: GET /api/tarot/daily-status
   */
  getDailyStatus(req, res) {
    try {
      const userId = req.user.user_id;
      // Get current date string in YYYY-MM-DD
      const todayDateStr = new Date().toISOString().split('T')[0];

      // Query database for a draw record today
      const existingRecord = TarotModel.getDailyStatusForUser(userId, todayDateStr);
      if (existingRecord) {
        return res.status(200).json({
          alreadyViewed: true,
          prediction: existingRecord
        });
      }

      return res.status(200).json({ alreadyViewed: false });
    } catch (err) {
      console.error('Daily status check error:', err);
      return res.status(500).json({ error: 'Failed to check daily prediction status.' });
    }
  },

  /**
   * Draw today's Daily Card Prediction (User Flow 2)
   * Constraint: Users can only draw ONCE per calendar day based on opened_at timestamp.
   * Route: POST /api/tarot/daily-card
   */
  drawDailyCard(req, res) {
    try {
      const userId = req.user.user_id;
      const todayDateStr = new Date().toISOString().split('T')[0];

      // Step 1: Enforce Daily Constraint Check
      const existing = TarotModel.getDailyStatusForUser(userId, todayDateStr);
      if (existing) {
        return res.status(400).json({
          alreadyViewed: true,
          error: "You've already viewed today's Tarot Card. Come back tomorrow for a new one!",
          prediction: existing
        });
      }

      // Step 2: Pick a random prediction message from DAILY_PREDICTIONS table
      const randomPrediction = TarotModel.getRandomDailyPrediction();
      if (!randomPrediction) {
        return res.status(404).json({ error: 'No daily predictions available.' });
      }

      // Step 3: Record opened_at timestamp into USER_DAILY_PREDICTIONS table
      const openedAt = new Date().toISOString();
      TarotModel.recordDailyPrediction(userId, randomPrediction.daily_prediction_id, openedAt);

      // Step 4: Return drawn card and message
      return res.status(200).json({
        alreadyViewed: false,
        prediction: {
          ...randomPrediction,
          opened_at: openedAt
        }
      });
    } catch (err) {
      console.error('Draw daily card error:', err);
      return res.status(500).json({ error: 'Failed to process daily card prediction.' });
    }
  }
};

module.exports = tarotController;
