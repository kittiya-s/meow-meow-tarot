-- RESET SCRIPT: drops and rebuilds meow_meow_tarot with tables, SP, triggers and demo data
-- Generated from schema.sql + sample_data.sql + demo_seed.sql. Run the whole file (lightning bolt).

-- =======================================================
-- Meow Meow Tarot: MySQL / MariaDB Schema, SPs & Triggers
-- CSS326 Database Design & Implementation (Lab 10 MVC)
-- =======================================================

CREATE DATABASE IF NOT EXISTS meow_meow_tarot;
USE meow_meow_tarot;

-- Drop existing tables to allow clean reload if needed
DROP TRIGGER IF EXISTS trg_assign_zodiac_before_insert;
DROP TRIGGER IF EXISTS trg_assign_zodiac_before_update;
DROP TRIGGER IF EXISTS trg_after_tarot_reading_insert;
DROP PROCEDURE IF EXISTS sp_calculate_life_path;
DROP PROCEDURE IF EXISTS sp_get_or_assign_zodiac;
DROP FUNCTION IF EXISTS fn_get_zodiac_id;

DROP TABLE IF EXISTS NUMEROLOGY;
DROP TABLE IF EXISTS USER_DAILY_PREDICTIONS;
DROP TABLE IF EXISTS DAILY_PREDICTIONS;
DROP TABLE IF EXISTS READING_AUDIT_LOGS;
DROP TABLE IF EXISTS TAROT_READINGS;
DROP TABLE IF EXISTS TAROT_CARDS;
DROP TABLE IF EXISTS HOROSCOPES;
DROP TABLE IF EXISTS USERS;
DROP TABLE IF EXISTS ZODIAC;

-- 1. ZODIAC Table
CREATE TABLE ZODIAC (
    zodiac_id INT AUTO_INCREMENT PRIMARY KEY,
    zodiac_name VARCHAR(50) NOT NULL UNIQUE,
    element VARCHAR(50) NOT NULL,
    symbol VARCHAR(10),
    date_range VARCHAR(50),
    start_month INT NOT NULL,
    start_day INT NOT NULL,
    end_month INT NOT NULL,
    end_day INT NOT NULL
);

-- 2. HOROSCOPES Table (1:1 with ZODIAC)
CREATE TABLE HOROSCOPES (
    horoscope_id INT AUTO_INCREMENT PRIMARY KEY,
    zodiac_id INT NOT NULL UNIQUE,
    overall TEXT NOT NULL,
    study TEXT NOT NULL,
    work TEXT NOT NULL,
    love TEXT NOT NULL,
    FOREIGN KEY (zodiac_id) REFERENCES ZODIAC(zodiac_id) ON DELETE CASCADE
);

-- 3. USERS Table (N:1 with ZODIAC)
CREATE TABLE USERS (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    zodiac_id INT DEFAULT NULL,
    role ENUM('user', 'admin', 'developer') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zodiac_id) REFERENCES ZODIAC(zodiac_id) ON DELETE SET NULL
);

-- 4. TAROT_CARDS Table
CREATE TABLE TAROT_CARDS (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    card_name VARCHAR(100) NOT NULL,
    arcana_type VARCHAR(50) DEFAULT 'Major Arcana',
    meaning TEXT NOT NULL,
    image VARCHAR(255) NOT NULL
);

-- 5. TAROT_READINGS Table (1:N with USERS, N:1 with TAROT_CARDS)
CREATE TABLE TAROT_READINGS (
    reading_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    card_id INT NOT NULL,
    reading_date DATETIME NOT NULL,
    question VARCHAR(255) DEFAULT 'General Reading',
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES TAROT_CARDS(card_id) ON DELETE CASCADE
);

-- Extra Audit / History Table for Trigger verification
CREATE TABLE READING_AUDIT_LOGS (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    reading_id INT NOT NULL,
    user_id INT NOT NULL,
    card_id INT NOT NULL,
    logged_at DATETIME NOT NULL,
    action_note VARCHAR(255) DEFAULT 'Card drawn & session logged'
);

