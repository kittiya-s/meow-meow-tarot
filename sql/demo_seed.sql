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
