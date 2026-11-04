// ============================================================================
// File: db.js
// Description: Database connection setup using better-sqlite3 with full
// schema definitions, custom SQL functions, procedures, triggers, and sample data.
// ============================================================================

const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// Step 1: Resolve database path from environment variable or default
const dbPath = path.resolve(__dirname, process.env.DB_PATH || 'meow_tarot.db');
const db = new Database(dbPath);

// Step 2: Enforce foreign key constraints
db.pragma('foreign_keys = ON');

/**
 * Custom Stored Function: fn_get_zodiac_id
 * Determines Zodiac ID (1-12) from birth_date string (YYYY-MM-DD)
 * Aries (Mar 21 - Apr 19), Taurus (Apr 20 - May 20), Gemini (May 21 - Jun 20),
 * Cancer (Jun 21 - Jul 22), Leo (Jul 23 - Aug 22), Virgo (Aug 23 - Sep 22),
 * Libra (Sep 23 - Oct 22), Scorpio (Oct 23 - Nov 21), Sagittarius (Nov 22 - Dec 21),
 * Capricorn (Dec 22 - Jan 19), Aquarius (Jan 20 - Feb 18), Pisces (Feb 19 - Mar 20)
 */
function fnGetZodiacId(birthDateStr) {
  if (!birthDateStr) return 12; // default Pisces
  const parts = String(birthDateStr).split('-');
  if (parts.length < 3) return 12;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 1;  // Aries
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 2;  // Taurus
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 3;  // Gemini
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 4;  // Cancer
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 5;  // Leo
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 6;  // Virgo
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 7; // Libra
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 8;// Scorpio
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 9;// Sagittarius
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 10;// Capricorn
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 11; // Aquarius
  return 12; // Pisces
}

/**
 * Custom Stored Procedure / Function: sp_calculate_life_path
 * Computes life path number from birth_date, preserving master numbers (11, 22)
 * and compound numbers like 21 (as featured on Slide 8 of the proposal).
 */
function spCalculateLifePath(birthDateStr) {
  const digits = String(birthDateStr).replace(/\D/g, '');
  if (!digits) return 7;

  let total = digits.split('').reduce((acc, curr) => acc + parseInt(curr, 10), 0);

  // Reduce iteratively until single digit (1-9) or recognized compound/master (11, 21, 22)
  while (total > 9 && total !== 11 && total !== 21 && total !== 22) {
    total = total.toString().split('').reduce((acc, curr) => acc + parseInt(curr, 10), 0);
  }
  return total;
}

// Step 3: Register functions into SQLite engine so SQL triggers can execute them
try {
  db.function('fn_get_zodiac_id', (dateStr) => fnGetZodiacId(dateStr));
  db.function('sp_calculate_life_path', (dateStr) => spCalculateLifePath(dateStr));
} catch (e) {
  // Ignore if already registered
}

/**
 * Initialize Database Tables, Triggers, and Default Seed Data
 */
