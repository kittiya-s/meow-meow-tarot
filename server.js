const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');
const { getZodiacFromDate, calculateLifePathNumber } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 1. AUTH & USER REGISTRATION / LOGIN FLOW
// ==========================================

// Register User (User Flow 1)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, birth_date } = req.body;

  if (!name || !email || !password || !birth_date) {
    return res.status(400).json({ error: 'All fields (name, email, password, birth date) are required.' });
  }

  try {
    // Check if user already exists
    const existing = db.prepare('SELECT user_id FROM USERS WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered. Please log in.' });
    }

    // Determine Zodiac sign automatically from birth_date
    const zodiacInfo = getZodiacFromDate(birth_date);
    const zodiacRecord = db.prepare('SELECT zodiac_id FROM ZODIAC WHERE zodiac_name = ?').get(zodiacInfo.name);
    const zodiacId = zodiacRecord ? zodiacRecord.zodiac_id : null;

    // Insert into USERS table
    const stmt = db.prepare(`
      INSERT INTO USERS (name, email, password, birth_date, zodiac_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, email, password, birth_date, zodiacId);

    const newUser = db.prepare(`
      SELECT u.user_id, u.name, u.email, u.birth_date, z.zodiac_name, z.element, z.symbol
      FROM USERS u
      LEFT JOIN ZODIAC z ON u.zodiac_id = z.zodiac_id
      WHERE u.user_id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json({
      message: 'Account registered successfully!',
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// Login User
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password.' });
  }

  try {
    const user = db.prepare(`
      SELECT u.user_id, u.name, u.email, u.password, u.birth_date, u.zodiac_id,
             z.zodiac_name, z.element, z.symbol
      FROM USERS u
      LEFT JOIN ZODIAC z ON u.zodiac_id = z.zodiac_id
      WHERE u.email = ?
    `).get(email);

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Do not leak password back
    const { password: _, ...userData } = user;
    res.json({
      message: 'Login successful!',
      user: userData
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server login error.' });
  }
});

// ==========================================
// 2. ZODIAC & HOROSCOPE FLOW
// ==========================================

// Get all zodiac signs
app.get('/api/zodiacs', (req, res) => {
  try {
    const zodiacs = db.prepare('SELECT * FROM ZODIAC ORDER BY zodiac_id ASC').all();
    res.json(zodiacs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch zodiacs.' });
  }
});

// Get horoscope for specific zodiac ID or Name
app.get('/api/horoscope/:identifier', (req, res) => {
  const { identifier } = req.params;
  try {
    let query;
    if (isNaN(identifier)) {
      query = `
        SELECT z.zodiac_id, z.zodiac_name, z.element, z.symbol, z.date_range,
               h.overall, h.study, h.work, h.love
        FROM ZODIAC z
        JOIN HOROSCOPES h ON z.zodiac_id = h.zodiac_id
        WHERE LOWER(z.zodiac_name) = LOWER(?)
      `;
    } else {
      query = `
        SELECT z.zodiac_id, z.zodiac_name, z.element, z.symbol, z.date_range,
               h.overall, h.study, h.work, h.love
        FROM ZODIAC z
        JOIN HOROSCOPES h ON z.zodiac_id = h.zodiac_id
        WHERE z.zodiac_id = ?
      `;
    }
    const result = db.prepare(query).get(identifier);
    if (!result) {
      return res.status(404).json({ error: 'Horoscope not found.' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching horoscope.' });
  }
});

// ==========================================
// 3. DAILY CARD PREDICTION FLOW (Flow 2)
// ==========================================

// Check if user already viewed today's prediction
app.get('/api/daily-prediction/status/:userId', (req, res) => {
  const { userId } = req.params;
  try {
    // Current date prefix YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const record = db.prepare(`
      SELECT udp.open_id, udp.opened_at, dp.message, dp.card_id,
             tc.card_name, tc.image, tc.meaning
      FROM USER_DAILY_PREDICTIONS udp
      JOIN DAILY_PREDICTIONS dp ON udp.daily_prediction_id = dp.daily_prediction_id
      LEFT JOIN TAROT_CARDS tc ON dp.card_id = tc.card_id
      WHERE udp.user_id = ? AND date(udp.opened_at) = date(?)
      ORDER BY udp.opened_at DESC
      LIMIT 1
    `).get(userId, today);

    if (record) {
      return res.json({ alreadyViewed: true, prediction: record });
    }
    res.json({ alreadyViewed: false });
  } catch (err) {
    res.status(500).json({ error: 'Error checking daily status.' });
  }
});

// Draw / View today's prediction
app.post('/api/daily-prediction', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    // Check if already drawn today
    const existing = db.prepare(`
      SELECT udp.open_id, udp.opened_at, dp.message, dp.card_id,
             tc.card_name, tc.image, tc.meaning
      FROM USER_DAILY_PREDICTIONS udp
      JOIN DAILY_PREDICTIONS dp ON udp.daily_prediction_id = dp.daily_prediction_id
      LEFT JOIN TAROT_CARDS tc ON dp.card_id = tc.card_id
      WHERE udp.user_id = ? AND date(udp.opened_at) = date(?)
      ORDER BY udp.opened_at DESC
      LIMIT 1
    `).get(userId, today);

    if (existing) {
      return res.json({
        alreadyViewed: true,
        message: "You've already viewed today's Tarot Card. Come back tomorrow for a new one!",
        prediction: existing
      });
    }

    // Pick a daily prediction (random or cycle)
    const predictions = db.prepare(`
      SELECT dp.daily_prediction_id, dp.card_id, dp.message,
             tc.card_name, tc.image, tc.meaning
      FROM DAILY_PREDICTIONS dp
      LEFT JOIN TAROT_CARDS tc ON dp.card_id = tc.card_id
    `).all();

    if (!predictions.length) {
      return res.status(404).json({ error: 'No daily predictions configured.' });
    }

    const randomChoice = predictions[Math.floor(Math.random() * predictions.length)];
    const openedAt = new Date().toISOString();

    // Record into USER_DAILY_PREDICTIONS
    db.prepare(`
      INSERT INTO USER_DAILY_PREDICTIONS (user_id, daily_prediction_id, opened_at)
      VALUES (?, ?, ?)
    `).run(userId, randomChoice.daily_prediction_id, openedAt);

    res.json({
      alreadyViewed: false,
      prediction: {
        ...randomChoice,
        opened_at: openedAt
      }
    });
  } catch (err) {
    console.error('Daily prediction error:', err);
    res.status(500).json({ error: 'Error generating daily prediction.' });
  }
});

// ==========================================
// 4. NUMEROLOGY CALCULATION FLOW (Flow 3)
// ==========================================
app.post('/api/numerology', (req, res) => {
  const { userId, birth_date } = req.body;

  if (!birth_date) {
    return res.status(400).json({ error: 'Birth date is required.' });
  }

  try {
    const calc = calculateLifePathNumber(birth_date);
    const calculatedDate = new Date().toISOString();

    if (userId) {
      // Save result to NUMEROLOGY table
      db.prepare(`
        INSERT INTO NUMEROLOGY (user_id, life_path_number, meaning, calculated_date)
        VALUES (?, ?, ?, ?)
      `).run(userId, calc.number, JSON.stringify(calc.detail), calculatedDate);
    }

    res.json({
      lifePathNumber: calc.number,
      detail: calc.detail,
      calculated_date: calculatedDate
    });
  } catch (err) {
    console.error('Numerology calculation error:', err);
    res.status(500).json({ error: 'Error calculating numerology.' });
  }
});

// ==========================================
// 5. TAROT READING FLOW (Flow 4)
// ==========================================

// Get list of tarot cards for deck
app.get('/api/tarot/cards', (req, res) => {
  try {
    const cards = db.prepare('SELECT * FROM TAROT_CARDS ORDER BY card_id ASC').all();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving tarot deck.' });
  }
});

// Draw a tarot card / Create session
app.post('/api/tarot/reading', (req, res) => {
  const { userId, cardId, question } = req.body;

  try {
    let chosenCard;
    if (cardId) {
      chosenCard = db.prepare('SELECT * FROM TAROT_CARDS WHERE card_id = ?').get(cardId);
    } else {
      const cards = db.prepare('SELECT * FROM TAROT_CARDS').all();
      chosenCard = cards[Math.floor(Math.random() * cards.length)];
    }

    if (!chosenCard) {
      return res.status(404).json({ error: 'Card not found.' });
    }

    const readingDate = new Date().toISOString();
    let readingId = null;

    if (userId) {
      const insert = db.prepare(`
        INSERT INTO TAROT_READINGS (user_id, card_id, reading_date)
        VALUES (?, ?, ?)
      `).run(userId, chosenCard.card_id, readingDate);
      readingId = insert.lastInsertRowid;
    }

    res.json({
      reading_id: readingId,
      card: chosenCard,
      reading_date: readingDate,
      question: question || 'General Reading'
    });
  } catch (err) {
    console.error('Reading error:', err);
    res.status(500).json({ error: 'Error creating tarot reading.' });
  }
});

// Get user reading history
app.get('/api/tarot/history/:userId', (req, res) => {
  const { userId } = req.params;
  try {
    const history = db.prepare(`
      SELECT tr.reading_id, tr.reading_date, tc.card_name, tc.meaning, tc.image
      FROM TAROT_READINGS tr
      JOIN TAROT_CARDS tc ON tr.card_id = tc.card_id
      WHERE tr.user_id = ?
      ORDER BY tr.reading_date DESC
    `).all(userId);

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching history.' });
  }
});

// Root route -> serve index.html
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`✨ Meow Meow Tarot server running on http://localhost:${PORT}`);
});
