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