function initDatabase() {
  // 1. Create tables strictly matching Physical ERD
  db.exec(`
    CREATE TABLE IF NOT EXISTS ZODIAC (
      zodiac_id INTEGER PRIMARY KEY AUTOINCREMENT,
      zodiac_name TEXT NOT NULL UNIQUE,
      element TEXT NOT NULL,
      symbol TEXT,
      date_range TEXT,
      start_month INTEGER,
      start_day INTEGER,
      end_month INTEGER,
      end_day INTEGER
    );

    CREATE TABLE IF NOT EXISTS HOROSCOPES (
      horoscope_id INTEGER PRIMARY KEY AUTOINCREMENT,
      zodiac_id INTEGER NOT NULL UNIQUE,
      overall TEXT NOT NULL,
      study TEXT NOT NULL,
      work TEXT NOT NULL,
      love TEXT NOT NULL,
      FOREIGN KEY (zodiac_id) REFERENCES ZODIAC(zodiac_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS USERS (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      zodiac_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (zodiac_id) REFERENCES ZODIAC(zodiac_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS TAROT_CARDS (
      card_id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_name TEXT NOT NULL,
      arcana_type TEXT DEFAULT 'Major Arcana',
      meaning TEXT NOT NULL,
      image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS TAROT_READINGS (
      reading_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_id INTEGER NOT NULL,
      reading_date DATETIME NOT NULL,
      question TEXT DEFAULT 'General Reading',
      FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES TAROT_CARDS(card_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS READING_AUDIT_LOGS (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      reading_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      card_id INTEGER NOT NULL,
      logged_at DATETIME NOT NULL,
      action_note TEXT DEFAULT 'Card drawn & session logged'
    );

    CREATE TABLE IF NOT EXISTS DAILY_PREDICTIONS (
      daily_prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER,
      message TEXT NOT NULL,
      FOREIGN KEY (card_id) REFERENCES TAROT_CARDS(card_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS USER_DAILY_PREDICTIONS (
      open_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      daily_prediction_id INTEGER NOT NULL,
      opened_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
      FOREIGN KEY (daily_prediction_id) REFERENCES DAILY_PREDICTIONS(daily_prediction_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS NUMEROLOGY (
      result_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      life_path_number INTEGER NOT NULL,
      meaning TEXT NOT NULL,
      calculated_date DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
    );
  `);

  // 2. Triggers:
  // Trigger 1A: Auto-assign Zodiac ID on INSERT of USER
  // Trigger 1B: Auto-update Zodiac ID on UPDATE of USER birth_date
  // Trigger 2: Auto-log reading into READING_AUDIT_LOGS
  db.exec(`
    DROP TRIGGER IF EXISTS trg_assign_zodiac_before_insert;
    CREATE TRIGGER trg_assign_zodiac_before_insert
    AFTER INSERT ON USERS
    FOR EACH ROW
    WHEN NEW.birth_date IS NOT NULL
    BEGIN
      UPDATE USERS
      SET zodiac_id = fn_get_zodiac_id(NEW.birth_date)
      WHERE user_id = NEW.user_id;
    END;

    DROP TRIGGER IF EXISTS trg_assign_zodiac_before_update;
    CREATE TRIGGER trg_assign_zodiac_before_update
    AFTER UPDATE OF birth_date ON USERS
    FOR EACH ROW
    WHEN NEW.birth_date IS NOT NULL
    BEGIN
      UPDATE USERS
      SET zodiac_id = fn_get_zodiac_id(NEW.birth_date)
      WHERE user_id = NEW.user_id;
    END;

    DROP TRIGGER IF EXISTS trg_after_tarot_reading_insert;
    CREATE TRIGGER trg_after_tarot_reading_insert
    AFTER INSERT ON TAROT_READINGS
    FOR EACH ROW
    BEGIN
      INSERT INTO READING_AUDIT_LOGS (reading_id, user_id, card_id, logged_at, action_note)
      VALUES (NEW.reading_id, NEW.user_id, NEW.card_id, NEW.reading_date, 'Tarot reading auto-logged for card ' || NEW.card_id);
    END;
  `);

  // 3. Seed default Zodiacs if empty
  const countZodiac = db.prepare('SELECT COUNT(*) as cnt FROM ZODIAC').get().cnt;
  if (countZodiac === 0) {
    const zodiacs = [
      [1, 'Aries', 'Fire', '♈', 'Mar 21 - Apr 19', 3, 21, 4, 19],
      [2, 'Taurus', 'Earth', '♉', 'Apr 20 - May 20', 4, 20, 5, 20],
      [3, 'Gemini', 'Air', '♊', 'May 21 - Jun 20', 5, 21, 6, 20],
      [4, 'Cancer', 'Water', '♋', 'Jun 21 - Jul 22', 6, 21, 7, 22],
      [5, 'Leo', 'Fire', '♌', 'Jul 23 - Aug 22', 7, 23, 8, 22],
      [6, 'Virgo', 'Earth', '♍', 'Aug 23 - Sep 22', 8, 23, 9, 22],
      [7, 'Libra', 'Air', '♎', 'Sep 23 - Oct 22', 9, 23, 10, 22],
      [8, 'Scorpio', 'Water', '♏', 'Oct 23 - Nov 21', 10, 23, 11, 21],
      [9, 'Sagittarius', 'Fire', '♐', 'Nov 22 - Dec 21', 11, 22, 12, 21],
      [10, 'Capricorn', 'Earth', '♑', 'Dec 22 - Jan 19', 12, 22, 1, 19],
      [11, 'Aquarius', 'Air', '♒', 'Jan 20 - Feb 18', 1, 20, 2, 18],
      [12, 'Pisces', 'Water', '♓', 'Feb 19 - Mar 20', 2, 19, 3, 20]
    ];
    const insZ = db.prepare('INSERT INTO ZODIAC (zodiac_id, zodiac_name, element, symbol, date_range, start_month, start_day, end_month, end_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    zodiacs.forEach(z => insZ.run(...z));

    const horoscopes = [
      [1, 'Dynamic phase filled with passionate initiatives. Trust your instincts, brave feline!', 'Quick comprehension gives you a big advantage; avoid rushing assignments.', 'High energy and natural leadership allow you to conquer stalled initiatives.', 'Sparkling warmth and playful attraction keep romantic connections exciting.'],
      [2, 'A steady, harmonious period bringing grounding stability and sensory delights.', 'Diligent review and structured time-blocking help you master complex subjects.', 'Patience and methodical efforts yield solid professional recognition.', 'Sensual honesty and unwavering loyalty deepen emotional bonds.'],
      [3, 'Curiosity and intellect shine brightly. Expect lively conversations and sudden inspirations.', 'Versatile thinking lets you connect disparate ideas effortlessly.', 'Superb communication skills open up collaborative prospects and creative networking wins.', 'Witty banter and shared laughs reignite affectionate chemistry.'],
      [4, 'Intuitive, emotionally rich cycle allowing you to nurture dreams and cozy sanctuaries.', 'Creative retention is strong when studying in peaceful environments.', 'Empathy and attentive instincts guide you to navigate team dynamics smoothly.', 'Heartfelt vulnerability and caring gestures bring intimate warmth.'],
      [5, 'Radiant confidence and magnetic charisma make you the center of vibrant adventures.', 'Approaching learning as an inspiring presentation maximizes your retention.', 'Visionary leadership shines; others are naturally drawn to your encouragement.', 'Generous romance and bold expressions of admiration make sparks fly high.'],
      [6, 'An efficient, clarifying period where fine details effortlessly align.', 'Methodical notes and targeted practice guarantee excellence in exams.', 'Analytical finesse and organization let you streamline complex workflows.', 'Thoughtful acts of daily kindness express profound care and commitment.'],
      [7, 'Balance, aesthetic harmony, and diplomatic charm guide all your endeavors.', 'Study groups and balanced schedules keep stress far away.', 'Negotiation, aesthetic projects, and collaborative partnerships thrive.', 'Sweet romantic serenity and sincere understanding blossom in companionship.'],
      [8, 'Transformative, deeply perceptive time where mysterious insights unlock solutions.', 'Deep-dive investigative research uncovers profound conceptual answers.', 'Laser-focused determination helps you solve issues others overlooked.', 'Magnetic intensity and passionate authenticity bring soulful bonding.'],
      [9, 'Expansive cycle calling for bold exploration, joyful philosophical wisdom, and optimism.', 'Learning foreign topics or broader concepts captivates your imagination.', 'Big-picture strategic views inspire colleagues and launch exciting new ventures.', 'Playful adventures and freedom-loving honesty keep romance wonderfully refreshing.'],
      [10, 'Resolute period of disciplined accomplishment and long-term milestone construction.', 'Disciplined revision and structured study plans guarantee substantial academic mastery.', 'Strategic patience and steady determination earn you respect and authority.', 'Solid, steadfast loyalty and supportive presence speak louder than fleeting words.'],
      [11, 'Innovative breakthroughs and original thinking illuminate forward-looking horizons.', 'Tech-enabled learning and experimental ideas ignite profound breakthroughs.', 'Unconventional approaches provide ingenious solutions to longstanding roadblocks.', 'Intellectual intimacy and deep mutual respect form heartwarming bonds.'],
      [12, 'Pisces is entering a period of growth, self-discovery, and new beginnings. Your creativity and understanding of others are strengths that can help you move forward. Stay open to new opportunities while keeping your plans clear.', 'This is a good time to develop your knowledge and explore subjects that interest you. You may feel more motivated when studying something you enjoy. Plan your study time carefully and avoid leaving assignments until the last minute.', 'You may have opportunities to work on new projects that allow you to use your creativity. Your understanding of others and teamwork skills can help things go smoothly. Try to prioritize your tasks and avoid taking on too much work at once.', 'Gentle empathy, sweet spiritual connection, and sincere tenderness create pure romance.']
    ];
    const insH = db.prepare('INSERT INTO HOROSCOPES (zodiac_id, overall, study, work, love) VALUES (?, ?, ?, ?, ?)');
    horoscopes.forEach(h => insH.run(...h));
  }

  // 4. Seed Tarot Cards if empty
  const countCards = db.prepare('SELECT COUNT(*) as cnt FROM TAROT_CARDS').get().cnt;
  if (countCards === 0) {
    const cards = [
      ['The Fool', 'Major Arcana', 'New beginnings, innocence, spontaneity, and a free spirit. Take a leap of faith into new adventures with the playful curiosity of a cat!', '/assets/cards/card_0.svg'],
      ['The Magician', 'Major Arcana', 'Manifestation, resourcefulness, power, and inspired action. You possess all the mystical tools you need to create your desired reality.', '/assets/cards/card_1.svg'],
      ['The High Priestess', 'Major Arcana', 'Intuition, sacred knowledge, divine feminine, and the subconscious mind. Listen to the quiet whisper of your mystical inner voice.', '/assets/cards/card_2.svg'],
      ['The Empress', 'Major Arcana', 'This card encourages you to take care of yourself and what you value, trust the process, and allow things to develop with patience and care.', '/assets/cards/card_3.svg'],
      ['The Emperor', 'Major Arcana', 'Authority, structure, stability, and protective leadership. Establish solid boundaries and order in your kingdom.', '/assets/cards/card_4.svg'],
      ['The Hierophant', 'Major Arcana', 'Spiritual wisdom, tradition, institutions, and mentorship. Seek guidance from ancestral wisdom and trusted traditions.', '/assets/cards/card_5.svg'],
      ['The Lovers', 'Major Arcana', 'Love, harmony, partnerships, and values alignment. Meaningful soul choices and affectionate bonds bring happiness.', '/assets/cards/card_6.svg'],
      ['The Chariot', 'Major Arcana', 'Control, willpower, success, and determination. Stay focused and driven toward your highest ambition with relentless zeal.', '/assets/cards/card_7.svg'],
      ['Strength', 'Major Arcana', 'Courage, persuasion, compassion, and gentle influence. True power comes not from force, but from inner calmness and gentle grace.', '/assets/cards/card_8.svg'],
      ['The Hermit', 'Major Arcana', 'Soul-searching, introspection, solitude, and inner guidance. Step back to illuminate your personal path with contemplative silence.', '/assets/cards/card_9.svg'],
      ['Wheel of Fortune', 'Major Arcana', 'Good luck, karma, life cycles, and destiny. The cosmic wheel turns in your favor; welcome divine timing and positive shifts.', '/assets/cards/card_10.svg'],
      ['Justice', 'Major Arcana', 'Fairness, truth, cause and effect, and ethical clarity. Decisions will be balanced with karmic precision and honesty.', '/assets/cards/card_11.svg'],
      ['The Hanged Man', 'Major Arcana', 'Surrender, letting go, new perspectives, and pause. Wisdom comes when you view the world from an unexpected angle.', '/assets/cards/card_12.svg'],
      ['Death & Rebirth', 'Major Arcana', 'Endings, major transformation, transitions, and shedding the old to invite dazzling fresh blooms.', '/assets/cards/card_13.svg'],
      ['Temperance', 'Major Arcana', 'Balance, moderation, patience, and purpose. Blending diverse elements into a serene potion of harmony.', '/assets/cards/card_14.svg'],
      ['The Star', 'Major Arcana', 'Hope, faith, renewal, inspiration, and spiritual blessings. A bright guiding light shines over your most heartfelt wishes.', '/assets/cards/card_15.svg'],
      ['The Moon', 'Major Arcana', 'Illusion, fear, anxiety, subconscious intuition, and mystical dreaming. Trust your night senses through murky waters.', '/assets/cards/card_16.svg'],
      ['The Sun', 'Major Arcana', 'Positivity, fun, warmth, success, and vitality. Radiant joy and abundant happiness illuminate every corner of your life!', '/assets/cards/card_17.svg'],
      ['Judgement', 'Major Arcana', 'Awakening, rebirth, inner calling, and absolution. Heed your higher purpose and rise into renewed clarity.', '/assets/cards/card_18.svg'],
      ['The World', 'Major Arcana', 'Completion, integration, accomplishment, and travel. A grand cycle finishes in triumphant fulfillment and wholeness.', '/assets/cards/card_19.svg'],
      ['Queen of Wands', 'Major Arcana', 'This card is a positive sign of self-confidence, leadership, and pursuing your goals with enthusiasm. It encourages you to believe in yourself, show your true personality, and take the initiative rather than waiting for others to make the first move.', '/assets/cards/card_20.svg'],
      ['Ace of Cups', 'Major Arcana', 'Overwhelming love, compassion, creative fertility, and spiritual peace. Your emotional vessel overflows with sweet blessings.', '/assets/cards/card_21.svg']
    ];
    const insC = db.prepare('INSERT INTO TAROT_CARDS (card_name, arcana_type, meaning, image) VALUES (?, ?, ?, ?)');
    cards.forEach(c => insC.run(...c));
  }

  // 5. Seed Daily Predictions if empty
  const countPreds = db.prepare('SELECT COUNT(*) as cnt FROM DAILY_PREDICTIONS').get().cnt;
  if (countPreds === 0) {
    const preds = [
      [4, 'This card encourages you to take care of yourself and what you value, trust the process, and allow things to develop with patience and care.'],
      [18, 'A surge of bright optimism and warm vitality awaits you today. Celebrate small victories and share your sunshine with everyone around.'],
      [16, 'Keep hope alive today. Serendipitous synchronicities are gently nudging you toward your fondest dreams.'],
      [2, 'Focus your intent and manifest your goals. Today is the perfect day to begin that project you have been envisioning.'],
      [11, 'A delightful turn of events brings pleasant surprises. Stay adaptable and ride the cosmic wave with a smile.'],
      [9, 'Gentle persuasion and compassionate patience will conquer any obstacle you face today. Trust your quiet inner power.'],
      [21, 'This card is a positive sign of self-confidence, leadership, and pursuing your goals with enthusiasm. Take the initiative today!']
    ];
    const insP = db.prepare('INSERT INTO DAILY_PREDICTIONS (card_id, message) VALUES (?, ?)');
    preds.forEach(p => insP.run(...p));
  }
}

initDatabase();

module.exports = {
  db,
  fnGetZodiacId,
  spCalculateLifePath
};