-- 6. DAILY_PREDICTIONS Table (Pool of daily messages)
CREATE TABLE DAILY_PREDICTIONS (
    daily_prediction_id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT,
    message TEXT NOT NULL,
    FOREIGN KEY (card_id) REFERENCES TAROT_CARDS(card_id) ON DELETE SET NULL
);

-- 7. USER_DAILY_PREDICTIONS Table (M:N tracking between USERS and DAILY_PREDICTIONS)
CREATE TABLE USER_DAILY_PREDICTIONS (
    open_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    daily_prediction_id INT NOT NULL,
    opened_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (daily_prediction_id) REFERENCES DAILY_PREDICTIONS(daily_prediction_id) ON DELETE CASCADE
);

-- 8. NUMEROLOGY Table (1:N with USERS)
CREATE TABLE NUMEROLOGY (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    life_path_number INT NOT NULL,
    meaning TEXT NOT NULL,
    calculated_date DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

-- =======================================================
-- FUNCTIONS & STORED PROCEDURES
-- =======================================================

DELIMITER $$

-- Function: Map birth_date to Zodiac ID
CREATE FUNCTION fn_get_zodiac_id(b_date DATE)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE m INT;
    DECLARE d INT;
    DECLARE zid INT;

    SET m = MONTH(b_date);
    SET d = DAY(b_date);

    IF (m = 3 AND d >= 21) OR (m = 4 AND d <= 19) THEN SELECT zodiac_id INTO zid FROM ZODIAC WHERE zodiac_name = 'Aries' LIMIT 1;
    ELSEIF (m = 4 AND d >= 20) OR (m = 5 AND d <= 20) THEN SELECT zodiac_id INTO zid FROM ZODIAC WHERE zodiac_name = 'Taurus' LIMIT 1;
    ELSEIF (m = 5 AND d >= 21) OR (m = 6 AND d <= 20) THEN SELECT zodiac_id INTO zid FROM ZODIAC WHERE zodiac_name = 'Gemini' LIMIT 1;
    ELSEIF (m = 6 AND d >= 21) OR (m = 7 AND d <= 22) THEN SELECT zodiac_id INTO zid FROM ZODIAC WHERE zodiac_name = 'Cancer' LIMIT 1;
    ELSEIF (m = 7 AND d >= 23) OR (m = 8 AND d <= 22) THEN SELECT zodiac_id INTO zid FROM ZODIAC WHERE zodiac_name = 'Leo' LIMIT 1;
    ELSEIF (m = 8 AND d >= 23) OR (m = 9 AND d <= 22) THEN SELECT zodiac_id INTO zid FROM ZODIAC WHERE zodiac_name = 'Virgo' LIMIT 1;
    ELSEIF (m = 9 AND d >= 23) OR (m = 10 AND d <= 22) THEN SELECT zodiac_id INTO zid FROM ZODIAC WHERE zodiac_name = 'Libra' LIMIT 1;
    ELSEIF (m = 10 AND d >= 23) OR (m = 11 AND d <= 21) THEN SELECT zodiac_id INTO zid FROM ZODIAC WHERE zodiac_name = 'Scorpio' LIMIT 1;
    ELSEIF (m = 11 AND d >= 22) OR (m = 12 AND d <= 21) THEN SELECT zodiac_id INTO zid FROM ZODIAC WHERE zodiac_name = 'Sagittarius' LIMIT 1;
    ELSEIF (m = 12 AND d >= 22) OR (m = 1 AND d <= 19) THEN SELECT zodiac_id INTO zid FROM ZODIAC WHERE zodiac_name = 'Capricorn' LIMIT 1;
    ELSEIF (m = 1 AND d >= 20) OR (m = 2 AND d <= 18) THEN SELECT zodiac_id INTO zid FROM ZODIAC WHERE zodiac_name = 'Aquarius' LIMIT 1;
    ELSE SELECT zodiac_id INTO zid FROM ZODIAC WHERE zodiac_name = 'Pisces' LIMIT 1;
    END IF;

    RETURN zid;
END$$

-- Stored Procedure: Calculate Life Path Number from birth_date
CREATE PROCEDURE sp_calculate_life_path(IN b_date DATE, OUT lpn INT)
BEGIN
    DECLARE str VARCHAR(30);
    DECLARE total INT DEFAULT 0;
    DECLARE idx INT DEFAULT 1;
    DECLARE len INT;

    -- Replace dashes to get digits only
    SET str = REPLACE(CAST(b_date AS CHAR), '-', '');
    SET len = CHAR_LENGTH(str);

    WHILE idx <= len DO
        SET total = total + CAST(SUBSTRING(str, idx, 1) AS UNSIGNED);
        SET idx = idx + 1;
    END WHILE;

    -- Keep compound 21 or master numbers (11, 22), otherwise reduce to single digit (1-9)
    WHILE total > 9 AND total NOT IN (11, 21, 22) DO
        SET str = CAST(total AS CHAR);
        SET len = CHAR_LENGTH(str);
        SET total = 0;
        SET idx = 1;
        WHILE idx <= len DO
            SET total = total + CAST(SUBSTRING(str, idx, 1) AS UNSIGNED);
            SET idx = idx + 1;
        END WHILE;
    END WHILE;

    SET lpn = total;
END$$

-- =======================================================
-- SQL TRIGGERS
-- =======================================================

-- Trigger 1: Auto-assign Zodiac ID to a new USER upon registration based on birth_date
CREATE TRIGGER trg_assign_zodiac_before_insert
BEFORE INSERT ON USERS
FOR EACH ROW
BEGIN
    IF NEW.birth_date IS NOT NULL THEN
        SET NEW.zodiac_id = fn_get_zodiac_id(NEW.birth_date);
    END IF;
END$$

CREATE TRIGGER trg_assign_zodiac_before_update
BEFORE UPDATE ON USERS
FOR EACH ROW
BEGIN
    IF NEW.birth_date IS NOT NULL AND (OLD.birth_date IS NULL OR NEW.birth_date <> OLD.birth_date) THEN
        SET NEW.zodiac_id = fn_get_zodiac_id(NEW.birth_date);
    END IF;
END$$

-- Trigger 2: Logging user reading history automatically into READING_AUDIT_LOGS
CREATE TRIGGER trg_after_tarot_reading_insert
AFTER INSERT ON TAROT_READINGS
FOR EACH ROW
BEGIN
    INSERT INTO READING_AUDIT_LOGS (reading_id, user_id, card_id, logged_at, action_note)
    VALUES (NEW.reading_id, NEW.user_id, NEW.card_id, NEW.reading_date, CONCAT('Tarot reading recorded for card ', NEW.card_id));
END$$

DELIMITER ;


-- Sample initial data for Meow Meow Tarot
USE meow_meow_tarot;

-- Insert Zodiacs
INSERT IGNORE INTO ZODIAC (zodiac_id, zodiac_name, element, symbol, date_range, start_month, start_day, end_month, end_day) VALUES
(1, 'Aries', 'Fire', '♈', 'Mar 21 - Apr 19', 3, 21, 4, 19),
(2, 'Taurus', 'Earth', '♉', 'Apr 20 - May 20', 4, 20, 5, 20),
(3, 'Gemini', 'Air', '♊', 'May 21 - Jun 20', 5, 21, 6, 20),
(4, 'Cancer', 'Water', '♋', 'Jun 21 - Jul 22', 6, 21, 7, 22),
(5, 'Leo', 'Fire', '♌', 'Jul 23 - Aug 22', 7, 23, 8, 22),
(6, 'Virgo', 'Earth', '♍', 'Aug 23 - Sep 22', 8, 23, 9, 22),
(7, 'Libra', 'Air', '♎', 'Sep 23 - Oct 22', 9, 23, 10, 22),
(8, 'Scorpio', 'Water', '♏', 'Oct 23 - Nov 21', 10, 23, 11, 21),
(9, 'Sagittarius', 'Fire', '♐', 'Nov 22 - Dec 21', 11, 22, 12, 21),
(10, 'Capricorn', 'Earth', '♑', 'Dec 22 - Jan 19', 12, 22, 1, 19),
(11, 'Aquarius', 'Air', '♒', 'Jan 20 - Feb 18', 1, 20, 2, 18),
(12, 'Pisces', 'Water', '♓', 'Feb 19 - Mar 20', 2, 19, 3, 20);

-- Insert Horoscopes
INSERT IGNORE INTO HOROSCOPES (horoscope_id, zodiac_id, overall, study, work, love) VALUES
(1, 1, 'Dynamic phase filled with passionate initiatives. Trust your instincts, brave feline!', 'Quick comprehension gives you a big advantage; avoid rushing assignments.', 'High energy and natural leadership allow you to conquer stalled initiatives.', 'Sparkling warmth and playful attraction keep romantic connections exciting.'),
(2, 2, 'A steady, harmonious period bringing grounding stability and sensory delights.', 'Diligent review and structured time-blocking help you master complex subjects.', 'Patience and methodical efforts yield solid professional recognition.', 'Sensual honesty and unwavering loyalty deepen emotional bonds.'),
(3, 3, 'Curiosity and intellect shine brightly. Expect lively conversations and sudden inspirations.', 'Versatile thinking lets you connect disparate ideas effortlessly.', 'Superb communication skills open up collaborative prospects and creative networking wins.', 'Witty banter and shared laughs reignite affectionate chemistry.'),
(4, 4, 'Intuitive, emotionally rich cycle allowing you to nurture dreams and cozy sanctuaries.', 'Creative retention is strong when studying in peaceful environments.', 'Empathy and attentive instincts guide you to navigate team dynamics smoothly.', 'Heartfelt vulnerability and caring gestures bring intimate warmth.'),
(5, 5, 'Radiant confidence and magnetic charisma make you the center of vibrant adventures.', 'Approaching learning as an inspiring presentation maximizes your retention.', 'Visionary leadership shines; others are naturally drawn to your encouragement.', 'Generous romance and bold expressions of admiration make sparks fly high.'),
(6, 6, 'An efficient, clarifying period where fine details effortlessly align.', 'Methodical notes and targeted practice guarantee excellence in exams.', 'Analytical finesse and organization let you streamline complex workflows.', 'Thoughtful acts of daily kindness express profound care and commitment.'),
(7, 7, 'Balance, aesthetic harmony, and diplomatic charm guide all your endeavors.', 'Study groups and balanced schedules keep stress far away.', 'Negotiation, aesthetic projects, and collaborative partnerships thrive.', 'Sweet romantic serenity and sincere understanding blossom in companionship.'),
(8, 8, 'Transformative, deeply perceptive time where mysterious insights unlock solutions.', 'Deep-dive investigative research uncovers profound conceptual answers.', 'Laser-focused determination helps you solve issues others overlooked.', 'Magnetic intensity and passionate authenticity bring soulful bonding.'),
(9, 9, 'Expansive cycle calling for bold exploration, joyful philosophical wisdom, and optimism.', 'Learning foreign topics or broader concepts captivates your imagination.', 'Big-picture strategic views inspire colleagues and launch exciting new ventures.', 'Playful adventures and freedom-loving honesty keep romance wonderfully refreshing.'),
(10, 10, 'Resolute period of disciplined accomplishment and long-term milestone construction.', 'Disciplined revision and structured study plans guarantee substantial academic mastery.', 'Strategic patience and steady determination earn you respect and authority.', 'Solid, steadfast loyalty and supportive presence speak louder than fleeting words.'),
(11, 11, 'Innovative breakthroughs and original thinking illuminate forward-looking horizons.', 'Tech-enabled learning and experimental ideas ignite profound breakthroughs.', 'Unconventional approaches provide ingenious solutions to longstanding roadblocks.', 'Intellectual intimacy and deep mutual respect form heartwarming bonds.'),
(12, 12, 'Pisces is entering a period of growth, self-discovery, and new beginnings. Your creativity and understanding of others are strengths that can help you move forward. Stay open to new opportunities while keeping your plans clear.', 'This is a good time to develop your knowledge and explore subjects that interest you. You may feel more motivated when studying something you enjoy. Plan your study time carefully and avoid leaving assignments until the last minute.', 'You may have opportunities to work on new projects that allow you to use your creativity. Your understanding of others and teamwork skills can help things go smoothly. Try to prioritize your tasks and avoid taking on too much work at once.', 'Gentle empathy, sweet spiritual connection, and sincere tenderness create pure romance.');

-- Insert Tarot Cards with clean, direct relative paths (/assets/cards/...)
INSERT IGNORE INTO TAROT_CARDS (card_id, card_name, arcana_type, meaning, image) VALUES
(1, 'The Fool', 'Major Arcana', 'New beginnings, innocence, spontaneity, and a free spirit. Take a leap of faith into new adventures with the playful curiosity of a cat!', '/assets/cards/card_0.svg'),
(2, 'The Magician', 'Major Arcana', 'Manifestation, resourcefulness, power, and inspired action. You possess all the mystical tools you need to create your desired reality.', '/assets/cards/card_1.svg'),
(3, 'The High Priestess', 'Major Arcana', 'Intuition, sacred knowledge, divine feminine, and the subconscious mind. Listen to the quiet whisper of your mystical inner voice.', '/assets/cards/card_2.svg'),
(4, 'The Empress', 'Major Arcana', 'This card encourages you to take care of yourself and what you value, trust the process, and allow things to develop with patience and care.', '/assets/cards/card_3.svg'),
(5, 'The Emperor', 'Major Arcana', 'Authority, structure, stability, and protective leadership. Establish solid boundaries and order in your kingdom.', '/assets/cards/card_4.svg'),
(6, 'The Hierophant', 'Major Arcana', 'Spiritual wisdom, tradition, institutions, and mentorship. Seek guidance from ancestral wisdom and trusted traditions.', '/assets/cards/card_5.svg'),
(7, 'The Lovers', 'Major Arcana', 'Love, harmony, partnerships, and values alignment. Meaningful soul choices and affectionate bonds bring happiness.', '/assets/cards/card_6.svg'),
(8, 'The Chariot', 'Major Arcana', 'Control, willpower, success, and determination. Stay focused and driven toward your highest ambition with relentless zeal.', '/assets/cards/card_7.svg'),
(9, 'Strength', 'Major Arcana', 'Courage, persuasion, compassion, and gentle influence. True power comes not from force, but from inner calmness and gentle grace.', '/assets/cards/card_8.svg'),
(10, 'The Hermit', 'Major Arcana', 'Soul-searching, introspection, solitude, and inner guidance. Step back to illuminate your personal path with contemplative silence.', '/assets/cards/card_9.svg'),
(11, 'Wheel of Fortune', 'Major Arcana', 'Good luck, karma, life cycles, and destiny. The cosmic wheel turns in your favor; welcome divine timing and positive shifts.', '/assets/cards/card_10.svg'),
(12, 'Justice', 'Major Arcana', 'Fairness, truth, cause and effect, and ethical clarity. Decisions will be balanced with karmic precision and honesty.', '/assets/cards/card_11.svg'),
(13, 'The Hanged Man', 'Major Arcana', 'Surrender, letting go, new perspectives, and pause. Wisdom comes when you view the world from an unexpected angle.', '/assets/cards/card_12.svg'),
(14, 'Death & Rebirth', 'Major Arcana', 'Endings, major transformation, transitions, and shedding the old to invite dazzling fresh blooms.', '/assets/cards/card_13.svg'),
(15, 'Temperance', 'Major Arcana', 'Balance, moderation, patience, and purpose. Blending diverse elements into a serene potion of harmony.', '/assets/cards/card_14.svg'),
(16, 'The Star', 'Major Arcana', 'Hope, faith, renewal, inspiration, and spiritual blessings. A bright guiding light shines over your most heartfelt wishes.', '/assets/cards/card_15.svg'),
(17, 'The Moon', 'Major Arcana', 'Illusion, fear, anxiety, subconscious intuition, and mystical dreaming. Trust your night senses through murky waters.', '/assets/cards/card_16.svg'),
(18, 'The Sun', 'Major Arcana', 'Positivity, fun, warmth, success, and vitality. Radiant joy and abundant happiness illuminate every corner of your life!', '/assets/cards/card_17.svg'),
(19, 'Judgement', 'Major Arcana', 'Awakening, rebirth, inner calling, and absolution. Heed your higher purpose and rise into renewed clarity.', '/assets/cards/card_18.svg'),
(20, 'The World', 'Major Arcana', 'Completion, integration, accomplishment, and travel. A grand cycle finishes in triumphant fulfillment and wholeness.', '/assets/cards/card_19.svg'),
(21, 'Queen of Wands', 'Minor Arcana', 'This card is a positive sign of self-confidence, leadership, and pursuing your goals with enthusiasm. It encourages you to believe in yourself, show your true personality, and take the initiative rather than waiting for others to make the first move.', '/assets/cards/card_20.svg'),
(22, 'Ace of Cups', 'Minor Arcana', 'Overwhelming love, compassion, creative fertility, and spiritual peace. Your emotional vessel overflows with sweet blessings.', '/assets/cards/card_21.svg');

-- Insert Daily Predictions
INSERT IGNORE INTO DAILY_PREDICTIONS (daily_prediction_id, card_id, message) VALUES
(1, 4, 'This card encourages you to take care of yourself and what you value, trust the process, and allow things to develop with patience and care.'),
(2, 18, 'A surge of bright optimism and warm vitality awaits you today. Celebrate small victories and share your sunshine with everyone around.'),
(3, 16, 'Keep hope alive today. Serendipitous synchronicities are gently nudging you toward your fondest dreams.'),
(4, 2, 'Focus your intent and manifest your goals. Today is the perfect day to begin that project you have been envisioning.'),
(5, 11, 'A delightful turn of events brings pleasant surprises. Stay adaptable and ride the cosmic wave with a smile.'),
(6, 9, 'Gentle persuasion and compassionate patience will conquer any obstacle you face today. Trust your quiet inner power.'),
(7, 21, 'This card is a positive sign of self-confidence, leadership, and pursuing your goals with enthusiasm. Take the initiative today!');

-- =======================================================
-- Demo seed: one account per role + a few readings
-- Run AFTER schema.sql and sample_data.sql
-- (Passwords are placeholder bcrypt-style strings; the running app hashes its own.)
-- =======================================================
USE meow_meow_tarot;

-- Trigger trg_assign_zodiac_before_insert fills zodiac_id from birth_date
INSERT INTO USERS (name, email, password, birth_date, role) VALUES
('Admin Meow',     'admin@meowtarot.com', '$2b$10$placeholderHashForDemoOnly000000000000000000000000', '1999-04-10', 'admin'),
('Developer Meow', 'dev@meowtarot.com',   '$2b$10$placeholderHashForDemoOnly000000000000000000000000', '2000-08-15', 'developer'),
('testja',         'testja@meowtarot.com','$2b$10$placeholderHashForDemoOnly000000000000000000000000', '2003-01-05', 'user');

-- Trigger trg_after_tarot_reading_insert writes one READING_AUDIT_LOGS row per reading
INSERT INTO TAROT_READINGS (user_id, card_id, reading_date, question) VALUES
(3, 1,  NOW(), 'General Reading'),
(3, 18, NOW(), 'General Reading'),
(2, 13, NOW(), 'General Reading');

INSERT INTO NUMEROLOGY (user_id, life_path_number, meaning, calculated_date) VALUES
(3, 1, 'Natural born leader, pioneer, and innovator.', NOW());

INSERT INTO USER_DAILY_PREDICTIONS (user_id, daily_prediction_id, opened_at) VALUES
(3, 2, NOW());
