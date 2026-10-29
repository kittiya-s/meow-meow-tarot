const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'meow_tarot.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDb() {
  // Create tables according to Physical ERD & Data Dictionary
  db.exec(`
    CREATE TABLE IF NOT EXISTS ZODIAC (
      zodiac_id INTEGER PRIMARY KEY AUTOINCREMENT,
      zodiac_name TEXT NOT NULL UNIQUE,
      element TEXT NOT NULL,
      symbol TEXT,
      date_range TEXT
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
      FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES TAROT_CARDS(card_id) ON DELETE CASCADE
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

  // Seed default Zodiacs if empty
  const zodiacCount = db.prepare('SELECT COUNT(*) as count FROM ZODIAC').get().count;
  if (zodiacCount === 0) {
    const zodiacs = [
      { name: 'Aries', element: 'Fire', symbol: '♈', range: 'Mar 21 - Apr 19' },
      { name: 'Taurus', element: 'Earth', symbol: '♉', range: 'Apr 20 - May 20' },
      { name: 'Gemini', element: 'Air', symbol: '♊', range: 'May 21 - Jun 20' },
      { name: 'Cancer', element: 'Water', symbol: '♋', range: 'Jun 21 - Jul 22' },
      { name: 'Leo', element: 'Fire', symbol: '♌', range: 'Jul 23 - Aug 22' },
      { name: 'Virgo', element: 'Earth', symbol: '♍', range: 'Aug 23 - Sep 22' },
      { name: 'Libra', element: 'Air', symbol: '♎', range: 'Sep 23 - Oct 22' },
      { name: 'Scorpio', element: 'Water', symbol: '♏', range: 'Oct 23 - Nov 21' },
      { name: 'Sagittarius', element: 'Fire', symbol: '♐', range: 'Nov 22 - Dec 21' },
      { name: 'Capricorn', element: 'Earth', symbol: '♑', range: 'Dec 22 - Jan 19' },
      { name: 'Aquarius', element: 'Air', symbol: '♒', range: 'Jan 20 - Feb 18' },
      { name: 'Pisces', element: 'Water', symbol: '♓', range: 'Feb 19 - Mar 20' }
    ];

    const insertZodiac = db.prepare('INSERT INTO ZODIAC (zodiac_name, element, symbol, date_range) VALUES (?, ?, ?, ?)');
    const insertHoroscope = db.prepare('INSERT INTO HOROSCOPES (zodiac_id, overall, study, work, love) VALUES (?, ?, ?, ?, ?)');

    const horoscopeTemplates = {
      'Aries': {
        overall: 'A dynamic phase filled with passionate initiatives and fiery breakthroughs. Trust your instincts, brave feline!',
        work: 'High energy and natural leadership allow you to conquer stalled initiatives and pitch fresh concepts.',
        study: 'Quick comprehension gives you a big advantage, but ensure you finish assignments thoroughly without rushing.',
        love: 'Sparkling warmth and playful attraction keep romantic connections exciting.'
      },
      'Taurus': {
        overall: 'A steady, harmonious period bringing grounding stability, sensory delights, and cozy contentment.',
        work: 'Patience and methodical efforts yield solid professional progress and reliability recognition.',
        study: 'Diligent review and structured time-blocking help you master complex subjects with ease.',
        love: 'Sensual honesty and unwavering loyalty deepen emotional bonds and mutual comfort.'
      },
      'Gemini': {
        overall: 'Your curiosity and intellect shine brightly. Expect lively conversations and sudden inspirations.',
        work: 'Superb communication skills open up collaborative prospects and creative networking wins.',
        study: 'Versatile thinking lets you connect disparate ideas effortlessly; keep distractions at bay.',
        love: 'Witty banter and shared laughs reignite affectionate chemistry.'
      },
      'Cancer': {
        overall: 'An intuitive, emotionally rich cycle allowing you to nurture your dreams and create comforting sanctuaries.',
        work: 'Empathy and attentive instincts guide you to navigate team dynamics and subtle requirements smoothly.',
        study: 'Creative retention is strong when studying in peaceful, emotionally supportive environments.',
        love: 'Heartfelt vulnerability and caring gestures bring intimate warmth closer than ever.'
      },
      'Leo': {
        overall: 'Radiant confidence and magnetic charisma make you the center of vibrant adventures.',
        work: 'Your visionary leadership shines; others are naturally drawn to your encouragement and flair.',
        study: 'Approaching learning as an inspiring presentation or creative project maximizes your retention.',
        love: 'Generous romance and bold expressions of admiration make sparks fly high.'
      },
      'Virgo': {
        overall: 'An efficient, clarifying period where fine details effortlessly align into a magnificent bigger picture.',
        work: 'Analytical finesse and organization let you streamline complex workflows with poise.',
        study: 'Methodical notes and targeted practice guarantee excellence in exams and research.',
        love: 'Thoughtful acts of daily kindness express profound care and devoted commitment.'
      },
      'Libra': {
        overall: 'Balance, aesthetic harmony, and diplomatic charm guide all your endeavors toward peaceful grace.',
        work: 'Negotiation, aesthetic projects, and collaborative partnerships thrive under your guidance.',
        study: 'Study groups and balanced schedules keep stress far away and productivity high.',
        love: 'Sweet romantic serenity and sincere understanding blossom in peaceful companionship.'
      },
      'Scorpio': {
        overall: 'A transformative, deeply perceptive time where mysterious insights unlock powerful solutions.',
        work: 'Laser-focused determination helps you solve issues others overlooked and claim rightful achievements.',
        study: 'Deep-dive investigative research uncovers profound conceptual answers.',
        love: 'Magnetic intensity and passionate authenticity bring soulful emotional bonding.'
      },
      'Sagittarius': {
        overall: 'An expansive cycle calling for bold exploration, joyful philosophical wisdom, and optimism.',
        work: 'Big-picture strategic views inspire colleagues and launch exciting new ventures.',
        study: 'Learning foreign topics or broader concepts captivates your imagination effortlessly.',
        love: 'Playful adventures and freedom-loving honesty keep romance wonderfully refreshing.'
      },
      'Capricorn': {
        overall: 'A resolute period of disciplined accomplishment, ambition, and long-term milestone construction.',
        work: 'Strategic patience and steady determination earn you well-deserved respect and authority.',
        study: 'Disciplined revision and structured study plans guarantee substantial academic mastery.',
        love: 'Solid, steadfast loyalty and supportive presence speak louder than fleeting words.'
      },
      'Aquarius': {
        overall: 'Innovative breakthroughs and original thinking illuminate forward-looking horizons.',
        work: 'Unconventional approaches provide ingenious solutions to longstanding roadblocks.',
        study: 'Tech-enabled learning and experimental ideas ignite profound breakthroughs.',
        love: 'Intellectual intimacy and deep mutual respect form heartwarming, eccentric bonds.'
      },
      'Pisces': {
        overall: 'Pisces is entering a period of growth, self-discovery, and new beginnings. Your creativity and understanding of others are strengths that can help you move forward. Stay open to new opportunities while keeping your plans clear.',
        work: 'You may have opportunities to work on new projects that allow you to use your creativity. Your understanding of others and teamwork skills can help things go smoothly. Try to prioritize your tasks and avoid taking on too much work at once.',
        study: 'This is a good time to develop your knowledge and explore subjects that interest you. You may feel more motivated when studying something you enjoy. Plan your study time carefully and avoid leaving assignments until the last minute.',
        love: 'Gentle empathy, sweet spiritual connection, and sincere tenderness create pure romance.'
      }
    };

    zodiacs.forEach(z => {
      const info = insertZodiac.run(z.name, z.element, z.symbol, z.range);
      const zodiacId = info.lastInsertRowid;
      const h = horoscopeTemplates[z.name];
      insertHoroscope.run(zodiacId, h.overall, h.study, h.work, h.love);
    });
  }

  // Seed Tarot Cards if empty
  const cardCount = db.prepare('SELECT COUNT(*) as count FROM TAROT_CARDS').get().count;
  if (cardCount === 0) {
    const tarotCards = [
      {
        name: 'The Fool',
        meaning: 'New beginnings, innocence, spontaneity, and a free spirit. Take a leap of faith into new adventures with the playful curiosity of a cat!',
        image: 'the_fool.svg'
      },
      {
        name: 'The Magician',
        meaning: 'Manifestation, resourcefulness, power, and inspired action. You possess all the mystical tools you need to create your desired reality.',
        image: 'the_magician.svg'
      },
      {
        name: 'The High Priestess',
        meaning: 'Intuition, sacred knowledge, divine feminine, and the subconscious mind. Listen to the quiet whisper of your mystical inner voice.',
        image: 'the_high_priestess.svg'
      },
      {
        name: 'The Empress',
        meaning: 'This card encourages you to take care of yourself and what you value, trust the process, and allow things to develop with patience and care.',
        image: 'the_empress.svg'
      },
      {
        name: 'The Emperor',
        meaning: 'Authority, structure, stability, and protective leadership. Establish solid boundaries and order in your kingdom.',
        image: 'the_emperor.svg'
      },
      {
        name: 'The Hierophant',
        meaning: 'Spiritual wisdom, tradition, institutions, and mentorship. Seek guidance from ancestral wisdom and trusted traditions.',
        image: 'the_hierophant.svg'
      },
      {
        name: 'The Lovers',
        meaning: 'Love, harmony, partnerships, and values alignment. Meaningful soul choices and affectionate bonds bring happiness.',
        image: 'the_lovers.svg'
      },
      {
        name: 'The Chariot',
        meaning: 'Control, willpower, success, and determination. Stay focused and driven toward your highest ambition with relentless zeal.',
        image: 'the_chariot.svg'
      },
      {
        name: 'Strength',
        meaning: 'Courage, persuasion, compassion, and gentle influence. True power comes not from force, but from inner calmness and gentle grace.',
        image: 'strength.svg'
      },
      {
        name: 'The Hermit',
        meaning: 'Soul-searching, introspection, solitude, and inner guidance. Step back to illuminate your personal path with contemplative silence.',
        image: 'the_hermit.svg'
      },
      {
        name: 'Wheel of Fortune',
        meaning: 'Good luck, karma, life cycles, and destiny. The cosmic wheel turns in your favor; welcome divine timing and positive shifts.',
        image: 'wheel_of_fortune.svg'
      },
      {
        name: 'Justice',
        meaning: 'Fairness, truth, cause and effect, and ethical clarity. Decisions will be balanced with karmic precision and honesty.',
        image: 'justice.svg'
      },
      {
        name: 'The Hanged Man',
        meaning: 'Surrender, letting go, new perspectives, and pause. Wisdom comes when you view the world from an unexpected angle.',
        image: 'the_hanged_man.svg'
      },
      {
        name: 'Death & Rebirth',
        meaning: 'Endings, major transformation, transitions, and shedding the old to invite dazzling fresh blooms.',
        image: 'death.svg'
      },
      {
        name: 'Temperance',
        meaning: 'Balance, moderation, patience, and purpose. Blending diverse elements into a serene potion of harmony.',
        image: 'temperance.svg'
      },
      {
        name: 'The Star',
        meaning: 'Hope, faith, renewal, inspiration, and spiritual blessings. A bright guiding light shines over your most heartfelt wishes.',
        image: 'the_star.svg'
      },
      {
        name: 'The Moon',
        meaning: 'Illusion, fear, anxiety, subconscious intuition, and mystical dreaming. Trust your night senses through murky waters.',
        image: 'the_moon.svg'
      },
      {
        name: 'The Sun',
        meaning: 'Positivity, fun, warmth, success, and vitality. Radiant joy and abundant happiness illuminate every corner of your life!',
        image: 'the_sun.svg'
      },
      {
        name: 'Judgement',
        meaning: 'Awakening, rebirth, inner calling, and absolution. Heed your higher purpose and rise into renewed clarity.',
        image: 'judgement.svg'
      },
      {
        name: 'The World',
        meaning: 'Completion, integration, accomplishment, and travel. A grand cycle finishes in triumphant fulfillment and wholeness.',
        image: 'the_world.svg'
      },
      {
        name: 'Queen of Wands',
        meaning: 'This card is a positive sign of self-confidence, leadership, and pursuing your goals with enthusiasm. It encourages you to believe in yourself, show your true personality, and take the initiative rather than waiting for others to make the first move.',
        image: 'queen_of_wands.svg'
      },
      {
        name: 'Ace of Cups',
        meaning: 'Overwhelming love, compassion, creative fertility, and spiritual peace. Your emotional vessel overflows with sweet blessings.',
        image: 'ace_of_cups.svg'
      }
    ];

    const insertCard = db.prepare('INSERT INTO TAROT_CARDS (card_name, meaning, image) VALUES (?, ?, ?)');
    tarotCards.forEach(c => {
      insertCard.run(c.name, c.meaning, c.image);
    });
  }

  // Seed Daily Predictions if empty
  const dailyCount = db.prepare('SELECT COUNT(*) as count FROM DAILY_PREDICTIONS').get().count;
  if (dailyCount === 0) {
    const predictions = [
      {
        cardName: 'The Empress',
        message: 'This card encourages you to take care of yourself and what you value, trust the process, and allow things to develop with patience and care.'
      },
      {
        cardName: 'The Sun',
        message: 'A surge of bright optimism and warm vitality awaits you today. Celebrate small victories and share your sunshine with everyone around.'
      },
      {
        cardName: 'The Star',
        message: 'Keep hope alive today. Serendipitous synchronicities are gently nudging you toward your fondest dreams.'
      },
      {
        cardName: 'The Magician',
        message: 'Focus your intent and manifest your goals. Today is the perfect day to begin that project you have been envisioning.'
      },
      {
        cardName: 'Wheel of Fortune',
        message: 'A delightful turn of events brings pleasant surprises. Stay adaptable and ride the cosmic wave with a smile.'
      },
      {
        cardName: 'Strength',
        message: 'Gentle persuasion and compassionate patience will conquer any obstacle you face today. Trust your quiet inner power.'
      },
      {
        cardName: 'Queen of Wands',
        message: 'This card is a positive sign of self-confidence, leadership, and pursuing your goals with enthusiasm. Take the initiative today!'
      }
    ];

    const insertPred = db.prepare('INSERT INTO DAILY_PREDICTIONS (card_id, message) VALUES (?, ?)');
    predictions.forEach(p => {
      const card = db.prepare('SELECT card_id FROM TAROT_CARDS WHERE card_name = ?').get(p.cardName);
      const cardId = card ? card.card_id : 1;
      insertPred.run(cardId, p.message);
    });
  }
}

initDb();

module.exports = db;
