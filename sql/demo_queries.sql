-- =======================================================
-- Meow Meow Tarot: demo queries for MySQL Workbench
-- Select one block and press Ctrl+Shift+Enter (or the lightning bolt with cursor)
-- =======================================================
USE meow_meow_tarot;
SET SQL_SAFE_UPDATES = 0;  -- allow UPDATE/DELETE by name in this demo session

-- 1) PK / FK of linked tables (TAROT_READINGS -> USERS, TAROT_CARDS)
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'meow_meow_tarot'
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- 2) Relationship in a query (JOIN across 1:N and N:1)
SELECT u.name, u.role, z.zodiac_name, tc.card_name, tr.reading_date
FROM TAROT_READINGS tr
JOIN USERS u        ON u.user_id = tr.user_id
JOIN TAROT_CARDS tc ON tc.card_id = tr.card_id
LEFT JOIN ZODIAC z  ON z.zodiac_id = u.zodiac_id
ORDER BY tr.reading_date DESC;

-- 3) M:N through the junction table USER_DAILY_PREDICTIONS
SELECT u.name, dp.message, udp.opened_at
FROM USER_DAILY_PREDICTIONS udp
JOIN USERS u              ON u.user_id = udp.user_id
JOIN DAILY_PREDICTIONS dp ON dp.daily_prediction_id = udp.daily_prediction_id;

-- 4) Roles
SELECT user_id, name, email, role, zodiac_id FROM USERS;

-- 5) STORED PROCEDURE: life path number
CALL sp_calculate_life_path('1999-04-10', @life_path);
SELECT @life_path AS life_path_number;

-- 6) TRIGGER (zodiac): insert a user, zodiac_id is filled automatically
INSERT INTO USERS (name, email, password, birth_date)
VALUES ('Trigger Test', 'trigger@test.com', 'x', '2001-07-30');
SELECT name, birth_date, zodiac_id, (SELECT zodiac_name FROM ZODIAC z WHERE z.zodiac_id = USERS.zodiac_id) AS zodiac
FROM USERS WHERE email = 'trigger@test.com';

-- 7) TRIGGER (audit log): add a reading, a log row appears automatically
INSERT INTO TAROT_READINGS (user_id, card_id, reading_date) VALUES (3, 8, NOW());
SELECT * FROM READING_AUDIT_LOGS ORDER BY log_id DESC;

-- 8) FK ON DELETE CASCADE: deleting a user removes their readings
SET @tid = (SELECT user_id FROM USERS WHERE email = 'trigger@test.com');
INSERT INTO TAROT_READINGS (user_id, card_id, reading_date) VALUES (@tid, 5, NOW());
SELECT COUNT(*) AS readings_before FROM TAROT_READINGS WHERE user_id = @tid;
DELETE FROM USERS WHERE user_id = @tid;
SELECT COUNT(*) AS readings_after FROM TAROT_READINGS WHERE user_id = @tid;

-- 9) CRUD on TAROT_CARDS (same operations as the Admin dashboard)
INSERT INTO TAROT_CARDS (card_name, arcana_type, meaning, image)
VALUES ('The Tower', 'Major Arcana', 'Sudden change and revelation.', '/assets/cards/card_back.svg');
UPDATE TAROT_CARDS SET meaning = 'Sudden change, revelation and awakening.' WHERE card_name = 'The Tower';
SELECT * FROM TAROT_CARDS ORDER BY card_id DESC LIMIT 3;
DELETE FROM TAROT_CARDS WHERE card_name = 'The Tower';

-- 10) Row counts of every table
SELECT 'USERS' t, COUNT(*) n FROM USERS UNION ALL
SELECT 'ZODIAC', COUNT(*) FROM ZODIAC UNION ALL
SELECT 'HOROSCOPES', COUNT(*) FROM HOROSCOPES UNION ALL
SELECT 'TAROT_CARDS', COUNT(*) FROM TAROT_CARDS UNION ALL
SELECT 'TAROT_READINGS', COUNT(*) FROM TAROT_READINGS UNION ALL
SELECT 'READING_AUDIT_LOGS', COUNT(*) FROM READING_AUDIT_LOGS UNION ALL
SELECT 'DAILY_PREDICTIONS', COUNT(*) FROM DAILY_PREDICTIONS UNION ALL
SELECT 'USER_DAILY_PREDICTIONS', COUNT(*) FROM USER_DAILY_PREDICTIONS UNION ALL
SELECT 'NUMEROLOGY', COUNT(*) FROM NUMEROLOGY;
