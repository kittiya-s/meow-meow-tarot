-- Schema for Meow Meow Tarot (MySQL / MariaDB compatible)
-- CSS326 Database Design & Implementation

CREATE DATABASE IF NOT EXISTS meow_meow_tarot;
USE meow_meow_tarot;

-- 1. ZODIAC Table
CREATE TABLE IF NOT EXISTS ZODIAC (
    zodiac_id INT AUTO_INCREMENT PRIMARY KEY,
    zodiac_name VARCHAR(50) NOT NULL UNIQUE,
    element VARCHAR(50) NOT NULL,
    symbol VARCHAR(10),
    date_range VARCHAR(50)
);

-- 2. HOROSCOPES Table (1:1 with ZODIAC)
CREATE TABLE IF NOT EXISTS HOROSCOPES (
    horoscope_id INT AUTO_INCREMENT PRIMARY KEY,
    zodiac_id INT NOT NULL UNIQUE,
    overall TEXT NOT NULL,
    study TEXT NOT NULL,
    work TEXT NOT NULL,
    love TEXT NOT NULL,
    FOREIGN KEY (zodiac_id) REFERENCES ZODIAC(zodiac_id) ON DELETE CASCADE
);

-- 3. USERS Table (N:1 with ZODIAC)
CREATE TABLE IF NOT EXISTS USERS (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    zodiac_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zodiac_id) REFERENCES ZODIAC(zodiac_id) ON DELETE SET NULL
);

-- 4. TAROT_CARDS Table
CREATE TABLE IF NOT EXISTS TAROT_CARDS (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    card_name VARCHAR(100) NOT NULL,
    arcana_type VARCHAR(50) DEFAULT 'Major Arcana',
    meaning TEXT NOT NULL,
    upright_meaning TEXT,
    reversed_meaning TEXT,
    image VARCHAR(255) NOT NULL
);

-- 5. TAROT_READINGS Table (1:N with USERS, N:1 with TAROT_CARDS)
CREATE TABLE IF NOT EXISTS TAROT_READINGS (
    reading_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    card_id INT NOT NULL,
    reading_date DATETIME NOT NULL,
    question TEXT,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES TAROT_CARDS(card_id) ON DELETE CASCADE
);

-- 6. DAILY_PREDICTIONS Table (Pool of daily messages)
CREATE TABLE IF NOT EXISTS DAILY_PREDICTIONS (
    daily_prediction_id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    FOREIGN KEY (card_id) REFERENCES TAROT_CARDS(card_id) ON DELETE SET NULL
);

-- 7. USER_DAILY_PREDICTIONS Table (M:N tracking between USERS and DAILY_PREDICTIONS)
CREATE TABLE IF NOT EXISTS USER_DAILY_PREDICTIONS (
    open_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    daily_prediction_id INT NOT NULL,
    opened_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (daily_prediction_id) REFERENCES DAILY_PREDICTIONS(daily_prediction_id) ON DELETE CASCADE
);

-- 8. NUMEROLOGY Table (1:N with USERS)
CREATE TABLE IF NOT EXISTS NUMEROLOGY (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    life_path_number INT NOT NULL,
    meaning TEXT NOT NULL,
    calculated_date DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

